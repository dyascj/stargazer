<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import type { SatelliteStore } from '$stores/satelliteFactory';
  import { EARTH_RADIUS, EARTH_RADIUS_KM } from '$lib/scene-config';
  import { createPolyline, writeVertex } from './polyline';

  /**
   * The satellite's horizon circle on Earth's surface, drawn in Earth's
   * rotating frame around the geocentric sub-satellite point.
   */

  let { store }: { store: SatelliteStore } = $props();

  const { size } = useThrelte();
  const SAMPLES = 128;
  const RADIUS = EARTH_RADIUS * 1.0008;
  const material = new LineMaterial({
    color: 0xd6e4ee,
    linewidth: 1,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });
  const { line, positions } = createPolyline(SAMPLES, material);

  function rebuild(ecf: { x: number; y: number; z: number }, footprintKm: number): void {
    const lat = Math.atan2(ecf.z, Math.hypot(ecf.x, ecf.y));
    const lon = Math.atan2(ecf.y, ecf.x);
    const angle = footprintKm / 2 / EARTH_RADIUS_KM;
    const cosD = Math.cos(angle);
    const sinD = Math.sin(angle);
    for (let i = 0; i < SAMPLES; i++) {
      const theta = (i / (SAMPLES - 1)) * 2 * Math.PI;
      const lat2 = Math.asin(Math.sin(lat) * cosD + Math.cos(lat) * sinD * Math.cos(theta));
      const lon2 =
        lon +
        Math.atan2(Math.sin(theta) * sinD * Math.cos(lat), cosD - Math.sin(lat) * Math.sin(lat2));
      const x = RADIUS * Math.cos(lat2) * Math.cos(lon2);
      const z = -RADIUS * Math.cos(lat2) * Math.sin(lon2);
      writeVertex(positions, i, SAMPLES, x, RADIUS * Math.sin(lat2), z);
    }
    positions.needsUpdate = true;
  }

  useTask(() => {
    const state = store.at(get(simTime));
    line.visible = !!state;
    if (state) rebuild(state.ecfKm, state.footprintKm);
    material.resolution.set(size.current.width, size.current.height);
  });
</script>

<T is={line} />
