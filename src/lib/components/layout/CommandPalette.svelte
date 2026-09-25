<script lang="ts">
  import { TRACKED_OBJECTS } from '$lib/registry/registry';
  import { selectBody } from '$stores/ui';
  import { SOLAR_SYSTEM_VIEW } from '$stores/selection';
  let { open = $bindable(false) }: { open: boolean } = $props();
  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let query = $state('');
  let category = $state('all');
  let index = $state(0);
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'planet', name: 'Planets' },
    { id: 'moon', name: 'Moons' },
    { id: 'spacecraft', name: 'Missions' },
    { id: 'earth-satellite', name: 'Satellites' },
    { id: 'small', name: 'Small bodies' }
  ];
  const results = $derived(
    TRACKED_OBJECTS.filter((body) => {
      const typeMatches =
        category === 'all' ||
        body.type === category ||
        (category === 'spacecraft' && body.type === 'lander') ||
        (category === 'small' &&
          ['asteroid', 'comet', 'dwarf-planet', 'trans-neptunian'].includes(body.type));
      const text =
        `${body.id} ${body.name} ${body.metadata.subtitle ?? ''} ${body.metadata.externalId ?? ''}`.toLowerCase();
      return (
        typeMatches &&
        query
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .every((term) => text.includes(term))
      );
    })
  );
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      query = '';
      category = 'all';
      index = 0;
      dialog.showModal();
      input.focus();
    } else if (!open && dialog.open) dialog.close();
  });
  $effect(() => {
    void query;
    void category;
    index = 0;
  });
  function choose(id: string) {
    selectBody(id);
    open = false;
  }
  function keydown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.target !== input) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      index =
        (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) %
        Math.max(results.length, 1);
      document.getElementById(`search-result-${index}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[index]) choose(results[index].id);
    }
  }
  function globalKey(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey) return;
    const editing = (event.target as HTMLElement).closest(
      'input, textarea, select, [contenteditable="true"]'
    );
    if (
      (event.key === '/' && !editing) ||
      ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')
    ) {
      event.preventDefault();
      open = true;
    }
  }
</script>

<svelte:window onkeydown={globalKey} />
<dialog
  bind:this={dialog}
  class="space-ui search-dialog"
  oncancel={() => (open = false)}
  onclose={() => (open = false)}
  onkeydown={keydown}
  aria-label="Search the solar system"
>
  <div class="search-heading">
    <svg viewBox="0 0 20 20" aria-hidden="true"
      ><circle cx="8" cy="8" r="5.5" /><path d="m12 12 5 5" /></svg
    ><input
      bind:this={input}
      bind:value={query}
      aria-label="Search destinations"
      placeholder="Planets, moons, missions…"
      autocomplete="off"
      role="combobox"
      aria-expanded="true"
      aria-controls="search-results"
      aria-activedescendant={results.length ? `search-result-${index}` : undefined}
    /><button
      type="button"
      class="icon-button"
      aria-label="Close search"
      onclick={() => (open = false)}>×</button
    >
  </div>
  <div class="search-categories">
    {#each categories as item}<button
        type="button"
        aria-pressed={category === item.id}
        onclick={() => (category = item.id)}>{item.name}</button
      >{/each}
  </div>
  <div class="search-summary">
    <span>{results.length} destinations</span><button
      type="button"
      onclick={() => choose(SOLAR_SYSTEM_VIEW)}>Solar system overview ↗</button
    >
  </div>
  <div id="search-results" class="search-results" role="listbox" aria-label="Destinations">
    {#each results as body, i}<button
        type="button"
        role="option"
        id={`search-result-${i}`}
        aria-selected={i === index}
        onclick={() => choose(body.id)}
        onpointerenter={() => (index = i)}
        ><span class="result-dot"></span><span
          ><strong>{body.name}</strong><small
            >{body.metadata.subtitle ?? body.type.replaceAll('-', ' ')}</small
          ></span
        ><span class="result-arrow">↗</span></button
      >{/each}
  </div>
  {#if !results.length}<p class="search-empty">
      No destinations found. Try “Earth”, “ISS”, or “SpaceX”.
    </p>{/if}
  <div class="search-footer">
    <span>↑ ↓ Browse</span><span>↵ Fly to</span><span>esc Close</span>
  </div>
</dialog>

<style>
  .search-dialog {
    position: fixed;
    inset: 12vh auto auto 50%;
    transform: translateX(-50%);
    margin: 0;
    width: min(580px, calc(100vw - 24px));
    max-height: 78dvh;
    padding: 0;
    border: 1px solid var(--space-line);
    border-radius: 0;
    color: var(--space-text);
    background: var(--space-surface);
    box-shadow: 0 28px 100px #0009;
    overflow: hidden;
  }
  .search-dialog::backdrop {
    background: #02050bb3;
    backdrop-filter: blur(8px);
  }
  .search-heading {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid var(--space-line);
  }
  .search-heading svg {
    width: 20px;
    fill: none;
    stroke: var(--space-muted);
    stroke-width: 1.5;
    flex-shrink: 0;
  }
  input {
    background: transparent;
    border: 0;
    min-width: 0;
    flex: 1;
    font-size: 16px;
    color: var(--space-text);
    height: 40px;
    outline-offset: 5px;
  }
  input::placeholder {
    color: var(--space-muted);
  }
  .search-categories {
    display: flex;
    padding: 8px 14px;
    gap: 4px;
    overflow-x: auto;
    border-bottom: 1px solid var(--space-line);
  }
  .search-categories button {
    min-height: 40px;
    padding: 0 12px;
    font-size: 11px;
    white-space: nowrap;
    color: var(--space-muted);
    border-radius: 0;
  }
  .search-categories button[aria-pressed='true'] {
    color: var(--space-accent);
    background: var(--space-inset);
  }
  .search-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px;
    font-size: 10px;
    color: var(--space-muted);
  }
  .search-summary button {
    min-height: 40px;
    color: var(--space-accent);
  }
  .search-results {
    overflow-y: auto;
    max-height: 44dvh;
    padding: 0 8px 8px;
  }
  .search-results button {
    display: flex;
    gap: 14px;
    align-items: center;
    width: 100%;
    padding: 12px;
    min-height: 62px;
    text-align: left;
    border-radius: 0;
  }
  .search-results button[aria-selected='true'] {
    background: var(--space-inset);
  }
  .result-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--space-muted);
    flex-shrink: 0;
  }
  [aria-selected='true'] .result-dot {
    background: var(--space-accent);
  }
  strong {
    font-weight: 500;
    font-size: 13px;
  }
  small {
    display: block;
    font-size: 10px;
    line-height: 1.6;
    margin-top: 3px;
    color: var(--space-muted);
  }
  .result-arrow {
    margin-left: auto;
    color: var(--space-muted);
  }
  .search-footer {
    display: flex;
    gap: 20px;
    padding: 16px 20px;
    border-top: 1px solid var(--space-line);
    font-size: 10px;
    color: var(--space-muted);
  }
  .search-empty {
    padding: 30px 20px;
    font-size: 12px;
    color: var(--space-muted);
  }
  @media (max-width: 639px) {
    .search-dialog {
      top: 5dvh;
      max-height: 88dvh;
    }
    .search-results {
      max-height: 53dvh;
    }
  }
</style>
