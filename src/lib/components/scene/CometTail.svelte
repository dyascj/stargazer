<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { Line2 } from 'three/examples/jsm/lines/Line2.js';
  import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
  import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
  import { Vector3 } from 'three';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import { getWorldPosition } from '$lib/registry/registry';
  import type { TrackedObject } from '$lib/registry/types';

  /**
   * Anti-solar tail indicator for comets. Renders a short line from
   * the comet's current position pointing away from the Sun (the
   * comet's ion tail direction). The line fades from the body's
   * accent color at the head to transparent at the tip.
   *
   * Not a physically accurate tail simulation (no dust/ion modeling),
   * just a visual cue that distinguishes comets from asteroids at a
   * glance. The tail length scales with heliocentric distance: closer
   * comets have shorter, brighter tails; distant ones have longer,
   * fainter tails (matching the real sublimation curve qualitatively).
   */

  let { object: objectProp }: { object: TrackedObject } = $props();

  // svelte-ignore state_referenced_locally
  const object = objectProp;

  const SAMPLES = 16;
  const BASE_LENGTH = 3; // scene units at 1 AU
  const RECOMPUTE_MS = 2000;

  // Color from the body's metadata
  const accentColor =
    object.rendererKind === 'point-marker'
      ? (object.metadata as { color: string }).color
      : '#88ccff';

  // Parse hex to 0..1 RGB
  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }
  const [cr, cg, cb] = hexToRgb(accentColor);

  // Vertex colors: gradient from accent (head, i=0) to dark (tail, i=N-1)
  const colors = new Float32Array(SAMPLES * 6);
  for (let i = 0; i < SAMPLES; i++) {
    const t = 1 - i / (SAMPLES - 1); // 1 at head, 0 at tail
    const k = t * t; // quadratic falloff for a brighter head
    colors[i * 6 + 0] = cr * k;
    colors[i * 6 + 1] = cg * k;
    colors[i * 6 + 2] = cb * k;
    colors[i * 6 + 3] = cr * k;
    colors[i * 6 + 4] = cg * k;
    colors[i * 6 + 5] = cb * k;
  }

  const positions = new Float32Array(SAMPLES * 3);
  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);

  const material = new LineMaterial({
    color: 0xffffff,
    linewidth: 1.8,
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
    depthWrite: false,
    depthTest: false
  });
  if (typeof window !== 'undefined') {
    material.resolution.set(window.innerWidth, window.innerHeight);
  }

  const line = new Line2(geometry, material);
  line.frustumCulled = false;

  let lastBuiltAt = 0;
  let lastResW = 0;
  let lastResH = 0;
  const worldPos = new Vector3();
  const scratch = new Vector3();
  const tailDir = new Vector3();

  function rebuild(): void {
    const pos = getWorldPosition(object.id, get(simTime), worldPos, scratch);
    if (!pos) return;

    // Anti-solar direction: normalize(body - Sun). Sun is at origin.
    tailDir.copy(pos).normalize();
    const distAU = pos.length() / 100; // AU_TO_SCENE = 100

    // Tail length scales inversely with distance (brighter when close)
    // but capped so it doesn't vanish at large distances.
    const tailLength = BASE_LENGTH * Math.max(0.3, 1 / Math.max(0.1, distAU));

    // Build the line: straight from the body outward along tailDir.
    for (let i = 0; i < SAMPLES; i++) {
      const t = i / (SAMPLES - 1);
      const x = pos.x + tailDir.x * tailLength * t;
      const y = pos.y + tailDir.y * tailLength * t;
      const z = pos.z + tailDir.z * tailLength * t;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.setPositions(positions);
    line.computeLineDistances();
    geometry.computeBoundingSphere();
    lastBuiltAt = performance.now();
  }

  rebuild();

  useTask(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w !== lastResW || h !== lastResH) {
        material.resolution.set(w, h);
        lastResW = w;
        lastResH = h;
      }
    }
    if (performance.now() - lastBuiltAt > RECOMPUTE_MS) {
      rebuild();
    }
  });
</script>

<T is={line} />
