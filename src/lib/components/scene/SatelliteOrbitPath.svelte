<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Line2 } from 'three/examples/jsm/lines/Line2.js';
  import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
  import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
  import { get, type Readable } from 'svelte/store';
  import type { TleData } from '$stores/satelliteFactory';
  import { simTime } from '$stores/simTime';
  import { computeIssOrbit } from '$utils/issOrbit';
  let { tleStore, trailMinutes }: { tleStore: Readable<TleData | null>; trailMinutes?: number } =
    $props();
  const { size } = useThrelte();
  const geometry = new LineGeometry();
  const material = new LineMaterial({
    color: 0xb6cadb,
    linewidth: 1.2,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  const line = new Line2(geometry, material);
  line.frustumCulled = false;
  line.visible = false;
  let lastTime = NaN;
  let lastBuild = 0;
  function rebuild() {
    const date = get(simTime);
    lastTime = date.getTime();
    lastBuild = performance.now();
    if (!$tleStore) {
      line.visible = false;
      return;
    }
    const positions = computeIssOrbit($tleStore, {
      start: new Date(lastTime - (trailMinutes ?? 0) * 60000),
      frameDate: date,
      durationMinutes: trailMinutes,
      samples: trailMinutes ? 80 : 180
    });
    line.visible = positions.length >= 6;
    if (line.visible) {
      geometry.setPositions(positions);
      geometry.computeBoundingSphere();
    }
  }
  $effect(() => {
    void $tleStore;
    rebuild();
  });
  useTask(() => {
    material.resolution.set($size.width, $size.height);
    const elapsed = Math.abs(get(simTime).getTime() - lastTime);
    if (!Number.isFinite(elapsed) || (elapsed > 500 && performance.now() - lastBuild > 100))
      rebuild();
  });
</script>

<T is={line} />
