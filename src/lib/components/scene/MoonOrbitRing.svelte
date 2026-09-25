<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Line2 } from 'three/examples/jsm/lines/Line2.js';
  import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
  import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
  import { Vector3, type Group } from 'three';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import { getWorldPosition } from '$lib/registry/registry';
  import { isPlanetBody, type TrackedObject } from '$lib/registry/types';
  let { object }: { object: TrackedObject } = $props();
  const { size } = useThrelte();
  const geometry = new LineGeometry();
  const material = new LineMaterial({
    color: 0xb6c7d6,
    linewidth: 1,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });
  const line = new Line2(geometry, material);
  line.frustumCulled = false;
  let group: Group | undefined = $state();
  let lastTime = NaN;
  const sample = new Vector3(),
    parentPosition = new Vector3(),
    scratch = new Vector3();
  useTask(() => {
    if (!group || !object.parent || !isPlanetBody(object) || !object.metadata.orbitalPeriodDays)
      return;
    const date = get(simTime),
      period = object.metadata.orbitalPeriodDays * 86400000;
    if (!Number.isFinite(lastTime) || Math.abs(date.getTime() - lastTime) > period / 4) {
      const positions = new Float32Array(193 * 3);
      for (let i = 0; i <= 192; i++) {
        object.offsetFn(new Date(date.getTime() + (i / 192) * period), sample);
        positions.set(sample.toArray(), i * 3);
      }
      geometry.setPositions(positions);
      geometry.computeBoundingSphere();
      lastTime = date.getTime();
    }
    const pos = getWorldPosition(object.parent, date, parentPosition, scratch);
    if (pos) group.position.copy(pos);
    material.resolution.set($size.width, $size.height);
  });
</script>

<T.Group bind:ref={group}><T is={line} /></T.Group>
