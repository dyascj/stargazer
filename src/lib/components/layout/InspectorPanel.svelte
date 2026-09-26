<script lang="ts">
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { selection } from '$stores/selection';
  import { closeInfoPanel } from '$stores/ui';
  import { getById } from '$lib/registry/registry';
  import BottomSheet from '$components/ui/BottomSheet.svelte';
  import { morphFromOrigin } from '$components/ui/morph';
  import Inspector from './Inspector.svelte';

  let {
    compact,
    sheetOffset = $bindable(0),
    sheetExpanded = $bindable(false)
  }: { compact: boolean; sheetOffset?: number; sheetExpanded?: boolean } = $props();

  let card: HTMLElement | undefined = $state();
  const label = $derived(`${getById($selection)?.name ?? 'Body'} details`);

  // Each new selection may arrive from a search result that wants to morph into this card.
  $effect(() => {
    void $selection;
    if (card) {
      card.scrollTop = 0;
      morphFromOrigin(card);
    }
  });
</script>

{#if compact}
  <BottomSheet
    {label}
    onclose={closeInfoPanel}
    bind:offset={sheetOffset}
    bind:expanded={sheetExpanded}
  >
    {#key $selection}<Inspector />{/key}
  </BottomSheet>
{:else}
  <aside
    class="card glass"
    aria-label={label}
    bind:this={card}
    out:scale|global={{ start: 0.96, opacity: 0, duration: 300, easing: quintOut }}
  >
    {#key $selection}<Inspector />{/key}
  </aside>
{/if}

<style>
  .card {
    position: absolute;
    z-index: 40;
    top: 76px;
    right: max(16px, env(safe-area-inset-right));
    width: 360px;
    max-height: calc(100dvh - 76px - 96px);
    overflow-y: auto;
    overscroll-behavior: contain;
    border-radius: var(--radius-2xl);
    transform-origin: top right;
    transition:
      opacity 300ms var(--ease-out),
      translate 380ms var(--ease-out);
  }
  @starting-style {
    .card {
      opacity: 0;
      translate: 12px 0;
    }
  }
  /* Phones on their side: use the full height; the time control moves out of the way. */
  @media (max-height: 500px) {
    .card {
      top: 68px;
      width: min(360px, 46vw);
      max-height: calc(100dvh - 68px - max(12px, env(safe-area-inset-bottom)));
    }
  }
</style>
