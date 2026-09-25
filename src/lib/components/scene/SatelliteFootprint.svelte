<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Line2 } from 'three/examples/jsm/lines/Line2.js';
  import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
  import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import type { SatelliteStore } from '$stores/satelliteFactory';
  import { EARTH_RADIUS, EARTH_RADIUS_KM } from '$lib/scene-config';

  /**
   * Generic visibility footprint — draws the great-circle ring on Earth's
   * surface at the satellite's horizon. Source-agnostic, works with any
   * SatelliteStore.
   *
   * The store's `footprintKm` is the surface arc DIAMETER (matching the
   * wheretheiss convention), so we divide by two to get the radius.
   */

  let { store }: { store: SatelliteStore } = $props();

  const { size } = useThrelte();
  const SAMPLES = 96;
  const SURFACE_OFFSET = 1.001;

  const geometry = new LineGeometry();
  geometry.setPositions(new Float32Array(SAMPLES * 3));

  const material = new LineMaterial({
    color: 0xffffff,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  const line = new Line2(geometry, material);
  line.frustumCulled = false;

  const positions = new Float32Array(SAMPLES * 3);

  function rebuild(latDeg: number, lonDeg: number, footprintKm: number) {
    const radiusKm = footprintKm / 2;
    const angularRadius = radiusKm / EARTH_RADIUS_KM;
    const lat1 = (latDeg * Math.PI) / 180;
    const lon1 = (lonDeg * Math.PI) / 180;

    const cosD = Math.cos(angularRadius);
    const sinD = Math.sin(angularRadius);
    const cosLat1 = Math.cos(lat1);
    const sinLat1 = Math.sin(lat1);

    for (let i = 0; i < SAMPLES; i++) {
      const theta = (i / (SAMPLES - 1)) * 2 * Math.PI;
      const lat2 = Math.asin(sinLat1 * cosD + cosLat1 * sinD * Math.cos(theta));
      const lon2 =
        lon1 + Math.atan2(Math.sin(theta) * sinD * cosLat1, cosD - sinLat1 * Math.sin(lat2));
      const r = EARTH_RADIUS * SURFACE_OFFSET;
      const cosLat2 = Math.cos(lat2);
      positions[i * 3] = r * cosLat2 * Math.cos(lon2);
      positions[i * 3 + 1] = r * Math.sin(lat2);
      positions[i * 3 + 2] = -r * cosLat2 * Math.sin(lon2);
    }
    geometry.setPositions(positions);
    line.computeLineDistances();
    geometry.computeBoundingSphere();
  }

  let lastTime = NaN;
  useTask(() => {
    const date = get(simTime);
    const data = store.at(date);
    line.visible = !!data;
    if (data && (!Number.isFinite(lastTime) || Math.abs(date.getTime() - lastTime) > 100)) {
      rebuild(data.latitude, data.longitude, data.footprintKm);
      lastTime = date.getTime();
    }
    material.resolution.set($size.width, $size.height);
  });
</script>

<T is={line} />
