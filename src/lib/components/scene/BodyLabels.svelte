<script lang="ts">
  import { onMount } from 'svelte';
  import { selection } from '$stores/selection';
  import { introComplete } from '$stores/scene';
  import { selectBody } from '$stores/ui';
  import { BODIES, BODY_COUNT } from './bodyState';
  import { hooks, LABEL_HEIGHT, labelShown, labelWidth, labelX, labelY } from './overlay';

  /**
   * DOM labels positioned by the render loop. Transforms are written directly
   * each frame instead of through reactive state, and only for shown labels.
   */

  const elements: HTMLButtonElement[] = [];
  const shown = new Uint8Array(BODY_COUNT);
  const major = new Set(['star', 'planet']);

  function measure(): void {
    elements.forEach((element, i) => (labelWidth[i] = element.offsetWidth));
  }

  onMount(() => {
    measure();
    void document.fonts?.ready.then(measure);
    const update = () => {
      for (let i = 0; i < BODY_COUNT; i++) {
        const element = elements[i];
        const visible = labelShown[i];
        if (visible)
          element.style.transform = `translate3d(${Math.round(labelX[i])}px, ${Math.round(labelY[i] - LABEL_HEIGHT / 2)}px, 0)`;
        if (visible !== shown[i]) {
          shown[i] = visible;
          element.classList.toggle('shown', visible === 1);
        }
      }
    };
    hooks.afterFrame = update;
    // A replacement layer may mount before this one is destroyed.
    return () => {
      if (hooks.afterFrame === update) hooks.afterFrame = null;
    };
  });
</script>

<div class="labels" class:arrived={$introComplete} role="group" aria-label="Scene labels">
  {#each BODIES as body, i (body.id)}
    <button
      bind:this={elements[i]}
      type="button"
      class="label"
      class:major={major.has(body.type)}
      class:selected={$selection === body.id}
      tabindex="-1"
      onclick={() => selectBody(body.id)}>{body.name}</button
    >
  {/each}
</div>

<style>
  .labels {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    contain: strict;
    opacity: 0;
    transition: opacity var(--dur-slow) var(--ease-out) 120ms;
  }
  .labels.arrived {
    opacity: 1;
  }
  .label {
    position: absolute;
    top: 0;
    left: 0;
    height: 22px;
    padding: 0 9px;
    border: 0;
    border-radius: var(--radius-pill);
    background: rgb(16 16 16 / 0.62);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 450;
    line-height: 22px;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--text-2);
    opacity: 0;
    visibility: hidden;
    cursor: pointer;
    transform: translate3d(-9999px, 0, 0);
    transition:
      opacity var(--dur-fast) var(--ease-out),
      visibility 0s linear var(--dur-fast),
      color var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out);
    will-change: transform;
  }
  .label:global(.shown) {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition:
      opacity var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
  }
  .label.major {
    font-weight: 550;
    color: var(--text-1);
  }
  .label.selected {
    color: var(--accent-strong);
    background: rgb(0 60 88 / 0.55);
  }
  .label:hover {
    color: var(--text-1);
    background: rgb(41 41 41 / 0.85);
  }
  .label:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
    border-radius: var(--radius-xs);
  }
</style>
