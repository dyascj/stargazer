<script lang="ts">
  import { TRACKED_OBJECTS, getById } from '$lib/registry/registry';
  import { isPlanetBody } from '$lib/registry/types';
  import { compareOpen, selectBody } from '$stores/ui';
  import { selection } from '$stores/selection';
  const worlds = TRACKED_OBJECTS.filter(isPlanetBody);
  let dialog: HTMLDialogElement;
  let first = $state('earth'),
    second = $state('jupiter');
  const left = $derived(worlds.find((body) => body.id === first)!);
  const right = $derived(worlds.find((body) => body.id === second)!);
  const maximum = $derived(Math.max(left.metadata.radiusKm, right.metadata.radiusKm));
  const ratio = $derived(right.metadata.radiusKm / left.metadata.radiusKm);
  $effect(() => {
    if (!dialog) return;
    if ($compareOpen && !dialog.open) {
      const object = getById($selection);
      if (object && isPlanetBody(object)) {
        first = object.id;
        second = object.id === 'earth' ? 'jupiter' : 'earth';
      }
      dialog.showModal();
    } else if (!$compareOpen && dialog.open) dialog.close();
  });
</script>

<dialog
  class="space-ui compare-dialog space-panel"
  bind:this={dialog}
  aria-label="Compare world sizes"
  oncancel={() => compareOpen.set(false)}
  onclose={() => compareOpen.set(false)}
>
  <div class="compare-heading">
    <div>
      <h2 class="font-display">Compare sizes</h2>
    </div>
    <button
      type="button"
      class="icon-button"
      aria-label="Close comparison"
      onclick={() => compareOpen.set(false)}>×</button
    >
  </div>
  <p>Compare physical sizes. The two discs below use the same scale.</p>
  <div class="world-selectors">
    <select aria-label="First world" bind:value={first}
      >{#each worlds as body}<option value={body.id}>{body.name}</option>{/each}</select
    ><span>×</span><select aria-label="Second world" bind:value={second}
      >{#each worlds as body}<option value={body.id}>{body.name}</option>{/each}</select
    >
  </div>
  <svg
    viewBox="0 0 560 240"
    role="img"
    aria-label={`${right.name} has ${ratio.toFixed(2)} times the diameter of ${left.name}`}
  >
    <defs
      ><radialGradient id="compare-light" cx="30%" cy="25%" r="80%"
        ><stop stop-color="#eee5d6" /><stop offset=".7" stop-color="#ae9d83" /><stop
          offset="1"
          stop-color="#34332f"
        /></radialGradient
      ></defs
    >
    <path d="M20 225H540" stroke="#20201e30" stroke-dasharray="3 5" />
    <circle
      cx="140"
      cy={225 - (105 * left.metadata.radiusKm) / maximum}
      r={(105 * left.metadata.radiusKm) / maximum}
      fill="url(#compare-light)"
    />
    <circle
      cx="420"
      cy={225 - (105 * right.metadata.radiusKm) / maximum}
      r={(105 * right.metadata.radiusKm) / maximum}
      fill="url(#compare-light)"
    />
  </svg>
  <div class="world-facts">
    {#each [left, right] as body}<div>
        <strong>{body.name}</strong><span
          >{(body.metadata.radiusKm * 2).toLocaleString('en-US')} km diameter</span
        ><button
          type="button"
          onclick={() => {
            compareOpen.set(false);
            selectBody(body.id);
          }}>Explore {body.name} ↗</button
        >
      </div>{/each}
  </div>
  <p class="comparison-result">
    {ratio >= 1 ? right.name : left.name} is
    <strong
      >{(ratio >= 1 ? ratio : 1 / ratio).toLocaleString('en-US', {
        maximumFractionDigits: 2
      })}×</strong
    >
    the diameter of {ratio >= 1 ? left.name : right.name}.
  </p>
  <p class="comparison-note">
    Volumetric mean diameters. Rings and flattening are omitted. The 3D scene enlarges bodies
    relative to orbital distances to keep them visible.
  </p>
</dialog>

<style>
  .compare-dialog {
    width: min(600px, calc(100vw - 24px));
    margin: auto;
    padding: 28px;
    color: var(--space-text);
    max-height: 90dvh;
    overflow-y: auto;
    background: var(--space-surface);
  }
  .compare-dialog::backdrop {
    background: #02050bc9;
    backdrop-filter: blur(8px);
  }
  .compare-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  h2 {
    font-size: 34px;
    text-transform: uppercase;
    margin: 12px 0;
  }
  p {
    font-size: 12px;
    line-height: 1.7;
    color: var(--space-muted);
  }
  .world-selectors {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 24px 0 8px;
  }
  select {
    color-scheme: light;
    background: var(--space-inset);
    border: 1px solid var(--space-line);
    padding: 12px;
    font-size: 13px;
    min-width: 0;
    width: 100%;
    border-radius: 0;
  }
  .world-selectors span {
    color: var(--space-muted);
  }
  svg {
    width: 100%;
  }
  .world-facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding-top: 16px;
    text-align: center;
  }
  .world-facts > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  strong {
    font-weight: 500;
    font-size: 14px;
    color: var(--space-text);
  }
  .world-facts span {
    font-size: 11px;
    color: var(--space-muted);
  }
  .world-facts button {
    font-size: 11px;
    color: var(--space-accent);
    min-height: 40px;
  }
  .comparison-result {
    margin: 20px 0 12px;
    padding-top: 20px;
    border-top: 1px solid var(--space-line);
  }
  .comparison-note {
    font-size: 10px;
  }
  @media (max-width: 639px) {
    .compare-dialog {
      padding: 20px;
    }
    select {
      font-size: 12px;
      padding: 10px;
    }
  }
</style>
