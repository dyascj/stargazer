<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { get } from 'svelte/store';
  import { TRACKED_OBJECTS } from '$lib/registry/registry';
  import { isPlanetBody } from '$lib/registry/types';
  import { selection } from '$stores/selection';
  import { iss } from '$stores/iss';
  import { tiangong } from '$stores/tiangong';
  import { advanceSimTime, simTime } from '$stores/simTime';
  import { showGrid, showOrbits, showStarLabels, showStars } from '$stores/ui';
  import BodyMarkers from './BodyMarkers.svelte';
  import CameraRig from './CameraRig.svelte';
  import CometTail from './CometTail.svelte';
  import EclipticGrid from './EclipticGrid.svelte';
  import IssModel from './IssModel.svelte';
  import OrbitLines from './OrbitLines.svelte';
  import PlanetBody from './PlanetBody.svelte';
  import SatelliteFootprint from './SatelliteFootprint.svelte';
  import StarLabels from './StarLabels.svelte';
  import Starfield from './Starfield.svelte';
  import Sun from './Sun.svelte';
  import { updateBodyPositions } from './bodyState';

  const earth = TRACKED_OBJECTS.find((body) => body.id === 'earth')!;
  const worlds = TRACKED_OBJECTS.filter((body) => isPlanetBody(body) && body.id !== 'earth');
  const comets = TRACKED_OBJECTS.filter((body) => body.type === 'comet');

  // One simulation instant and one set of body positions per frame, before the camera moves.
  useTask('simulation-clock', (dt) => advanceSimTime(dt * 1000));
  useTask('bodies', () => updateBodyPositions(get(simTime)), { after: 'simulation-clock' });
</script>

<CameraRig />

{#if $showStars}<Starfield />{/if}
{#if $showStarLabels}<StarLabels />{/if}
{#if $showGrid}<EclipticGrid />{/if}

<Sun />
<T.AmbientLight intensity={0.1} />

<PlanetBody object={earth}>
  <IssModel />
  {#if $showOrbits && $selection === 'iss'}<SatelliteFootprint store={iss} />{/if}
  {#if $showOrbits && $selection === 'tiangong'}<SatelliteFootprint store={tiangong} />{/if}
</PlanetBody>
{#each worlds as body (body.id)}<PlanetBody object={body} />{/each}
{#each comets as comet (comet.id)}<CometTail object={comet} />{/each}

<OrbitLines />
<BodyMarkers />
