<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { MathUtils, PerspectiveCamera, Quaternion, Spherical, Vector3 } from 'three';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { AU_TO_SCENE } from '$lib/scene-config';
  import { isPlanetBody } from '$lib/registry/types';
  import { overviewDistance, selection, SOLAR_SYSTEM_VIEW } from '$stores/selection';
  import { cameraCommand, selectBody } from '$stores/ui';
  import { hoveredBody } from '$stores/sceneHover';
  import { prefersReducedMotion } from 'svelte/motion';
  import { introComplete, sceneReady, viewInset } from '$stores/scene';
  import { simTime } from '$stores/simTime';
  import { framingDistance, minimumDistance } from '$utils/bodyMetrics';
  import { easeInOutCubic, easeOutCubic } from '$utils/easing';
  import { flightDuration, flightLogDistance, framingDirection } from '$utils/flight';
  import { pickBody } from '$utils/screenSpace';
  import { BODIES, BODY_COUNT, RADII, indexOf, parentOf, positions, valid } from './bodyState';
  import { hooks, lens, screen } from './overlay';
  import { pendingTextures } from './textures';

  /**
   * Orbit camera around the selected body. Rotation, zoom, and pan move goals
   * that the camera eases toward, so input glides and settles with inertia.
   * Zoom works on log altitude above the focused surface, which feels the same
   * at the ISS and at Neptune. Zooming far out of a moon or satellite drifts
   * the orbit center to its parent, and the camera never enters a body.
   *
   * First load: the canvas stays dark until the first view's textures are in,
   * then fades up while the camera eases in from a wider framing; markers and
   * labels fade in once it settles. Any input takes over immediately.
   */

  const FOV = 45;
  const MAX_DISTANCE = 400 * AU_TO_SCENE;
  const ORIGIN = new Vector3();
  const UP = new Vector3(0, 1, 0);

  const { size, renderer } = useThrelte();
  const cam = new PerspectiveCamera(FOV, 1, 1e-6, 1e12);

  let focus = -1;
  let shiftX = 0;
  let shiftY = 0;
  let appliedX = 0;
  let appliedY = 0;
  let spherical = new Spherical(1, 1, 0);
  let azimuthGoal = 0;
  let polarGoal = 1;
  let logAltitude = 0;
  let logAltitudeGoal = 0;
  let azimuthVelocity = 0;
  let polarVelocity = 0;
  let zoomVelocity = 0;
  const pan = new Vector3();
  const panGoal = new Vector3();
  const center = new Vector3();
  const anchor = new Vector3();
  const lastAnchor = new Vector3();
  const direction = new Vector3();
  const scratch = new Vector3();
  const ray = new Vector3();
  const pole = new Vector3();
  const destination = new Vector3();

  let flight: {
    start: number;
    duration: number;
    intro: boolean;
    fromCenter: Vector3;
    fromDirection: Quaternion;
    toDirection: Quaternion;
    fromDistance: number;
    toDistance: number;
    separation: number;
  } | null = null;
  const fromCenter = new Vector3();
  const fromQuat = new Quaternion();
  const toQuat = new Quaternion();
  const flightQuat = new Quaternion();
  // Orbit frame (local to world). Ecliptic north is up, except in low orbit,
  // where up follows the local vertical so the planet stays below the camera.
  const frame = new Quaternion();
  const frameGoal = new Quaternion();
  const frameStart = new Quaternion();
  const frameInverse = new Quaternion();
  const radial = new Vector3();
  let placed = false;
  let awaitingPosition = false;
  let introStarted = -1;
  const INTRO_MS = 2600;
  // Where the intro flight ends, held while the first view's textures load.
  const fromTarget = new Vector3();
  let fromTargetDistance = 0;
  // Camera motion during a flight, handed to the damping when the user interrupts.
  const tracked = new Spherical();
  let trackedLog = 0;
  let flightVelocity = { azimuth: 0, polar: 0, zoom: 0 };

  function updateFrameGoal(): void {
    const parent = focus >= 0 ? parentOf(focus) : -1;
    if (parent > 0 && valid[focus] && valid[parent]) {
      radial.copy(positions[focus]).sub(positions[parent]);
      if (radial.length() < 3 * RADII[parent]) {
        frameGoal.setFromUnitVectors(UP, radial.normalize());
        return;
      }
    }
    frameGoal.identity();
  }
  function toLocal(v: Vector3): Vector3 {
    return v.applyQuaternion(frameInverse.copy(frame).invert());
  }
  function toWorld(v: Vector3): Vector3 {
    return v.applyQuaternion(frame);
  }

  function surfaceRadius(): number {
    return focus >= 0 ? RADII[focus] : 0;
  }
  function minLogAltitude(): number {
    const body = focus >= 0 ? BODIES[focus] : null;
    return Math.log(Math.max((body ? minimumDistance(body) : 1) - surfaceRadius(), 1e-9));
  }
  function distanceFromLog(log: number): number {
    return surfaceRadius() + Math.exp(log);
  }
  function setDistance(distance: number): void {
    logAltitude = logAltitudeGoal = Math.log(Math.max(distance - surfaceRadius(), 1e-9));
  }

  /** Orbit center: the focused body, drifting to its parent as the camera pulls far back. */
  function resolveAnchor(distance: number, out: Vector3): Vector3 {
    if (focus < 0) return out.copy(ORIGIN);
    const parent = parentOf(focus);
    if (!valid[focus])
      return parent >= 0 && valid[parent] ? out.copy(positions[parent]) : out.copy(lastAnchor);
    out.copy(positions[focus]);
    if (parent >= 0 && valid[parent]) {
      const separation = positions[focus].distanceTo(positions[parent]);
      const drift = MathUtils.smoothstep(distance, separation * 1.5, separation * 8);
      if (drift > 0) out.lerp(positions[parent], drift);
    }
    return out;
  }

  function flyTo(id: string | null, instant = false): void {
    setHover(-1);
    focus = id === SOLAR_SYSTEM_VIEW ? -1 : indexOf(id);
    const body = focus >= 0 ? BODIES[focus] : null;
    const { width, height } = size.current;
    const inset = get(viewInset);
    const aspect = (width + inset.right) / Math.max(height + inset.bottom, 1);
    const date = get(simTime);
    const toDistance = body
      ? framingDistance(body, date, MathUtils.degToRad(FOV), aspect)
      : get(overviewDistance) * Math.max(1, 1.4 / aspect);
    const target = resolveAnchor(toDistance, destination);
    const parent = focus >= 0 ? parentOf(focus) : -1;
    const ringed = body && isPlanetBody(body) && body.metadata.hasRings && body.metadata.poleVec;
    if (ringed) pole.set(...body.metadata.poleVec!);
    framingDirection(
      target,
      parent > 0 && valid[parent] ? positions[parent] : null,
      !body || (RADII[focus] > 0 && body.rendererKind !== 'satellite-marker'),
      ringed ? pole : null,
      direction,
      parent > 0 ? RADII[parent] : 0
    );
    // Live satellites may not have a position yet; frame them again once they do.
    awaitingPosition = !!body && !valid[focus];
    if (!body) direction.set(0.45, 0.72, 0.9).normalize();
    panGoal.set(0, 0, 0);
    azimuthVelocity = polarVelocity = 0;
    const fromDistance = cam.position.distanceTo(center);
    const separation = center.distanceTo(target);
    if (instant || !placed || prefersReducedMotion.current) {
      flight = null;
      pan.set(0, 0, 0);
      updateFrameGoal();
      frame.copy(frameGoal);
      spherical.setFromVector3(toLocal(scratch.copy(direction)));
      azimuthGoal = spherical.theta;
      polarGoal = spherical.phi;
      setDistance(toDistance);
      center.copy(target);
      cam.position.copy(target).addScaledVector(direction, toDistance);
      if (!placed && !prefersReducedMotion.current) {
        // Hold a wider, rotated framing in the dark until the view is ready.
        introStarted = performance.now();
        spherical.theta -= 0.55;
        spherical.phi = Math.max(0.3, spherical.phi - 0.25);
        spherical.radius = toDistance * 5;
        cam.position.copy(toWorld(scratch.setFromSpherical(spherical))).add(target);
        fromTarget.copy(direction);
        fromTargetDistance = toDistance;
      } else finishIntro();
      placed = true;
      return;
    }
    startFlight(fromDistance, toDistance, separation, false);
  }

  function startFlight(
    fromDistance: number,
    toDistance: number,
    separation: number,
    intro: boolean
  ) {
    fromCenter.copy(center);
    updateFrameGoal();
    frameStart.copy(frame);
    fromQuat.setFromUnitVectors(UP, scratch.copy(cam.position).sub(center).normalize());
    toQuat.setFromUnitVectors(UP, direction);
    tracked.setFromVector3(toLocal(scratch.copy(cam.position).sub(center)));
    trackedLog = Math.log(Math.max(tracked.radius - surfaceRadius(), 1e-9));
    flight = {
      start: performance.now(),
      intro,
      duration: intro ? INTRO_MS : flightDuration(fromDistance, toDistance, separation),
      fromCenter,
      fromDirection: fromQuat,
      toDirection: toQuat,
      fromDistance,
      toDistance,
      separation
    };
  }

  function finishIntro(): void {
    introStarted = -1;
    sceneReady.set(true);
    introComplete.set(true);
  }

  /** Stop flying where the camera is, keeping its current motion as inertia. */
  function endFlight(): void {
    if (introStarted >= 0 && !flight) finishIntro();
    if (!flight) return;
    if (flight.intro) finishIntro();
    flight = null;
    spherical.setFromVector3(toLocal(scratch.copy(cam.position).sub(center)));
    azimuthGoal = spherical.theta;
    polarGoal = spherical.phi;
    pan.copy(center).sub(resolveAnchor(spherical.radius, anchor));
    panGoal.copy(pan);
    setDistance(spherical.radius);
    azimuthVelocity = flightVelocity.azimuth;
    polarVelocity = flightVelocity.polar;
    zoomVelocity = flightVelocity.zoom;
    flightVelocity = { azimuth: 0, polar: 0, zoom: 0 };
  }

  // ── Input ──────────────────────────────────────────────────────────────
  const pointers = new Map<number, { x: number; y: number }>();
  let gesture: 'rotate' | 'pan' | 'touch' | null = null;
  let downAt = { x: 0, y: 0, time: 0 };
  let moved = false;
  let lastTap = { x: 0, y: 0, time: 0 };
  let pinchDistance = 0;
  const centroid = { x: 0, y: 0 };
  let lastMoveTime = 0;

  function localPoint(event: { clientX: number; clientY: number }) {
    const rect = renderer.domElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function updateCentroid(): void {
    let x = 0;
    let y = 0;
    for (const p of pointers.values()) {
      x += p.x;
      y += p.y;
    }
    centroid.x = x / pointers.size;
    centroid.y = y / pointers.size;
    const [a, b] = pointers.values();
    pinchDistance = b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  function rotateBy(dx: number, dy: number, dt: number): void {
    const height = Math.max(size.current.height, 1);
    const dAzimuth = (-2 * Math.PI * dx) / height;
    const dPolar = (-2 * Math.PI * dy) / height;
    azimuthGoal += dAzimuth;
    polarGoal = MathUtils.clamp(polarGoal + dPolar, 0.02, Math.PI - 0.02);
    if (dt > 0) {
      azimuthVelocity = MathUtils.lerp(azimuthVelocity, dAzimuth / dt, 0.5);
      polarVelocity = MathUtils.lerp(polarVelocity, dPolar / dt, 0.5);
    }
  }
  function panBy(dx: number, dy: number): void {
    const distance = cam.position.distanceTo(center);
    const scale = distance / lens(cam, size.current.width, size.current.height).focal;
    scratch.setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(-dx * scale);
    panGoal.add(scratch);
    scratch.setFromMatrixColumn(cam.matrixWorld, 1).multiplyScalar(dy * scale);
    panGoal.add(scratch);
  }
  /** Zoom by a log factor; with nothing focused, keep the point under the cursor fixed. */
  function zoomBy(logFactor: number, at?: { x: number; y: number }): void {
    endFlight();
    zoomVelocity = 0;
    const before = logAltitudeGoal;
    logAltitudeGoal = MathUtils.clamp(
      logAltitudeGoal + logFactor,
      minLogAltitude(),
      Math.log(MAX_DISTANCE)
    );
    if (focus >= 0 || !at) return;
    const factor = Math.exp(logAltitudeGoal - before);
    const { width, height } = size.current;
    scratch
      .set((at.x / width) * 2 - 1, -(at.y / height) * 2 + 1, 0.5)
      .unproject(cam)
      .sub(cam.position);
    ray.copy(center).sub(cam.position);
    const along = ray.lengthSq() / Math.max(scratch.dot(ray), 1e-30);
    scratch.multiplyScalar(along).add(cam.position).sub(center);
    panGoal.addScaledVector(scratch, 1 - factor);
  }

  function pick(point: { x: number; y: number }): number {
    return pickBody(screen, point.x, point.y, 14);
  }
  function setHover(index: number): void {
    if (index === hooks.hovered) return;
    hooks.hovered = index;
    hoveredBody.set(index >= 0 ? BODIES[index].name : null);
    renderer.domElement.style.cursor = index >= 0 ? 'pointer' : '';
  }

  onMount(() => {
    const element = renderer.domElement;
    element.style.touchAction = 'none';
    const down = (event: PointerEvent) => {
      element.setPointerCapture(event.pointerId);
      const point = localPoint(event);
      pointers.set(event.pointerId, point);
      updateCentroid();
      if (pointers.size === 1) {
        downAt = { ...point, time: performance.now() };
        moved = false;
        lastMoveTime = downAt.time;
        const panButton =
          event.button === 2 || event.button === 1 || event.shiftKey || event.ctrlKey;
        gesture = event.pointerType === 'touch' ? 'rotate' : panButton ? 'pan' : 'rotate';
      } else gesture = 'touch';
      endFlight();
      azimuthVelocity = polarVelocity = zoomVelocity = 0;
    };
    const move = (event: PointerEvent) => {
      const point = localPoint(event);
      const previous = pointers.get(event.pointerId);
      if (!previous) {
        if (event.pointerType !== 'touch') setHover(pick(point));
        return;
      }
      const now = performance.now();
      if (
        Math.hypot(point.x - downAt.x, point.y - downAt.y) > (event.pointerType === 'touch' ? 8 : 4)
      )
        moved = true;
      if (gesture === 'touch') {
        const lastCentroid = { ...centroid };
        const lastPinch = pinchDistance;
        pointers.set(event.pointerId, point);
        updateCentroid();
        if (lastPinch > 0 && pinchDistance > 0)
          zoomBy(Math.log(lastPinch / pinchDistance), centroid);
        panBy(centroid.x - lastCentroid.x, centroid.y - lastCentroid.y);
      } else {
        pointers.set(event.pointerId, point);
        if (!moved) return;
        if (gesture === 'pan') panBy(point.x - previous.x, point.y - previous.y);
        else rotateBy(point.x - previous.x, point.y - previous.y, (now - lastMoveTime) / 1000);
      }
      lastMoveTime = now;
      setHover(-1);
    };
    const up = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return;
      if (pointers.size > 0) {
        updateCentroid();
        gesture = pointers.size === 1 ? 'rotate' : 'touch';
        return;
      }
      if (performance.now() - lastMoveTime > 80) azimuthVelocity = polarVelocity = 0;
      gesture = null;
      if (moved || event.type === 'pointercancel') return;
      const point = localPoint(event);
      const hit = pick(point);
      const now = performance.now();
      const doubleTap =
        now - lastTap.time < 320 && Math.hypot(point.x - lastTap.x, point.y - lastTap.y) < 24;
      lastTap = { ...point, time: now };
      if (hit >= 0 && hit !== focus) selectBody(BODIES[hit].id);
      else if (doubleTap) requested = get(selection);
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      zoomBy(pixels * (event.ctrlKey ? 0.01 : 0.0022), localPoint(event));
    };
    const leave = () => setHover(-1);
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        target?.closest('input, textarea, select, [contenteditable="true"], dialog[open]')
      )
        return;
      if (introStarted >= 0) endFlight();
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        zoomBy(event.key === 'ArrowUp' ? -0.35 : 0.35);
      }
    };
    const menu = (event: Event) => event.preventDefault();
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    element.addEventListener('pointerleave', leave);
    element.addEventListener('wheel', wheel, { passive: false });
    element.addEventListener('contextmenu', menu);
    window.addEventListener('keydown', key);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      element.removeEventListener('pointerleave', leave);
      element.removeEventListener('wheel', wheel);
      element.removeEventListener('contextmenu', menu);
      window.removeEventListener('keydown', key);
      setHover(-1);
      // The next visit to the explorer plays its own intro.
      sceneReady.set(false);
      introComplete.set(false);
    };
  });

  // ── Commands ───────────────────────────────────────────────────────────
  let requested: string | null = null;
  $effect(() => {
    requested = $selection;
  });
  $effect(() => {
    void $overviewDistance;
    if (get(selection) === SOLAR_SYSTEM_VIEW) requested = SOLAR_SYSTEM_VIEW;
  });
  $effect(() => {
    const command = $cameraCommand;
    if (!command) return;
    if (command === 'reset') requested = get(selection);
    else if (command === 'top') {
      endFlight();
      polarGoal = 0.02;
    } else zoomBy(command === 'zoom-in' ? -0.6 : 0.6);
    cameraCommand.set(null);
  });

  // ── Frame ──────────────────────────────────────────────────────────────
  useTask(
    'camera',
    (delta) => {
      const dt = Math.min(delta, 0.1);
      const { width, height } = size.current;
      const inset = $viewInset;
      const ease = prefersReducedMotion.current ? 1 : 1 - Math.exp(-dt * 7);
      shiftX =
        Math.abs(inset.right - shiftX) < 0.5
          ? inset.right
          : MathUtils.lerp(shiftX, inset.right, ease);
      shiftY =
        Math.abs(inset.bottom - shiftY) < 0.5
          ? inset.bottom
          : MathUtils.lerp(shiftY, inset.bottom, ease);
      const aspect = (width + shiftX) / Math.max(height + shiftY, 1);
      if (cam.aspect !== aspect || appliedX !== shiftX || appliedY !== shiftY) {
        cam.aspect = aspect;
        appliedX = shiftX;
        appliedY = shiftY;
        // Render the canvas as the top-right window of a larger view; both calls update the projection.
        if (shiftX > 0 || shiftY > 0)
          cam.setViewOffset(width + shiftX, height + shiftY, shiftX, shiftY, width, height);
        else cam.clearViewOffset();
      }
      if (awaitingPosition && valid[focus]) requested = BODIES[focus].id;
      if (requested !== null && introStarted < 0) {
        flyTo(requested);
        requested = null;
      }
      // The intro waits (in the dark) for the first view's textures, at most a few seconds.
      if (introStarted >= 0 && !flight) {
        const waited = performance.now() - introStarted;
        if ((pendingTextures() === 0 && waited > 250) || waited > 4000) {
          sceneReady.set(true);
          direction.copy(fromTarget);
          startFlight(cam.position.distanceTo(center), fromTargetDistance, 0, true);
        }
      }

      if (flight) {
        const t =
          flight.duration > 0
            ? Math.min(1, (performance.now() - flight.start) / flight.duration)
            : 1;
        const eased = flight.intro ? easeOutCubic(t) : easeInOutCubic(t);
        const target = focus >= 0 ? resolveAnchor(flight.toDistance, anchor) : ORIGIN;
        center.lerpVectors(flight.fromCenter, target, eased);
        flightQuat.slerpQuaternions(flight.fromDirection, flight.toDirection, eased);
        updateFrameGoal();
        frame.slerpQuaternions(frameStart, frameGoal, eased);
        direction.copy(UP).applyQuaternion(flightQuat);
        const distance = Math.exp(
          flightLogDistance(flight.fromDistance, flight.toDistance, flight.separation, eased)
        );
        cam.position.copy(center).addScaledVector(direction, distance);
        if (dt > 0) {
          const previousTheta = tracked.theta;
          const previousPhi = tracked.phi;
          tracked.setFromVector3(toLocal(scratch.copy(cam.position).sub(center)));
          const log = Math.log(Math.max(tracked.radius - surfaceRadius(), 1e-9));
          const turn = tracked.theta - previousTheta;
          flightVelocity.azimuth = Math.atan2(Math.sin(turn), Math.cos(turn)) / dt;
          flightVelocity.polar = (tracked.phi - previousPhi) / dt;
          flightVelocity.zoom = (log - trackedLog) / dt;
          trackedLog = log;
        }
        if (t >= 1) endFlight();
      } else if (introStarted < 0) {
        if (!gesture) {
          const friction = Math.exp(-dt * 5);
          azimuthGoal += azimuthVelocity * dt;
          polarGoal = MathUtils.clamp(polarGoal + polarVelocity * dt, 0.02, Math.PI - 0.02);
          azimuthVelocity *= friction;
          polarVelocity *= friction;
        }
        logAltitudeGoal += zoomVelocity * dt;
        zoomVelocity *= Math.exp(-dt * 4);
        const turn = 1 - Math.exp(-dt * 16);
        const zoom = 1 - Math.exp(-dt * 11);
        spherical.theta += (azimuthGoal - spherical.theta) * turn;
        spherical.phi += (polarGoal - spherical.phi) * turn;
        logAltitudeGoal = Math.max(logAltitudeGoal, minLogAltitude());
        logAltitude += (logAltitudeGoal - logAltitude) * zoom;
        pan.lerp(panGoal, zoom);
        spherical.radius = distanceFromLog(logAltitude);
        center.copy(resolveAnchor(spherical.radius, anchor)).add(pan);
        updateFrameGoal();
        frame.slerp(frameGoal, 1 - Math.exp(-dt * 3));
        cam.position.copy(toWorld(scratch.setFromSpherical(spherical))).add(center);
      }
      lastAnchor.copy(focus >= 0 && valid[focus] ? positions[focus] : ORIGIN);

      // Never let the camera sit inside a body, whatever moved.
      for (let i = 0; i < BODY_COUNT; i++) {
        const radius = RADII[i];
        if (radius <= 0 || !valid[i]) continue;
        const limit = radius * 1.001;
        scratch.copy(cam.position).sub(positions[i]);
        if (scratch.lengthSq() < limit * limit)
          cam.position.copy(positions[i]).addScaledVector(scratch.normalize(), limit);
      }
      cam.up.copy(UP).applyQuaternion(frame);
      cam.lookAt(center);
      hooks.viewDistance = cam.position.distanceTo(center);
      cam.updateMatrixWorld();
    },
    { after: 'bodies' }
  );
</script>

<T is={cam} makeDefault />
