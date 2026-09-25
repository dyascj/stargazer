<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { OrbitControls, interactivity } from '@threlte/extras';
  import { MOUSE, TOUCH, Vector3 } from 'three';
  import type { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { get } from 'svelte/store';
  import PlanetBody from './PlanetBody.svelte';
  import PointMarker from './PointMarker.svelte';
  import MoonOrbitRing from './MoonOrbitRing.svelte';
  import LabelLayer from './LabelLayer.svelte';
  import Starfield from './Starfield.svelte';
  import StarLabels from './StarLabels.svelte';
  import EclipticGrid from './EclipticGrid.svelte';
  import SunBloom from './SunBloom.svelte';
  import CometTail from './CometTail.svelte';
  import SatelliteMarker from './SatelliteMarker.svelte';
  import SatelliteOrbitPath from './SatelliteOrbitPath.svelte';
  import SatelliteFootprint from './SatelliteFootprint.svelte';
  import HelioSun from './HelioSun.svelte';
  import OrbitEllipse from './OrbitEllipse.svelte';
  import SelectionReticle from './SelectionReticle.svelte';
  import BodyTrail from './BodyTrail.svelte';
  import { selection, SOLAR_SYSTEM_VIEW, overviewDistance } from '$stores/selection';
  import { iss } from '$stores/iss';
  import { issTle } from '$stores/issTle';
  import { tiangong, tiangongTle } from '$stores/tiangong';
  import { simTime, advanceSimTime } from '$stores/simTime';
  import { cameraTargetDistance, cameraOriginDistance } from '$stores/cameraDistance';
  import { TRACKED_OBJECTS, getById, getWorldPosition } from '$lib/registry/registry';
  import { isPlanetBody } from '$lib/registry/types';
  import { onSceneClick } from '$utils/sceneClick';
  import { reducedMotion } from '$stores/reducedMotion';
  import {
    showOrbits,
    showLabels,
    showStars,
    showGrid,
    showStarLabels,
    showTrails,
    cameraCommand,
    selectBody
  } from '$stores/ui';

  const { camera, size } = useThrelte();
  interactivity();
  $effect(() => onSceneClick(selectBody));
  let controls = $state<ThreeOrbitControls>();
  let activeId: string | null = null;
  let flying = false;
  let startTime = 0;
  let duration = 1000;
  let startDistance = 0;
  const startTarget = new Vector3();
  const startDirection = new Vector3();
  const endDirection = new Vector3();
  const direction = new Vector3();
  const target = new Vector3();
  const lastTarget = new Vector3();
  const scratch = new Vector3();
  const delta = new Vector3();

  function position(id: string | null, out: Vector3): Vector3 {
    if (!id || id === SOLAR_SYSTEM_VIEW) return out.set(0, 0, 0);
    if (getWorldPosition(id, get(simTime), out, scratch)) return out;
    // Missing satellite data should leave the camera at its parent, never at the Sun.
    const parent = getById(id)?.parent;
    return parent && getWorldPosition(parent, get(simTime), out, scratch)
      ? out
      : out.copy(lastTarget);
  }
  function distance(id: string | null): number {
    const base =
      !id || id === SOLAR_SYSTEM_VIEW ? get(overviewDistance) : (getById(id)?.cameraDistance ?? 5);
    return base * Math.max(1, size.current.height / Math.max(1, size.current.width));
  }
  function flyTo(id: string | null): void {
    if (!controls) return;
    activeId = id;
    position(id, target);
    startTarget.copy(controls.target);
    startDirection.copy(camera.current.position).sub(startTarget);
    startDistance = startDirection.length();
    startDirection.normalize();
    if (!id || id === SOLAR_SYSTEM_VIEW) endDirection.set(0.7, 0.65, 1).normalize();
    else
      endDirection
        .copy(target)
        .negate()
        .normalize()
        .applyAxisAngle(new Vector3(0, 1, 0), 0.55)
        .add(new Vector3(0, 0.35, 0))
        .normalize();
    const body = getById(id);
    if (body && isPlanetBody(body) && body.metadata.hasRings && body.metadata.poleVec)
      endDirection
        .addScaledVector(new Vector3(...body.metadata.poleVec).normalize(), 0.8)
        .normalize();
    if (endDirection.lengthSq() < 0.1) endDirection.set(0.7, 0.6, 1).normalize();
    duration = get(reducedMotion)
      ? 0
      : Math.min(1800, 650 + Math.log10(1 + target.distanceTo(startTarget)) * 240);
    startTime = performance.now();
    flying = true;
  }
  $effect(() => {
    if (!controls) return;
    controls.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
    controls.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.5;
    controls.panSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    const interrupt = () => {
      flying = false;
      lastTarget.copy(position(activeId, target));
    };
    controls.addEventListener('start', interrupt);
    return () => controls?.removeEventListener('start', interrupt);
  });
  $effect(() => {
    if (controls) flyTo($selection);
  });
  $effect(() => {
    const command = $cameraCommand;
    if (!controls || !command) return;
    if (command === 'reset') flyTo(get(selection));
    else {
      flying = false;
      direction.copy(camera.current.position).sub(controls.target);
      if (command === 'top') direction.set(0.001, direction.length(), 0.001);
      else direction.multiplyScalar(command === 'zoom-in' ? 0.72 : 1.4);
      direction.setLength(
        Math.max(controls.minDistance, Math.min(controls.maxDistance, direction.length()))
      );
      camera.current.position.copy(controls.target).add(direction);
      controls.update();
    }
    cameraCommand.set(null);
  });

  $effect(() => {
    void $overviewDistance;
    if (controls && get(selection) === SOLAR_SYSTEM_VIEW) flyTo(SOLAR_SYSTEM_VIEW);
  });

  const EARTH = getById('earth')!;
  const otherPlanetBodies = TRACKED_OBJECTS.filter(
    (obj) => obj.rendererKind === 'planet-body' && obj.id !== 'earth'
  );
  const orbitBodies = TRACKED_OBJECTS.filter(
    (obj) => obj.parent === 'sun' && isPlanetBody(obj) && obj.metadata.orbitColor !== undefined
  );
  const moonRingBodies = TRACKED_OBJECTS.filter(
    (obj) =>
      isPlanetBody(obj) &&
      obj.parent !== 'sun' &&
      obj.parent &&
      obj.metadata.orbitalPeriodDays !== undefined
  );
  const pointMarkerBodies = TRACKED_OBJECTS.filter((obj) => obj.rendererKind === 'point-marker');
  const cometBodies = TRACKED_OBJECTS.filter((obj) => obj.type === 'comet');

  // Run before object tasks: the entire frame shares one simulation instant.
  let lastFit = 1;
  useTask('simulation-clock', (dt) => advanceSimTime(dt * 1000));
  useTask(
    'camera',
    () => {
      if (!controls) return;
      const fit = Math.max(1, size.current.height / Math.max(1, size.current.width));
      if (!flying && fit !== lastFit)
        camera.current.position
          .sub(controls.target)
          .multiplyScalar(fit / lastFit)
          .add(controls.target);
      lastFit = fit;
      position(activeId, target);
      const object = getById(activeId);
      controls.minDistance = object && isPlanetBody(object) ? object.metadata.radius * 1.12 : 0.05;
      if (flying) {
        const t = duration === 0 ? 1 : Math.min(1, (performance.now() - startTime) / duration);
        const eased = t * t * (3 - 2 * t);
        controls.target.lerpVectors(startTarget, target, eased);
        direction.lerpVectors(startDirection, endDirection, eased).normalize();
        const flightDistance =
          startDistance * Math.pow(distance(activeId) / Math.max(startDistance, 0.01), eased);
        const arc = Math.sin(Math.PI * t) * Math.min(startTarget.distanceTo(target) * 0.15, 120);
        camera.current.position
          .copy(controls.target)
          .addScaledVector(direction, flightDistance + arc);
        if (t === 1) flying = false;
      } else {
        delta.copy(target).sub(lastTarget);
        controls.target.add(delta);
        camera.current.position.add(delta);
      }
      lastTarget.copy(target);
      controls.update();
      cameraTargetDistance.set(camera.current.position.distanceTo(controls.target));
      cameraOriginDistance.set(camera.current.position.length());
    },
    { after: 'simulation-clock' }
  );
</script>

<T.PerspectiveCamera makeDefault position={[360, 280, 420]} fov={45} near={0.05} far={100000}>
  <OrbitControls
    bind:ref={controls}
    enableZoom
    enablePan
    enableDamping
    dampingFactor={0.08}
    minDistance={0.05}
    maxDistance={60000}
  />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.06} />

{#if $showStars}<Starfield />{/if}

{#if $showStarLabels}<StarLabels />{/if}

{#if $showGrid}<EclipticGrid />{/if}

<HelioSun />

<SunBloom />

{#if $showOrbits}
  {#each orbitBodies as body (body.id)}
    {#if $selection === SOLAR_SYSTEM_VIEW || $selection === 'sun'}
      {#if isPlanetBody(body) && body.metadata.orbitColor !== undefined}
        <OrbitEllipse planetKey={body.id} color={body.metadata.orbitColor} opacity={0.35} />
      {/if}
    {/if}
  {/each}
{/if}

{#if isPlanetBody(EARTH)}
  <PlanetBody object={EARTH}>
    <SatelliteMarker bodyId="iss" store={iss} />
    <SatelliteMarker bodyId="tiangong" store={tiangong} />

    {#if $showOrbits && $selection === 'iss'}
      <SatelliteOrbitPath tleStore={issTle} />

      <SatelliteFootprint store={iss} />
    {:else if $showOrbits && $selection === 'tiangong'}
      <SatelliteOrbitPath tleStore={tiangongTle} />

      <SatelliteFootprint store={tiangong} />
    {/if}
  </PlanetBody>
{/if}

{#if $showOrbits}
  {#each moonRingBodies as body (body.id)}
    {#if $selection === body.id}<MoonOrbitRing object={body} />{/if}
  {/each}
{/if}

{#each otherPlanetBodies as body (body.id)}
  <PlanetBody object={body} />
{/each}

{#each pointMarkerBodies as body (body.id)}
  {#if $selection === body.id || ($selection !== SOLAR_SYSTEM_VIEW && body.parent === $selection)}<PointMarker
      object={body}
    />{/if}
{/each}

{#each cometBodies as comet (comet.id)}
  {#if $selection === comet.id}<CometTail object={comet} />{/if}
{/each}

{#if $showLabels}<LabelLayer />{/if}

{#if $selection && getById($selection)?.rendererKind !== 'planet-body'}<SelectionReticle />{/if}

{#if $showTrails && $selection !== SOLAR_SYSTEM_VIEW}
  {@const selectedObject = getById($selection)}
  {#if selectedObject && selectedObject.type !== 'planet' && selectedObject.type !== 'dwarf-planet' && selectedObject.type !== 'star'}
    {#key $selection}
      <BodyTrail object={selectedObject} />
    {/key}
  {/if}
{/if}
