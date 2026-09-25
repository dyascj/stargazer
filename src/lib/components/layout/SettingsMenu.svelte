<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { selection, SOLAR_SYSTEM_VIEW } from '$stores/selection';
  import { displayTime, isLive, simRate } from '$stores/simTime';
  import {
    immersive,
    showOrbits,
    showLabels,
    showStars,
    showGrid,
    showStarLabels,
    showTrails,
    brightLighting
  } from '$stores/ui';
  import Icon from '$components/ui/Icon.svelte';

  const layers = $derived([
    { store: showOrbits, on: $showOrbits, label: 'Orbits' },
    { store: showLabels, on: $showLabels, label: 'Labels' },
    { store: showTrails, on: $showTrails, label: 'Motion trails' },
    { store: showStars, on: $showStars, label: 'Stars' },
    { store: showStarLabels, on: $showStarLabels, label: 'Star names' },
    { store: showGrid, on: $showGrid, label: 'Reference grid' },
    { store: brightLighting, on: $brightLighting, label: 'Brighten night sides' }
  ]);
  const gestures = [
    ['Rotate', 'Drag', 'One finger'],
    ['Zoom', 'Scroll', 'Pinch'],
    ['Pan', 'Right-drag', 'Two fingers'],
    ['Select', 'Click a body', 'Tap a body']
  ];
  const shortcuts: [string, string[]][] = [
    ['Search', ['/', '⌘K']],
    ['Play or pause', ['Space']],
    ['Faster or slower', ['+', '−']],
    ['Back to now', ['N']],
    ['Next or previous planet', ['←', '→']],
    ['Solar system', ['H']],
    ['Recenter', ['R']],
    ['Hide interface', ['F']],
    ['Close or go back', ['Esc']]
  ];

  let menu: HTMLElement;
  let view = $state<'main' | 'help'>('main');
  let copied = $state(false);
  let copiedTimer: ReturnType<typeof setTimeout>;
  onDestroy(() => clearTimeout(copiedTimer));

  async function showView(next: typeof view) {
    view = next;
    await tick();
    menu.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }

  async function share() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('body', $selection ?? SOLAR_SYSTEM_VIEW);
    if (!$isLive) {
      url.searchParams.set('time', $displayTime.toISOString());
      url.searchParams.set('rate', String($simRate));
    }
    window.history.replaceState(window.history.state, '', url);
    try {
      await navigator.clipboard.writeText(url.toString());
      copied = true;
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => (copied = false), 2400);
    } catch {
      // The address bar now holds the link, which is the useful fallback.
    }
  }

  function hideInterface() {
    menu.hidePopover();
    immersive.set(true);
  }
</script>

<button
  class="icon-btn trigger glass"
  type="button"
  popovertarget="settings-menu"
  aria-label="View settings"
  data-tip="View settings"
  data-tip-align="end"><Icon name="sliders" /></button
>

<div
  id="settings-menu"
  class="menu glass"
  popover
  bind:this={menu}
  ontoggle={(event) => event.newState === 'closed' && (view = 'main')}
>
  {#if view === 'main'}
    <section class="group" aria-labelledby="settings-show">
      <h2 id="settings-show">Show</h2>
      {#each layers as layer (layer.label)}
        <label class="row">
          <span>{layer.label}</span>
          <input
            type="checkbox"
            role="switch"
            class="switch"
            checked={layer.on}
            onchange={(event) => layer.store.set(event.currentTarget.checked)}
          />
        </label>
      {/each}
    </section>
    <div class="actions group">
      <button class="row" type="button" onclick={share}>
        <span>{copied ? 'Link copied' : 'Copy link to this view'}</span>
        <Icon name={copied ? 'check' : 'link'} size={18} />
      </button>
      <button class="row" type="button" onclick={hideInterface}>
        <span>Hide interface</span>
        <kbd>F</kbd>
      </button>
      <button class="row" type="button" onclick={() => showView('help')}>
        <span>Controls and shortcuts</span>
        <Icon name="chevron-right" size={18} />
      </button>
    </div>
  {:else}
    <div class="help-header">
      <button
        class="icon-btn"
        type="button"
        aria-label="Back to settings"
        data-autofocus
        onclick={() => showView('main')}><Icon name="chevron-left" /></button
      >
      <h2>Controls and shortcuts</h2>
    </div>
    <section class="group" aria-label="Gestures">
      {#each gestures as [action, pointer, touch] (action)}
        <div class="row static">
          <span>{action}</span>
          <span class="hint"
            ><span class="pointer">{pointer}</span><span class="touch">{touch}</span></span
          >
        </div>
      {/each}
    </section>
    <section class="keys group" aria-label="Keyboard shortcuts">
      {#each shortcuts as [action, keys] (action)}
        <div class="row static">
          <span>{action}</span>
          <span class="keycaps"
            >{#each keys as key (key)}<kbd>{key}</kbd>{/each}</span
          >
        </div>
      {/each}
    </section>
  {/if}
</div>

<style>
  .trigger {
    width: 44px;
    height: 44px;
    color: var(--text-1);
  }
  .menu {
    position: fixed;
    inset: 72px 16px auto auto;
    width: 300px;
    max-height: calc(100dvh - 96px);
    margin: 0;
    padding: 6px;
    overflow-y: auto;
    border: 0;
    border-radius: var(--radius-2xl);
    color: var(--text-1);
    transform-origin: top right;
    opacity: 1;
    transform: none;
    transition:
      opacity 180ms var(--ease-out),
      transform 280ms var(--ease-out),
      overlay 180ms allow-discrete,
      display 180ms allow-discrete;
  }
  .menu:not(:popover-open) {
    opacity: 0;
    transform: scale(0.96);
  }
  @starting-style {
    .menu:popover-open {
      opacity: 0;
      transform: scale(0.96);
    }
  }
  .group {
    padding: 4px;
    border-radius: calc(var(--radius-2xl) - 6px);
    background: rgb(245 245 245 / 0.04);
  }
  .group + .group {
    margin-top: 6px;
  }
  h2 {
    padding: 8px 10px 4px;
    color: var(--text-3);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 40px;
    padding: 0 10px;
    border-radius: var(--radius-md);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background-color var(--dur-fast) ease;
  }
  .row:hover {
    background: rgb(245 245 245 / 0.06);
  }
  .row :global(svg) {
    color: var(--text-2);
  }
  .static {
    cursor: default;
  }
  .static:hover {
    background: none;
  }
  .hint {
    color: var(--text-2);
    font-size: 13px;
  }
  .touch {
    display: none;
  }
  @media (pointer: coarse) {
    .row {
      min-height: 44px;
    }
    .pointer,
    .keys {
      display: none;
    }
    .touch {
      display: inline;
    }
  }
  .keycaps {
    display: inline-flex;
    gap: 4px;
  }

  .switch {
    appearance: none;
    position: relative;
    flex: none;
    width: 36px;
    height: 22px;
    border-radius: var(--radius-pill);
    background: var(--surface-4);
    cursor: pointer;
    transition: background-color 200ms var(--ease-out);
  }
  .switch::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text-1);
    box-shadow: var(--shadow-sm);
    transition: translate 280ms var(--ease-overshoot);
  }
  .switch:checked {
    background: var(--text-1);
  }
  .switch:checked::before {
    background: var(--bg);
  }
  .switch:checked::before {
    translate: 14px 0;
  }

  .help-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 2px 6px;
  }
  .help-header h2 {
    padding: 0;
    color: var(--text-1);
    font-size: 14px;
  }

  @media (max-width: 639px) {
    .menu {
      inset: calc(env(safe-area-inset-top) + 64px) 12px auto auto;
      width: min(320px, calc(100vw - 24px));
    }
  }
</style>
