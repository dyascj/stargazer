<script lang="ts">
  import { onMount } from 'svelte';
  import Brand from '$components/brand/Brand.svelte';
  import CompareWorlds from '$components/layout/CompareWorlds.svelte';
  import Scene from '$components/scene/Scene.svelte';
  import RightPanel from '$components/layout/RightPanel.svelte';
  import TimeControl from '$components/layout/TimeControl.svelte';
  import HoverTooltip from '$components/layout/HoverTooltip.svelte';
  import KeyboardNav from '$components/layout/KeyboardNav.svelte';
  import CommandPalette from '$components/layout/CommandPalette.svelte';
  import DiscoverPanel from '$components/layout/DiscoverPanel.svelte';
  import { iss } from '$stores/iss';
  import { tiangong } from '$stores/tiangong';
  import {
    startAllCuratedSatellites,
    stopAllCuratedSatellites
  } from '$lib/registry/bodies/satellites';
  import {
    infoPanelOpen,
    openInfoPanel,
    paletteOpen,
    immersive,
    selectBody,
    cameraCommand,
    showOrbits,
    showLabels,
    showStars,
    showGrid,
    showStarLabels,
    showTrails,
    brightLighting
  } from '$stores/ui';
  import { selection, SOLAR_SYSTEM_VIEW, overviewDistance } from '$stores/selection';
  import { getById, getAncestors } from '$lib/registry/registry';
  import {
    setSimTime,
    setSimRate,
    displayTime,
    simRate,
    isLive,
    RATE_STEPS
  } from '$stores/simTime';

  let discoverOpen = $state(true);
  let settingsOpen = $state(false);
  let helpOpen = $state(false);
  let shareStatus = $state('Share view');
  let shareTimer: ReturnType<typeof setTimeout>;
  const selectedObject = $derived(getById($selection));
  const ancestors = $derived(
    selectedObject ? getAncestors(selectedObject.id).filter((body) => body.id !== 'sun') : []
  );
  const layers = $derived([
    { store: showOrbits, checked: $showOrbits, label: 'Orbit paths' },
    { store: showLabels, checked: $showLabels, label: 'Object labels' },
    { store: showTrails, checked: $showTrails, label: 'Motion trails' },
    { store: showStars, checked: $showStars, label: 'Starfield' },
    { store: showGrid, checked: $showGrid, label: 'Reference grid' },
    { store: showStarLabels, checked: $showStarLabels, label: 'Reference stars' },
    { store: brightLighting, checked: $brightLighting, label: 'Brighten night sides' }
  ]);
  $effect(() => {
    if ($selection && $selection !== SOLAR_SYSTEM_VIEW) discoverOpen = false;
  });
  function overview() {
    selectBody(SOLAR_SYSTEM_VIEW);
    discoverOpen = true;
    settingsOpen = false;
    helpOpen = false;
  }
  async function share() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('body', $selection ?? SOLAR_SYSTEM_VIEW);
    if (!$isLive) {
      url.searchParams.set('time', $displayTime.toISOString());
      url.searchParams.set('rate', String($simRate));
    }
    try {
      await navigator.clipboard.writeText(url.toString());
      shareStatus = 'Link copied';
    } catch {
      shareStatus = 'Copy link from address bar';
      window.history.replaceState(window.history.state, '', url);
    }
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => (shareStatus = 'Share view'), 3000);
  }
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const body = params.get('body');
    if (body === SOLAR_SYSTEM_VIEW || getById(body)) selectBody(body!);
    else selectBody('earth');
    const time = params.get('time');
    if (time && Number.isFinite(Date.parse(time))) {
      setSimTime(new Date(time));
      const rate = Number(params.get('rate') ?? 0);
      setSimRate(RATE_STEPS.includes(Math.abs(rate)) ? rate : 0);
    }
    iss.start();
    tiangong.start();
    startAllCuratedSatellites();
    return () => {
      iss.stop();
      tiangong.stop();
      stopAllCuratedSatellites();
      clearTimeout(shareTimer);
    };
  });
</script>

<svelte:head
  ><title>Stargazer · Explore the solar system</title><meta
    name="description"
    content="Explore planets, moons, spacecraft, and satellite predictions in an interactive 3D solar system."
  /></svelte:head
>
<main class="space-ui observatory" class:immersive={$immersive}>
  <div class="scene-viewport" class:with-inspector={$infoPanelOpen}><Scene /></div>
  <div class="scene-vignette" aria-hidden="true"></div>
  {#if !$immersive}
    <header class="observatory-header">
      <a class="observatory-brand" href="/" aria-label="Stargazer home"><Brand size={22} /></a>
      <div class="header-actions">
        <button
          class="search-trigger"
          type="button"
          aria-label="Find a destination"
          onclick={() => paletteOpen.set(true)}
          ><svg viewBox="0 0 16 16" aria-hidden="true"
            ><circle cx="6.5" cy="6.5" r="4.5" /><path d="m10 10 4 4" /></svg
          ><span>Find a destination</span><kbd>/</kbd></button
        ><button class="share-button" type="button" onclick={share}>{shareStatus} ↗</button>
      </div>
    </header>
    <nav class="view-navigation" aria-label="Scene navigation">
      <button class="nav-chip" type="button" onclick={overview} title="Solar system overview (H)"
        ><span>⊙</span> Solar system</button
      >
      {#if $selection === SOLAR_SYSTEM_VIEW}<div class="overview-framing">
          <button
            type="button"
            aria-pressed={$overviewDistance === 650}
            onclick={() => overviewDistance.set(650)}>Inner planets</button
          ><button
            type="button"
            aria-pressed={$overviewDistance === 9000}
            onclick={() => overviewDistance.set(9000)}>All planets</button
          >
        </div>{/if}
      {#each ancestors as body}<span class="breadcrumb-separator">/</span><button
          class="breadcrumb"
          type="button"
          onclick={() => selectBody(body.id)}
          aria-current={body.id === $selection ? 'location' : undefined}>{body.name}</button
        >{/each}
    </nav>
    <div class="explore-actions">
      <button
        class="nav-chip"
        type="button"
        aria-expanded={discoverOpen}
        onclick={() => {
          discoverOpen = !discoverOpen;
          settingsOpen = false;
          helpOpen = false;
        }}>Explore <span>{discoverOpen ? '−' : '+'}</span></button
      >
    </div>
    {#if discoverOpen}<div class="discover-position">
        <DiscoverPanel onClose={() => (discoverOpen = false)} />
      </div>{/if}
    {#if $infoPanelOpen}<aside
        class="body-inspector space-panel"
        aria-label="Destination information"
      >
        {#key $selection}<RightPanel />{/key}
      </aside>
    {:else if selectedObject}<button
        type="button"
        class="info-reopen nav-chip"
        onclick={openInfoPanel}>About {selectedObject.name} ↗</button
      >{/if}
    <div class="camera-tools space-panel" aria-label="Camera controls">
      <button
        type="button"
        class="icon-button"
        onclick={() => cameraCommand.set('zoom-in')}
        aria-label="Zoom in"
        title="Zoom in">+</button
      >
      <button
        type="button"
        class="icon-button"
        onclick={() => cameraCommand.set('zoom-out')}
        aria-label="Zoom out"
        title="Zoom out">−</button
      >
      <span></span><button
        type="button"
        class="icon-button"
        onclick={() => cameraCommand.set('reset')}
        aria-label="Reset camera"
        title="Reset camera (R)">⤾</button
      >
      <button
        type="button"
        class="icon-button"
        onclick={() => cameraCommand.set('top')}
        aria-label="View from above"
        title="View from above">⊤</button
      >
    </div>
    <div class="utility-tools">
      <button
        type="button"
        class="nav-chip"
        aria-expanded={settingsOpen}
        onclick={() => {
          settingsOpen = !settingsOpen;
          helpOpen = false;
        }}>Layers <span>☷</span></button
      ><button
        type="button"
        class="nav-chip"
        aria-expanded={helpOpen}
        onclick={() => {
          helpOpen = !helpOpen;
          settingsOpen = false;
        }}
        aria-label="Navigation help">?</button
      ><button
        type="button"
        class="nav-chip"
        onclick={() => immersive.set(true)}
        title="Immersive view (F)"
        aria-label="Enter immersive view">⛶</button
      >
    </div>
    {#if settingsOpen}<div class="settings-panel space-panel">
        {#each layers as layer}<label
            ><span>{layer.label}</span><input
              type="checkbox"
              checked={layer.checked}
              onchange={(event) => layer.store.set(event.currentTarget.checked)}
            /></label
          >{/each}
        <p>
          Orbit distances are proportional. Bodies and local systems are enlarged for readability.
        </p>
      </div>{/if}
    {#if helpOpen}<div class="help-panel space-panel">
        <h2 class="font-display">Make yourself at home.</h2>
        <dl>
          <div>
            <dt>Orbit your target</dt>
            <dd>Drag / one finger</dd>
          </div>
          <div>
            <dt>Move closer</dt>
            <dd>Scroll / pinch</dd>
          </div>
          <div>
            <dt>Pan the view</dt>
            <dd>Right drag / two fingers</dd>
          </div>
          <div>
            <dt>Find a destination</dt>
            <dd>/ or ⌘ K</dd>
          </div>
          <div>
            <dt>Pause time</dt>
            <dd>Space</dd>
          </div>
          <div>
            <dt>Return to overview</dt>
            <dd>H</dd>
          </div>
          <div>
            <dt>Immersive view</dt>
            <dd>F / Esc</dd>
          </div>
        </dl>
        <p>
          Positions are model estimates or dated snapshots. Open a destination for its source and
          accuracy notes.
        </p>
      </div>{/if}
    <div class="time-position"><TimeControl /></div>
  {:else}<button type="button" class="exit-immersive nav-chip" onclick={() => immersive.set(false)}
      >⛶ Show controls <kbd>esc</kbd></button
    >{/if}
  <CompareWorlds /><CommandPalette bind:open={$paletteOpen} /><KeyboardNav /><HoverTooltip />
</main>

<style>
  .observatory {
    position: relative;
    height: 100dvh;
    overflow: hidden;
    background: #03060c;
  }
  .scene-viewport {
    position: absolute;
    inset: 0;
  }
  .scene-viewport.with-inspector {
    right: 344px;
  }
  .scene-vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(#02050b44, transparent 18%, transparent 75%, #02050b99);
  }
  .observatory-header {
    position: absolute;
    inset: 0 0 auto;
    height: 72px;
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 28px;
    border-bottom: 1px solid var(--space-line);
    background: var(--space-surface);
    z-index: 50;
  }
  .observatory-brand {
    display: flex;
    gap: 11px;
    align-items: center;
    font:
      12px var(--font-sans),
      monospace;
    letter-spacing: 0.22em;
    min-height: 44px;
  }
  .header-actions {
    display: flex;
    gap: 18px;
    align-items: center;
    margin-left: auto;
  }
  .search-trigger {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 0 14px;
    min-height: 40px;
    border-radius: 0;
    border: 1px solid var(--space-line);
    background: var(--space-inset);
    font-size: 11px;
  }
  .search-trigger svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: var(--space-muted);
    stroke-width: 1.4;
  }
  .search-trigger kbd {
    margin-left: 30px;
    color: var(--space-muted);
  }
  .share-button {
    font-size: 11px;
    min-height: 40px;
    color: var(--space-muted);
  }
  .view-navigation {
    position: absolute;
    top: 88px;
    left: 28px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 45;
    max-width: calc(100vw - 160px);
    background: var(--space-surface);
    border: 1px solid var(--space-line);
    padding-right: 14px;
  }
  .view-navigation :global(.nav-chip) {
    border: 0;
  }
  .overview-framing {
    display: flex;
    gap: 4px;
    background: var(--space-inset);
    border-radius: 0;
  }
  .overview-framing button {
    min-height: 40px;
    padding: 0 10px;
    font-size: 10px;
    color: var(--space-muted);
  }
  .overview-framing button[aria-pressed='true'] {
    color: var(--space-accent);
    background: var(--space-hover);
  }
  .breadcrumb {
    font-size: 11px;
    min-height: 40px;
    color: var(--space-muted);
  }
  .breadcrumb[aria-current] {
    color: var(--space-text);
  }
  .breadcrumb-separator {
    color: var(--space-muted);
    font-size: 12px;
  }
  .explore-actions {
    position: absolute;
    top: 88px;
    right: 28px;
    z-index: 50;
  }
  .discover-position {
    position: absolute;
    top: 148px;
    left: 28px;
    z-index: 45;
  }
  .body-inspector {
    position: absolute;
    right: 16px;
    top: 148px;
    bottom: 102px;
    width: 320px;
    z-index: 45;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--space-scrollbar) transparent;
  }
  .info-reopen {
    position: absolute;
    top: 148px;
    right: 28px;
    z-index: 44;
  }
  .camera-tools {
    display: flex;
    flex-direction: column;
    padding: 3px;
    position: absolute;
    left: 28px;
    bottom: 100px;
    z-index: 42;
  }
  .camera-tools > span {
    height: 1px;
    background: var(--space-line);
    margin: 3px 8px;
  }
  .utility-tools {
    position: absolute;
    right: 28px;
    bottom: 32px;
    display: flex;
    gap: 8px;
    z-index: 46;
  }
  .time-position {
    position: absolute;
    bottom: 27px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 48;
  }
  .settings-panel,
  .help-panel {
    position: absolute;
    bottom: 94px;
    right: 28px;
    width: 280px;
    padding: 20px;
    z-index: 49;
  }
  .settings-panel label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    min-height: 44px;
    cursor: pointer;
  }
  .settings-panel input {
    accent-color: var(--space-accent);
    width: 16px;
    height: 16px;
  }
  .settings-panel p,
  .help-panel p {
    margin-top: 14px;
    color: var(--space-muted);
    font-size: 10px;
    line-height: 1.8;
    border-top: 1px solid var(--space-line);
    padding-top: 14px;
  }
  .help-panel {
    width: 320px;
  }
  .help-panel h2 {
    text-transform: uppercase;
    font-size: 22px;
    margin-bottom: 18px;
  }
  .help-panel dl div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 10px;
    padding: 12px 0;
  }
  .help-panel dd {
    color: var(--space-muted);
  }
  .exit-immersive {
    position: absolute;
    right: 24px;
    bottom: 24px;
    z-index: 50;
  }
  .exit-immersive kbd {
    margin-left: 12px;
    opacity: 0.4;
    font-size: 9px;
  }
  @media (max-width: 1150px) {
    .utility-tools {
      bottom: 105px;
    }
  }
  @media (max-width: 800px) {
    .share-button {
      display: none;
    }
    .search-trigger kbd {
      display: none;
    }
    .body-inspector {
      width: 286px;
    }
    .scene-viewport.with-inspector {
      right: 302px;
    }
  }
  @media (max-width: 639px) {
    .observatory-header {
      height: 62px;
      padding: 0 16px;
      gap: 12px;
    }
    .observatory-brand {
      font-size: 10px;
      gap: 8px;
    }
    .search-trigger {
      width: 44px;
      padding: 0;
      justify-content: center;
    }
    .search-trigger span {
      display: none;
    }
    .view-navigation {
      left: 12px;
      top: 76px;
      gap: 8px;
    }
    .view-navigation :global(.nav-chip) {
      border: 0;
    }
    .overview-framing {
      position: absolute;
      top: 48px;
      left: 55px;
      white-space: nowrap;
      background: var(--space-surface);
      border: 1px solid var(--space-line);
    }
    .view-navigation .breadcrumb-separator,
    .view-navigation .breadcrumb {
      display: none;
    }
    .explore-actions {
      right: 12px;
      top: 76px;
    }
    .discover-position {
      left: 12px;
      top: 128px;
      z-index: 47;
    }
    .body-inspector {
      top: auto;
      bottom: 96px;
      right: 12px;
      left: 12px;
      width: auto;
      max-height: 39dvh;
    }
    .scene-viewport.with-inspector {
      right: 0;
      top: 116px;
      bottom: calc(39dvh + 96px);
    }
    .camera-tools {
      left: 12px;
      bottom: auto;
      top: 128px;
    }
    .utility-tools {
      right: 12px;
      bottom: auto;
      top: 128px;
      flex-direction: column;
    }
    .settings-panel,
    .help-panel {
      right: 12px;
      bottom: auto;
      top: 180px;
      max-width: calc(100vw - 24px);
      max-height: calc(100dvh - 280px);
      overflow-y: auto;
    }
    .time-position {
      bottom: max(16px, env(safe-area-inset-bottom));
    }
    .info-reopen {
      top: 128px;
      right: 12px;
      max-width: 220px;
    }
  }
</style>
