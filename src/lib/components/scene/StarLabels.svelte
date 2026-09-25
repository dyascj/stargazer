<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { HTML } from '@threlte/extras';
  import type { Group } from 'three';
  import { equatorialToScene } from '$utils/frames';

  /**
   * Bright reference stars at their J2000 positions (Hipparcos, rounded). They
   * are directions, not places: the group rides with the camera so labels sit
   * at infinity like the sky itself.
   */

  const STARS: [string, number, number][] = [
    ['Sirius', 6.7525, -16.7161],
    ['Canopus', 6.3992, -52.6957],
    ['Arcturus', 14.2611, 19.1825],
    ['Vega', 18.6156, 38.7836],
    ['Capella', 5.2781, 45.998],
    ['Rigel', 5.2422, -8.2017],
    ['Procyon', 7.6553, 5.225],
    ['Betelgeuse', 5.9192, 7.4069],
    ['Altair', 19.8464, 8.8683],
    ['Aldebaran', 4.5987, 16.5093],
    ['Spica', 13.4199, -11.1614],
    ['Antares', 16.4901, -26.4319],
    ['Pollux', 7.7553, 28.0262],
    ['Fomalhaut', 22.9608, -29.6222],
    ['Deneb', 20.6906, 45.2803],
    ['Polaris', 2.5303, 89.2641]
  ];
  const DISTANCE = 1e6;
  const labels = STARS.map(([name, raHours, dec]) => ({
    name,
    position: equatorialToScene(raHours * 15, dec).map((v) => v * DISTANCE) as [
      number,
      number,
      number
    ]
  }));

  let group: Group | undefined = $state();
  const { camera } = useThrelte();
  useTask(() => group?.position.copy(camera.current.position), { after: 'camera' });
</script>

<T.Group bind:ref={group}>
  {#each labels as star (star.name)}
    <T.Group position={star.position}>
      <HTML transform={false} pointerEvents="none" center zIndexRange={[5, 0]}>
        <div class="star-label">{star.name}</div>
      </HTML>
    </T.Group>
  {/each}
</T.Group>

<style>
  .star-label {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 450;
    letter-spacing: 0.02em;
    color: var(--text-3);
    white-space: nowrap;
    transform: translate(10px, 0);
  }
</style>
