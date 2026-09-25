<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import {
    BufferAttribute,
    BufferGeometry,
    Color,
    Line,
    ShaderMaterial,
    Vector3,
    type Group
  } from 'three';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import { getWorldPosition } from '$lib/registry/registry';
  import type { TrackedObject } from '$lib/registry/types';

  /**
   * Past-trajectory trail rendered as a thin GL line (1px, true 2D-
   * in-3D-space look). Per-vertex alpha fades from the body's current
   * position (head, visible) to fully transparent at the oldest
   * sample (tail, invisible).
   *
   * For bodies with a parent (moons, orbiters, satellites), the trail
   * is rendered RELATIVE TO THE PARENT: samples come from the body's
   * `offsetFn` (not `getWorldPosition`), and the line sits inside a
   * group that tracks the parent's world position each frame. This
   * means a moon's trail shows its clean orbital arc around the
   * planet, not a heliocentric corkscrew.
   *
   * For bodies orbiting the Sun directly (parent: 'sun' or null),
   * the trail uses world positions as before.
   *
   * Self-tunes its duration from the body's velocity. Skips static-
   * snapshot spacecraft automatically. Keyed by `$selection` in
   * World.svelte so it remounts on selection change.
   */

  let { object: objectProp }: { object: TrackedObject } = $props();
  // svelte-ignore state_referenced_locally
  const object = objectProp;

  // Bodies with a non-sun parent render relative to the parent.
  // Their trail uses offsetFn (parent-relative) and a group that
  // tracks the parent's world position.
  const hasParent = object.parent !== null && object.parent !== 'sun';
  const parentId = object.parent;

  const SAMPLES = 60;
  const STATIC_THRESHOLD = 1e-5;
  // Shorter trail: ~1.5x cameraDistance worth of motion behind the body
  const TRAIL_LENGTH_FACTOR = 1.5;
  const MIN_DURATION_SEC = 10;
  const MAX_DURATION_SEC = 30 * 86_400;

  // Subtle neutral tone
  const trailColor = new Color(0.7, 0.75, 0.85);

  // ── Geometry ────────────────────────────────────────────────────────
  const positions = new Float32Array(SAMPLES * 3);
  const alphas = new Float32Array(SAMPLES);

  // Pre-bake alpha gradient: 0 at tail (oldest), 1 at head (newest)
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1);
    // Quadratic falloff so the bright part is short and the fade is long
    alphas[i] = t * t;
  }

  const geometry = new BufferGeometry();
  const posAttr = new BufferAttribute(positions, 3);
  geometry.setAttribute('position', posAttr);
  geometry.setAttribute('aAlpha', new BufferAttribute(alphas, 1));

  const vertexShader = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_vertex>

    attribute float aAlpha;
    varying float vAlpha;

    void main() {
      vAlpha = aAlpha;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `;

  const fragmentShader = /* glsl */ `
    #include <common>
    #include <logdepthbuf_pars_fragment>

    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      #include <logdepthbuf_fragment>
      if (vAlpha < 0.01) discard;
      gl_FragColor = vec4(uColor, vAlpha * 0.55);
    }
  `;

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uColor: { value: trailColor } },
    transparent: true,
    depthWrite: false,
    depthTest: false
  });

  const line = new Line(geometry, material);
  line.frustumCulled = false;

  // ── Self-tuning duration ────────────────────────────────────────────
  const probeA = new Vector3();
  const probeB = new Vector3();
  const scratchA = new Vector3();

  /**
   * Sample a position for the trail at the given date. For parent-
   * relative bodies, returns the offset from the parent (via
   * offsetFn). For heliocentric bodies, returns the world position.
   */
  function samplePosition(date: Date, target: Vector3): Vector3 | null {
    if (hasParent) {
      return object.offsetFn(date, target);
    }
    return getWorldPosition(object.id, date, target, scratchA);
  }

  function computeDuration(): number {
    const nowMs = get(simTime).getTime();
    const r1 = samplePosition(new Date(nowMs - 60_000), probeA);
    const r2 = samplePosition(new Date(nowMs), probeB);
    if (!r1 || !r2) return 0;
    const dist = probeA.distanceTo(probeB);
    if (dist < STATIC_THRESHOLD) return 0;
    const velocity = dist / 60;
    const desired = object.cameraDistance * TRAIL_LENGTH_FACTOR;
    return Math.max(MIN_DURATION_SEC, Math.min(MAX_DURATION_SEC, desired / velocity));
  }

  let duration = $state(computeDuration());
  // svelte-ignore state_referenced_locally
  let isStatic = $state(duration <= 0);

  // ── Sampling ────────────────────────────────────────────────────────
  let lastDurationCheck = 0;
  const tmpPos = new Vector3();

  function rebuild(): void {
    if (duration <= 0) return;
    const nowMs = get(simTime).getTime();
    let valid = true;
    let firstX = 0,
      firstY = 0,
      firstZ = 0;
    let lastX = 0,
      lastY = 0,
      lastZ = 0;

    for (let i = 0; i < SAMPLES; i++) {
      const t = i / (SAMPLES - 1);
      const sampleMs = nowMs - (1 - t) * duration * 1000;
      const result = samplePosition(new Date(sampleMs), tmpPos);
      if (!result) {
        valid = false;
        break;
      }
      positions[i * 3] = tmpPos.x;
      positions[i * 3 + 1] = tmpPos.y;
      positions[i * 3 + 2] = tmpPos.z;
      if (i === 0) {
        firstX = tmpPos.x;
        firstY = tmpPos.y;
        firstZ = tmpPos.z;
      }
      if (i === SAMPLES - 1) {
        lastX = tmpPos.x;
        lastY = tmpPos.y;
        lastZ = tmpPos.z;
      }
    }
    if (!valid) return;

    const motion = Math.hypot(firstX - lastX, firstY - lastY, firstZ - lastZ);
    if (motion < STATIC_THRESHOLD) {
      isStatic = true;
      return;
    }
    isStatic = false;

    posAttr.needsUpdate = true;
    geometry.computeBoundingSphere();
  }

  rebuild();

  let groupRef: Group | undefined = $state();
  const parentWorldPos = new Vector3();
  const parentScratch = new Vector3();

  // Rebuild EVERY FRAME so the trail keeps up with fast time rates.
  useTask(() => {
    rebuild();

    // For parent-relative bodies, move the group to the parent's
    // world position each frame so the trail follows the parent
    // around its own orbit while the line geometry stays in the
    // parent's local frame.
    if (hasParent && parentId && groupRef) {
      const pPos = getWorldPosition(parentId, get(simTime), parentWorldPos, parentScratch);
      if (pPos) groupRef.position.copy(pPos);
    }

    // Retry duration computation if the first attempt failed
    if (duration <= 0 && performance.now() - lastDurationCheck > 2000) {
      duration = computeDuration();
      isStatic = duration <= 0;
      lastDurationCheck = performance.now();
    }
  });
</script>

{#if !isStatic}
  {#if hasParent}
    <!-- Parent-relative: trail geometry is in parent-local space,
         group tracks the parent's world position each frame -->
    <T.Group bind:ref={groupRef}>
      <T is={line} />
    </T.Group>
  {:else}
    <!-- Heliocentric: trail geometry is already in world space -->
    <T is={line} />
  {/if}
{/if}
