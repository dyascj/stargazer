<script lang="ts">
  import { onMount } from 'svelte';
  import { flushSync } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import Brand from '$components/brand/Brand.svelte';
  import Scene from '$components/scene/Scene.svelte';
  import HoverTooltip from '$components/layout/HoverTooltip.svelte';
  import Breadcrumbs from '$components/layout/Breadcrumbs.svelte';
  import CompareWorlds from '$components/layout/CompareWorlds.svelte';
  import InspectorPanel from '$components/layout/InspectorPanel.svelte';
  import KeyboardNav from '$components/layout/KeyboardNav.svelte';
  import SearchDialog from '$components/layout/SearchDialog.svelte';
  import SettingsMenu from '$components/layout/SettingsMenu.svelte';
  import TimeControl from '$components/layout/TimeControl.svelte';
  import Icon from '$components/ui/Icon.svelte';
  import Segmented from '$components/ui/Segmented.svelte';
  import { iss } from '$stores/iss';
  import { tiangong } from '$stores/tiangong';
  import {
    startAllCuratedSatellites,
    stopAllCuratedSatellites
  } from '$lib/registry/bodies/satellites';
  import { closeInfoPanel, infoPanelOpen, paletteOpen, immersive, selectBody } from '$stores/ui';
  import { selection, SOLAR_SYSTEM_VIEW, overviewDistance } from '$stores/selection';
  import { getById } from '$lib/registry/registry';
  import { setSimTime, setSimRate, RATE_STEPS } from '$stores/simTime';

  const compact = new MediaQuery('(max-width: 639px)');
  let sheetOffset = $state(0);
  let sheetExpanded = $state(false);
  const docked = $derived($infoPanelOpen && compact.current);

  function openSearch() {
    // Focus must land inside the tap handler for mobile browsers to raise the keyboard.
    flushSync(() => paletteOpen.set(true));
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const body = params.get('body');
    if (body === SOLAR_SYSTEM_VIEW || getById(body)) selectBody(body!);
    else {
      // A bare visit starts calm: Earth in view, details one tap away.
      selectBody('earth');
      closeInfoPanel();
    }
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
    };
  });
</script>

<svelte:head>
  <title>{getById($selection)?.name ?? 'Solar system'} · Stargazer</title>
  <meta
    name="description"
    content="Explore planets, moons, spacecraft and live satellites in an interactive 3D solar system."
  />
  <link rel="canonical" href="https://stargazer-lab.vercel.app/app" />
</svelte:head>

<main
  class="explorer"
  style:--dock-bottom="calc(max(16px, env(safe-area-inset-bottom)) + {docked ? sheetOffset : 0}px)"
>
  <div class="viewport" class:beside-card={$infoPanelOpen && !compact.current}><Scene /></div>

  {#if $immersive}
    <button class="exit-immersive glass" type="button" onclick={() => immersive.set(false)}
      >Show interface <kbd>F</kbd></button
    >
  {:else}
    <header class="topbar">
      <div class="lead">
        <a class="brand" href="/" aria-label="Stargazer home"
          ><Brand size={20} wordmark={!compact.current} /></a
        >
        <Breadcrumbs />
      </div>
      <div class="trail">
        <button
          class="search-field glass"
          type="button"
          onclick={openSearch}
          aria-haspopup="dialog"
        >
          <Icon name="search" size={18} />
          <span class="placeholder">Search planets, moons, spacecraft</span>
          <kbd>/</kbd>
        </button>
        <SettingsMenu />
      </div>
    </header>

    {#if $selection === SOLAR_SYSTEM_VIEW}
      <div class="framing glass rise">
        <Segmented
          label="Framing"
          options={[
            { value: 650, label: 'Inner planets' },
            { value: 9000, label: 'All planets' }
          ]}
          value={$overviewDistance}
          onchange={(value) => overviewDistance.set(value)}
        />
      </div>
    {/if}

    {#if $infoPanelOpen}
      <InspectorPanel compact={compact.current} bind:sheetOffset bind:sheetExpanded />
    {/if}

    <div class="time-dock" class:hidden={docked && sheetExpanded}><TimeControl /></div>
  {/if}

  <SearchDialog bind:open={$paletteOpen} />
  <CompareWorlds />
  <KeyboardNav />
  <HoverTooltip />
</main>

<style>
  .explorer {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--bg);
    color: var(--text-1);
  }
  /* Own stacking context, so scene labels never rise above the interface. */
  .viewport {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
  /* Widen the canvas to the left so the focused body centers in the space beside the card. */
  .viewport.beside-card {
    left: -392px;
  }

  .topbar {
    position: absolute;
    inset: 0 0 auto;
    z-index: 30;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    padding: 16px 16px 0 20px;
    pointer-events: none;
  }
  .topbar > * {
    pointer-events: auto;
  }
  .lead {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .brand {
    display: flex;
    align-items: center;
    flex: none;
    height: 44px;
    padding-right: 8px;
  }
  /* Search plus settings spans exactly the inspector card's column. */
  .trail {
    display: flex;
    gap: 8px;
  }
  .search-field {
    display: flex;
    align-items: center;
    gap: 8px;
    width: clamp(220px, 32vw, 308px);
    height: 44px;
    padding: 0 10px 0 14px;
    border-radius: var(--radius-pill);
    color: var(--text-3);
    font-size: 14px;
    transition:
      background-color var(--dur-fast) ease,
      scale 260ms var(--ease-overshoot);
  }
  .search-field:hover {
    background: rgb(36 36 36 / 0.8);
  }
  .search-field:active {
    scale: 0.98;
    transition-duration: 90ms;
  }
  .placeholder {
    flex: 1;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .framing {
    position: absolute;
    top: 76px;
    left: 20px;
    z-index: 30;
    padding: 4px;
    border-radius: var(--radius-pill);
  }
  .framing :global(.segmented) {
    background: none;
  }

  .time-dock {
    position: absolute;
    left: 50%;
    bottom: var(--dock-bottom);
    z-index: 35;
    translate: -50% 0;
    transition:
      bottom 420ms cubic-bezier(0.22, 0.9, 0.28, 1),
      opacity 200ms ease;
  }
  .time-dock.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .exit-immersive {
    position: absolute;
    right: 16px;
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 30;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 0 10px 0 16px;
    border-radius: var(--radius-pill);
    color: var(--text-2);
    font-size: 13px;
    font-weight: 500;
    opacity: 0.6;
    transition: opacity var(--dur-fast) ease;
  }
  .exit-immersive:hover,
  .exit-immersive:focus-visible {
    opacity: 1;
  }

  @media (max-width: 639px) {
    .topbar {
      gap: 8px;
      padding: max(8px, env(safe-area-inset-top)) 8px 0 12px;
    }
    .lead {
      gap: 0;
    }
    .brand {
      padding-right: 4px;
    }
    .search-field {
      width: 44px;
      padding: 0;
      justify-content: center;
      color: var(--text-1);
    }
    .placeholder,
    .search-field kbd {
      display: none;
    }
    .framing {
      top: calc(max(8px, env(safe-area-inset-top)) + 52px);
      left: 12px;
    }
  }
</style>
