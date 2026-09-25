<script lang="ts">
  import { TRACKED_OBJECTS, getById } from '$lib/registry/registry';
  import { isPlanetBody } from '$lib/registry/types';
  import { compareOpen, selectBody } from '$stores/ui';
  import { selection } from '$stores/selection';
  import Icon from '$components/ui/Icon.svelte';
  import { glyphColor } from '$components/ui/BodyGlyph.svelte';
  import { formatNumber } from '$utils/format';

  const worlds = TRACKED_OBJECTS.filter(isPlanetBody);
  let dialog: HTMLDialogElement;
  let first = $state('earth');
  let second = $state('jupiter');
  const left = $derived(worlds.find((body) => body.id === first)!);
  const right = $derived(worlds.find((body) => body.id === second)!);
  const largest = $derived(Math.max(left.metadata.radiusKm, right.metadata.radiusKm));
  const ratio = $derived(right.metadata.radiusKm / left.metadata.radiusKm);
  const [big, small] = $derived(ratio >= 1 ? [right, left] : [left, right]);
  const factor = $derived(
    (ratio >= 1 ? ratio : 1 / ratio).toLocaleString('en-US', { maximumFractionDigits: 2 })
  );

  $effect(() => {
    if ($compareOpen && !dialog.open) {
      const object = getById($selection);
      if (object && isPlanetBody(object)) {
        first = object.id;
        second = object.id === 'earth' ? 'jupiter' : 'earth';
      }
      dialog.showModal();
    } else if (!$compareOpen && dialog.open) dialog.close();
  });

  function explore(id: string) {
    compareOpen.set(false);
    selectBody(id);
  }
  const radiusOf = (km: number) => (100 * km) / largest;
</script>

<dialog
  class="compare"
  bind:this={dialog}
  aria-labelledby="compare-title"
  onclose={() => compareOpen.set(false)}
  onclick={(event) => event.target === dialog && compareOpen.set(false)}
>
  <header>
    <h2 id="compare-title">Compare sizes</h2>
    <button class="icon-btn" type="button" aria-label="Close" onclick={() => compareOpen.set(false)}
      ><Icon name="close" /></button
    >
  </header>

  <div class="pickers">
    <select aria-label="First world" bind:value={first}>
      {#each worlds as body (body.id)}<option value={body.id}>{body.name}</option>{/each}
    </select>
    <span>and</span>
    <select aria-label="Second world" bind:value={second}>
      {#each worlds as body (body.id)}<option value={body.id}>{body.name}</option>{/each}
    </select>
  </div>

  <svg
    viewBox="0 0 560 220"
    role="img"
    aria-label="{big.name} is {factor} times the diameter of {small.name}"
  >
    <defs>
      {#each [left, right] as body, index (index)}
        <radialGradient id="compare-shade-{index}" cx="34%" cy="30%" r="75%">
          <stop style:stop-color="color-mix(in oklab, {glyphColor(body)}, white 30%)" />
          <stop offset=".55" style:stop-color={glyphColor(body)} />
          <stop offset="1" style:stop-color="color-mix(in oklab, {glyphColor(body)}, black 70%)" />
        </radialGradient>
      {/each}
    </defs>
    {#each [left, right] as body, index (index)}
      {@const r = Math.max(1.5, radiusOf(body.metadata.radiusKm))}
      <circle cx={index ? 420 : 140} cy={210 - r} {r} fill="url(#compare-shade-{index})" />
    {/each}
  </svg>

  <p class="result">
    <span class="factor tabular">{factor}×</span>
    <span>{big.name} is {factor} times as wide as {small.name}</span>
  </p>

  <div class="worlds">
    {#each [left, right] as body, index (index)}
      <button type="button" class="world" onclick={() => explore(body.id)}>
        <span class="name">{body.name}</span>
        <span class="tabular">{formatNumber(body.metadata.radiusKm * 2)} km across</span>
        <span class="go">Go there <Icon name="chevron-right" size={14} /></span>
      </button>
    {/each}
  </div>
  <p class="note">Mean diameters. Rings and flattening are not shown.</p>
</dialog>

<style>
  .compare {
    width: min(560px, calc(100vw - 24px));
    max-height: calc(100dvh - 24px);
    margin: auto;
    padding: 20px;
    overflow-y: auto;
    border: 0;
    border-radius: var(--radius-2xl);
    background: var(--surface-1);
    box-shadow: var(--shadow-xl);
    color: var(--text-1);
    opacity: 1;
    transform: none;
    transition:
      opacity 200ms var(--ease-out),
      transform 320ms var(--ease-out),
      overlay 200ms allow-discrete,
      display 200ms allow-discrete;
  }
  .compare:not([open]) {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  @starting-style {
    .compare[open] {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }
  .compare::backdrop {
    background: rgb(0 0 0 / 0.6);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    font-size: 20px;
  }
  .pickers {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }
  .pickers span {
    color: var(--text-3);
    font-size: 13px;
  }
  select {
    height: 40px;
    min-width: 0;
    padding: 0 36px 0 16px;
    border: 0;
    border-radius: var(--radius-pill);
    appearance: none;
    background: var(--surface-2)
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23a3a3a3' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5.5 8 4.5 4.5L14.5 8'/%3E%3C/svg%3E")
      no-repeat right 12px center / 16px;
    color: var(--text-1);
    font: 500 14px var(--font-sans);
    color-scheme: dark;
    cursor: pointer;
  }
  svg {
    display: block;
    width: 100%;
    margin-top: 12px;
  }
  .result {
    display: grid;
    gap: 4px;
    margin-top: 8px;
    text-align: center;
  }
  .factor {
    font-size: 40px;
    font-weight: 600;
    letter-spacing: -0.03em;
  }
  .result span:last-child {
    color: var(--text-2);
    font-size: 14px;
  }
  .worlds {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 20px;
  }
  .world {
    display: grid;
    gap: 4px;
    padding: 14px 16px;
    border-radius: var(--radius-lg);
    background: var(--surface-2);
    text-align: left;
    transition: background-color var(--dur-fast) ease;
  }
  .world:hover {
    background: var(--surface-3);
  }
  .name {
    font-size: 15px;
    font-weight: 600;
  }
  .world span:not(.name) {
    color: var(--text-2);
    font-size: 13px;
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: 6px;
  }
  @media (max-width: 639px) {
    .compare {
      padding: 16px;
    }
    .world {
      padding: 12px;
    }
  }
  .note {
    margin-top: 14px;
    color: var(--text-3);
    font-size: 12px;
    text-align: center;
  }
</style>
