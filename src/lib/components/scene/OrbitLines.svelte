<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import {
    AdditiveBlending,
    Color,
    Group,
    MathUtils,
    ShaderMaterial,
    Vector3,
    type PerspectiveCamera
  } from 'three';
  import { get } from 'svelte/store';
  import { selection } from '$stores/selection';
  import { simTime } from '$stores/simTime';
  import { showOrbits, showTrails } from '$stores/ui';
  import { orbitalPeriodMs, orbitSampleOffsetMs } from '$utils/orbit';
  import { BODIES, BODY_COUNT, RADII, indexOf, parentOf, positions, valid } from './bodyState';
  import { createLineStrip } from './polyline';
  import { hooks } from './overlay';

  /**
   * Orbits drawn relative to each body's current position, so the line passes
   * exactly through the body at any zoom and stays precise near it. Like NASA
   * Eyes, the stretch just behind the body is brightest and fades around the
   * orbit. Planets always show their orbits; moons appear for the focused
   * system, and any other body's orbit appears when it is selected.
   */

  const SAMPLES = 256;
  const NEUTRAL = new Color('#9fb2c2');
  const ACCENT = new Color('#00b2ff');
  const { camera, size } = useThrelte();
  const root = new Group();

  interface Orbit extends ReturnType<typeof createLineStrip> {
    material: ShaderMaterial;
    periodMs: number | null;
    checkedAt: number;
  }
  const orbits: (Orbit | null)[] = new Array(BODY_COUNT).fill(null);
  const always = Uint8Array.from(
    BODIES,
    (body) => +(body.parent === 'sun' && body.rendererKind === 'planet-body')
  );
  const moonLike = Uint8Array.from(BODIES, (body) => +(body.type === 'moon'));
  const sample = new Vector3();
  const current = new Vector3();
  const date = new Date();

  function create(): Orbit {
    const material = new ShaderMaterial({
      uniforms: { uColor: { value: new Color() } },
      vertexShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_vertex>
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }
      `,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_fragment>
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          #include <logdepthbuf_fragment>
          gl_FragColor = vec4(uColor * vAlpha, 1.0);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending
    });
    const strip = createLineStrip(SAMPLES, material, true);
    strip.line.renderOrder = 5;
    root.add(strip.line);
    return { ...strip, material, periodMs: null, checkedAt: -Infinity };
  }

  /** Returns false when the body has no drawable orbit at this date. */
  function rebuild(
    orbit: Orbit,
    index: number,
    now: number,
    strength: number,
    trail: number
  ): boolean {
    const body = BODIES[index];
    date.setTime(now);
    if (performance.now() - orbit.checkedAt > 2000) {
      orbit.periodMs = orbitalPeriodMs(body, date);
      orbit.checkedAt = performance.now();
    }
    if (!orbit.periodMs || !body.offsetFn(date, current)) return false;
    for (let k = 0; k < SAMPLES; k++) {
      const back = orbitSampleOffsetMs(k, SAMPLES, orbit.periodMs);
      date.setTime(now - back);
      if (!body.offsetFn(date, sample)) return false;
      sample.sub(current);
      orbit.positions.setXYZ(k, sample.x, sample.y, sample.z);
      const behind = 1 - back / orbit.periodMs;
      // Taper the far end: a period from vis-viva can leave a small gap where the orbit closes.
      const closing = 1 - MathUtils.smoothstep(k / (SAMPLES - 1), 0.97, 1);
      orbit.alphas!.setX(k, (strength + trail * behind * behind * behind) * closing);
    }
    orbit.positions.needsUpdate = true;
    orbit.alphas!.needsUpdate = true;
    return true;
  }

  useTask(
    () => {
      const orbitsOn = get(showOrbits);
      const trailsOn = get(showTrails);
      const selected = indexOf(get(selection));
      const system = selected >= 0 && moonLike[selected] ? parentOf(selected) : selected;
      const cam = camera.current as PerspectiveCamera;
      const { height } = size.current;
      const focal = height / 2 / Math.tan(MathUtils.degToRad(cam.fov) / 2);
      const now = get(simTime).getTime();
      for (let i = 0; i < BODY_COUNT; i++) {
        const isSelected = i === selected;
        const wanted =
          (orbitsOn || trailsOn) &&
          valid[i] &&
          (always[i] || isSelected || (moonLike[i] && parentOf(i) === system && system >= 0));
        let orbit = orbits[i];
        if (!wanted) {
          if (orbit) orbit.line.visible = false;
          continue;
        }
        const parent = parentOf(i);
        if (parent < 0) continue;
        orbit ??= orbits[i] = create();
        const orbitRadius = positions[i].distanceTo(positions[parent]);
        const parentDistance = Math.max(cam.position.distanceTo(positions[parent]), 1e-9);
        // Fade orbits too small to read, orbits of other bodies while the camera
        // is close in on something much smaller, and ones whose body fills the view.
        let fade = MathUtils.smoothstep((focal * orbitRadius) / parentDistance, 6, 40);
        if (!isSelected)
          fade *= MathUtils.smoothstep(hooks.viewDistance, orbitRadius * 0.01, orbitRadius * 0.08);
        const bodyPixels =
          (focal * RADII[i]) / Math.max(cam.position.distanceTo(positions[i]), 1e-9);
        fade *= 1 - MathUtils.smoothstep(bodyPixels, height * 0.02, height * 0.07);
        if (fade <= 0.01) {
          orbit.line.visible = false;
          continue;
        }
        const base = (isSelected ? 0.4 : 0.2) * (orbitsOn ? 1 : 0) * fade;
        const trail = (isSelected ? 0.6 : 0.4) * (trailsOn ? 1 : 0) * fade;
        orbit.line.visible = rebuild(orbit, i, now, base, trail);
        orbit.line.position.copy(positions[i]);
        orbit.material.uniforms.uColor.value.copy(isSelected ? ACCENT : NEUTRAL);
      }
    },
    { after: 'camera' }
  );
</script>

<T is={root} />
