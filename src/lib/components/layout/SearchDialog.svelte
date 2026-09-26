<script lang="ts">
  import { tick } from 'svelte';
  import type { TrackedObject } from '$lib/registry/types';
  import { selectBody } from '$stores/ui';
  import BodyGlyph from '$components/ui/BodyGlyph.svelte';
  import Icon from '$components/ui/Icon.svelte';
  import Segmented from '$components/ui/Segmented.svelte';
  import { setMorphOrigin } from '$components/ui/morph';
  import LaunchList from './LaunchList.svelte';
  import { SHORTCUTS, SHORTCUT_GROUPS, TYPE_LABELS, searchBodies } from './search';

  let { open = $bindable(false) }: { open: boolean } = $props();

  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let list: HTMLElement | undefined = $state();
  let query = $state('');
  let view = $state<'explore' | 'launches'>('explore');
  let active = $state(0);
  const [tiles, ...groups] = SHORTCUT_GROUPS;
  const results = $derived(query.trim() ? searchBodies(query) : null);
  const options = $derived(results ?? (view === 'explore' ? SHORTCUTS : []));
  const optionId = (index: number) => `search-option-${index}`;

  $effect(() => {
    if (open && !dialog.open) {
      query = '';
      view = 'explore';
      active = 0;
      dialog.showModal();
      input.focus();
    } else if (!open && dialog.open) dialog.close();
  });

  function setQuery(value: string) {
    query = value;
    active = 0;
    list?.scrollTo({ top: 0 });
  }

  function choose(body: TrackedObject, index: number) {
    const element = document.getElementById(optionId(index));
    if (element) setMorphOrigin(element);
    selectBody(body.id);
    open = false;
  }

  async function activate(index: number) {
    active = Math.max(0, Math.min(options.length - 1, index));
    await tick();
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  }

  // Combobox keys. The empty state opens with a row of planet tiles, so left and right
  // walk the tiles while up and down move between the tiles and the lists below.
  function keydown(event: KeyboardEvent) {
    if (!options.length) return;
    const tileCount = results ? 0 : tiles.bodies.length;
    const inTiles = active < tileCount;
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = inTiles ? tileCount : active + 1;
    else if (event.key === 'ArrowUp')
      next = inTiles ? active : active === tileCount ? 0 : active - 1;
    else if (inTiles && !query && event.key === 'ArrowRight')
      next = Math.min(active + 1, tileCount - 1);
    else if (inTiles && !query && event.key === 'ArrowLeft') next = active - 1;
    else if (event.key === 'Enter' && options[active]) {
      event.preventDefault();
      choose(options[active], active);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    void activate(next);
  }

  function globalKey(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || open) return;
    const editing = (event.target as HTMLElement).closest(
      'input, textarea, select, [contenteditable="true"], dialog[open]'
    );
    const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (shortcut || (event.key === '/' && !editing)) {
      event.preventDefault();
      open = true;
    }
  }
</script>

<svelte:window onkeydown={globalKey} />

{#snippet row(body: TrackedObject, index: number, showType: boolean)}
  <button
    type="button"
    role="option"
    class="row"
    id={optionId(index)}
    tabindex="-1"
    aria-selected={index === active}
    onpointermove={(event) => event.pointerType === 'mouse' && (active = index)}
    onclick={() => choose(body, index)}
  >
    <BodyGlyph {body} />
    <span class="row-text">
      <span class="name">{body.name}</span>
      {#if body.metadata.subtitle}<span class="subtitle">{body.metadata.subtitle}</span>{/if}
    </span>
    {#if showType}<span class="type">{TYPE_LABELS[body.type]}</span>{/if}
  </button>
{/snippet}

<dialog
  bind:this={dialog}
  class="search"
  aria-label="Search"
  onclose={() => (open = false)}
  onclick={(event) => event.target === dialog && (open = false)}
>
  <div class="field">
    <Icon name="search" />
    <input
      bind:this={input}
      value={query}
      oninput={(event) => setQuery(event.currentTarget.value)}
      onkeydown={keydown}
      type="search"
      placeholder="Planets, moons, spacecraft"
      aria-label="Search planets, moons, spacecraft"
      autocomplete="off"
      spellcheck="false"
      enterkeyhint="go"
      role="combobox"
      aria-expanded={options.length > 0}
      aria-controls="search-options"
      aria-activedescendant={options.length ? optionId(active) : undefined}
    />
    {#if query}
      <button
        class="icon-btn clear"
        type="button"
        aria-label="Clear search"
        onclick={() => {
          setQuery('');
          input.focus();
        }}><Icon name="close" size={16} /></button
      >
    {/if}
    <button class="cancel" type="button" onclick={() => (open = false)}>Cancel</button>
  </div>

  {#if !results}
    <div class="views">
      <Segmented
        label="Browse"
        options={[
          { value: 'explore', label: 'Explore' },
          { value: 'launches', label: 'Launches' }
        ]}
        value={view}
        onchange={(value) => {
          view = value;
          active = 0;
        }}
      />
    </div>
  {/if}

  <!-- Focusable so keyboards can scroll the launch list, which has no options to move through. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="scroll" bind:this={list} tabindex="0" role="region" aria-label="Search results">
    {#if results}
      {#if results.length}
        <div id="search-options" role="listbox" aria-label="Results" class="rows">
          {#each results as body, index (body.id)}{@render row(body, index, true)}{/each}
        </div>
      {:else}
        <div class="empty">
          <p>No matches for “{query.trim()}”</p>
          <span>Try a planet, a mission, or a catalog number like 25544.</span>
        </div>
      {/if}
    {:else if view === 'explore'}
      <div id="search-options" role="listbox" aria-label="Destinations">
        <div class="rise group" role="group" aria-labelledby="group-0">
          <h3 id="group-0" role="presentation">{tiles.label}</h3>
          <div class="tiles">
            {#each tiles.bodies as body, index (body.id)}
              <button
                type="button"
                role="option"
                class="tile"
                id={optionId(index)}
                tabindex="-1"
                aria-selected={index === active}
                onpointermove={(event) => event.pointerType === 'mouse' && (active = index)}
                onclick={() => choose(body, index)}
                ><BodyGlyph {body} size={body.id === 'sun' ? 26 : 22} /><span>{body.name}</span
                ></button
              >
            {/each}
          </div>
        </div>
        {#each groups as group, groupIndex (group.label)}
          <div
            class="rise group"
            style:--i={groupIndex + 1}
            role="group"
            aria-labelledby="group-{groupIndex + 1}"
          >
            <h3 id="group-{groupIndex + 1}" role="presentation">{group.label}</h3>
            <div class="rows">
              {#each group.bodies as body, index (body.id)}{@render row(
                  body,
                  group.start + index,
                  false
                )}{/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <LaunchList />
    {/if}
  </div>

  <footer hidden={!results && view === 'launches'}>
    <span><kbd>↑</kbd><kbd>↓</kbd> Move</span>
    <span><kbd>↵</kbd> Fly there</span>
    <span><kbd>esc</kbd> Close</span>
  </footer>
</dialog>

<style>
  .search {
    position: fixed;
    inset: 12vh 0 auto;
    width: min(620px, calc(100vw - 32px));
    height: min(640px, 76dvh);
    margin: 0 auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    border: 0;
    border-radius: var(--radius-2xl);
    background: rgb(22 22 22 / 0.84);
    -webkit-backdrop-filter: var(--glass-blur);
    backdrop-filter: var(--glass-blur);
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
  .search:not([open]) {
    display: none;
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  @starting-style {
    .search[open] {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
  }
  .search::backdrop {
    background: rgb(0 0 0 / 0.55);
    transition:
      opacity 200ms ease,
      overlay 200ms allow-discrete,
      display 200ms allow-discrete;
  }
  @starting-style {
    .search[open]::backdrop {
      opacity: 0;
    }
  }

  .field {
    flex: none;
    display: flex;
    align-items: center;
    gap: 12px;
    height: 60px;
    padding: 0 12px 0 20px;
    color: var(--text-3);
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    background: none;
    color: var(--text-1);
    font: 400 17px var(--font-sans);
    outline: none;
  }
  input::placeholder {
    color: var(--text-3);
  }
  input::-webkit-search-cancel-button {
    display: none;
  }
  .clear {
    width: 32px;
    height: 32px;
  }
  .cancel {
    display: none;
    height: 44px;
    padding: 0 4px 0 8px;
    color: var(--text-1);
    font-size: 16px;
  }

  .views {
    flex: none;
    padding: 0 16px 8px;
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 4px 0 8px;
  }
  .scroll:focus-visible {
    outline-offset: -2px;
  }
  .group + .group {
    margin-top: 12px;
  }
  h3 {
    padding: 8px 20px 6px;
    color: var(--text-3);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0;
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(9, minmax(64px, 1fr));
    gap: 2px;
    padding: 0 8px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }
  .tile {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 10px;
    height: 84px;
    border-radius: var(--radius-lg);
    color: var(--text-2);
    font-size: 12px;
    font-weight: 500;
    transition: color var(--dur-fast) ease;
  }
  .tile > :global(.glyph) {
    align-self: end;
  }
  .rows {
    display: grid;
    gap: 1px;
    padding: 0 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 52px;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    text-align: left;
  }
  .tile[aria-selected='true'],
  .row[aria-selected='true'] {
    background: rgb(245 245 245 / 0.07);
    color: var(--text-1);
  }
  .row-text {
    display: grid;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }
  .name {
    font-size: 14px;
    font-weight: 500;
  }
  .subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-3);
    font-size: 12.5px;
  }
  .type {
    flex: none;
    color: var(--text-3);
    font-size: 12px;
  }
  .empty {
    display: grid;
    gap: 6px;
    padding: 40px 24px;
    text-align: center;
  }
  .empty p {
    font-size: 15px;
    font-weight: 500;
  }
  .empty span {
    color: var(--text-3);
    font-size: 13px;
  }
  footer {
    flex: none;
    display: flex;
    gap: 18px;
    padding: 12px 20px;
    background: rgb(0 0 0 / 0.18);
    border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
    color: var(--text-3);
    font-size: 12px;
  }
  footer[hidden] {
    display: none;
  }
  /* Keyboard hints mean nothing to a finger. */
  @media (pointer: coarse) {
    footer {
      display: none;
    }
  }
  footer span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  footer span > :global(kbd:last-of-type) {
    margin-right: 2px;
  }

  @media (max-width: 639px) {
    .search {
      inset: 0;
      width: 100%;
      max-width: none;
      height: 100dvh;
      max-height: none;
      border-radius: 0;
      padding-top: env(safe-area-inset-top);
      background: rgb(12 12 12 / 0.9);
    }
    .field {
      padding: 0 12px 0 16px;
    }
    .cancel {
      display: block;
    }
    .views {
      padding: 0 12px 8px;
    }
    .views :global(.segmented) {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
    }
    /* Two rows instead of a sideways scroller: every planet in reach without a swipe. */
    .tiles {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 4px 2px;
      overflow: visible;
    }
    .tile {
      height: 76px;
      gap: 8px;
    }
    .row {
      min-height: 56px;
    }
    .type,
    footer {
      display: none;
    }
    .scroll {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
</style>
