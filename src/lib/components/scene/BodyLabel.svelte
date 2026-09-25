<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { HTML } from '@threlte/extras';
  import { Vector3, type Group } from 'three';
  import { get } from 'svelte/store';
  import { simTime } from '$stores/simTime';
  import { selection } from '$stores/selection';
  import { getById, getWorldPosition } from '$lib/registry/registry';
  import { isPlanetBody, type TrackedObject } from '$lib/registry/types';
  import { selectBody } from '$stores/ui';

  // Contextual labels are mounted only while visible; close-up surfaces remain clear.
  let { object: objectProp }: { object: TrackedObject } = $props();

  // svelte-ignore state_referenced_locally
  const object = objectProp;

  const { camera } = useThrelte();

  function isInFrustum(pos: Vector3): boolean {
    // Project the world position into NDC. If z >= 1 the body is behind
    // the camera or past the far plane. If |x| or |y| > ~1.05 (small
    // padding so labels at the edge don't pop), it's off-screen.
    ndc.copy(pos).project(camera.current);
    if (ndc.z >= 1 || ndc.z <= -1) return false;
    return Math.abs(ndc.x) <= 1.05 && Math.abs(ndc.y) <= 1.05;
  }

  function computeVisibility(pos: Vector3): boolean {
    if (!isInFrustum(pos)) return false;
    const selected = getById(get(selection));
    if (selected?.id === object.id) return true;
    const distance = camera.current.position.distanceTo(pos);
    if (!selected || selected.id === 'sun') {
      // The inner worlds collapse to a few pixels in the full-system view.
      if (['mercury', 'venus', 'earth', 'mars'].includes(object.id) && distance > 1800)
        return false;
      return object.type === 'planet' || object.id === 'sun' || object.id === 'pluto';
    }
    if (object.id === selected.parent) return distance < 300;
    if (
      object.parent === selected.id ||
      (object.parent === selected.parent && selected.type === 'moon')
    ) {
      return object.type === 'moon' && distance < 160;
    }
    return false;
  }

  let groupRef: Group | undefined = $state();
  let visible = $state(false);
  let isSelected = $state(false);
  const worldPos = new Vector3();
  const scratch = new Vector3();
  const ndc = new Vector3();

  useTask(() => {
    if (!groupRef) return;

    const pos = getWorldPosition(object.id, get(simTime), worldPos, scratch);
    if (!pos) {
      groupRef.visible = false;
      if (visible) visible = false;
      return;
    }
    groupRef.position.copy(pos);

    const selected = getById(get(selection));
    let newVisible = computeVisibility(pos);
    if (selected && isPlanetBody(selected)) {
      const selectedPos = getWorldPosition(selected.id, get(simTime), scratch, ndc);
      if (selectedPos) {
        const screenRadius =
          selected.metadata.radius /
          Math.max(0.01, camera.current.position.distanceTo(selectedPos));
        if (object.id === selected.id && screenRadius > 0.03) newVisible = false;
        else if (object.parent === selected.id) {
          const center = selectedPos.clone().project(camera.current);
          ndc.copy(pos).project(camera.current);
          if (Math.hypot(ndc.x - center.x, ndc.y - center.y) < screenRadius * 2.9)
            newVisible = false;
        }
      }
    }
    if (newVisible !== visible) visible = newVisible;
    groupRef.visible = newVisible;

    const newSelected = get(selection) === object.id;
    if (newSelected !== isSelected) isSelected = newSelected;
  });
</script>

<T.Group bind:ref={groupRef}>
  {#if visible}
    <HTML
      transform={false}
      pointerEvents={visible ? 'auto' : 'none'}
      center={false}
      zIndexRange={[40, 0]}
    >
      <div class="body-label" class:selected={isSelected} class:label-visible={visible}>
        <span class="dot" aria-hidden="true"></span>
        <svg class="leader" viewBox="0 0 24 24" preserveAspectRatio="none" aria-hidden="true">
          <line
            x1="0"
            y1="24"
            x2="22"
            y2="2"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <button
          type="button"
          class="text"
          onclick={() => selectBody(object.id)}
          aria-label={`Select ${object.name}`}
        >
          {object.name}
        </button>
      </div>
    </HTML>
  {/if}
</T.Group>

<style>
  .body-label {
    position: relative;
    width: 0;
    height: 0;
    pointer-events: none;
    color: var(--space-surface);
    opacity: 0;
    transition-property: color, opacity;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .body-label.label-visible {
    opacity: 1;
  }
  .body-label.selected {
    color: var(--space-action);
  }

  /* Anchor dot — sits exactly on the body's projected centre. */
  .body-label .dot {
    position: absolute;
    left: -2px;
    top: -2px;
    width: 4px;
    height: 4px;
    border-radius: 9999px;
    background: currentColor;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
    pointer-events: none;
    transition-property: width, height, left, top, box-shadow;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .body-label.selected .dot {
    width: 6px;
    height: 6px;
    left: -3px;
    top: -3px;
    box-shadow: 0 0 8px rgba(232, 68, 30, 0.6);
  }

  .body-label .leader {
    position: absolute;
    left: 1px;
    top: -24px;
    width: 24px;
    height: 24px;
    overflow: visible;
    pointer-events: none;
    opacity: 0.7;
    transition-property: opacity;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .body-label.selected .leader {
    opacity: 1;
  }

  .body-label .text {
    position: absolute;
    left: 28px;
    top: -28px;
    transform: translateY(-50%);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: var(--space-text);
    background: var(--space-surface);
    border: 1px solid var(--space-line);
    padding: 6px 9px;
    border-radius: 0;
    margin: 0;
    cursor: pointer;
    pointer-events: auto;
    white-space: nowrap;
    text-shadow: none;
    transition-property: background-color, padding, font-size;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .body-label.selected .text {
    font-size: 11px;
    background: var(--space-inset);
    color: var(--space-accent);
    padding: 4px 9px;
  }
  .body-label .text:hover {
    background: var(--space-inset);
    color: var(--space-accent);
  }
  .body-label .text:focus-visible {
    outline: 2px solid var(--space-action);
    background: var(--space-inset);
    color: var(--space-accent);
  }
</style>
