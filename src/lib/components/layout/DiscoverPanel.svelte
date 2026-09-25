<script lang="ts">
  import { onDestroy } from 'svelte';
  import { selectBody } from '$stores/ui';
  import type { Launch } from '../../../routes/api/launches/+server';
  let { onClose }: { onClose: () => void } = $props();
  let tab = $state<'places' | 'launches'>('places');
  let launches = $state<Launch[] | null>(null);
  let failed = $state(false);
  let stale = $state(false);
  let fetchedAt = $state(0);
  let attempted = false;
  const abort = new AbortController();
  onDestroy(() => abort.abort());
  const places = [
    {
      id: 'earth',
      name: 'Earth',
      texture: '/textures/earth_albedo_2k.webp',
      color: '#64b7da'
    },
    {
      id: 'moon',
      name: 'The Moon',
      texture: '/textures/moon_albedo_2k.webp',
      color: '#bcb9b3'
    },
    {
      id: 'mars',
      name: 'Mars',
      texture: '/textures/mars_albedo_2k.jpg',
      color: '#d58664'
    },
    {
      id: 'saturn',
      name: 'Saturn',
      texture: '/textures/2k_saturn.jpg',
      color: '#d6c89c'
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      texture: '/textures/2k_jupiter.jpg',
      color: '#d2b08d'
    },
    {
      id: 'voyager-1',
      name: 'Voyager 1',
      texture: '',
      color: '#d0d7e5'
    }
  ];
  function changeTab(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    tab =
      event.key === 'Home'
        ? 'places'
        : event.key === 'End'
          ? 'launches'
          : tab === 'places'
            ? 'launches'
            : 'places';
    const buttons = (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[role=tab]'
    );
    buttons[tab === 'places' ? 0 : 1]?.focus();
  }
  function choose(id: string) {
    selectBody(id);
    onClose();
  }
  $effect(() => {
    if (tab !== 'launches' || attempted) return;
    attempted = true;
    failed = false;
    fetch('/api/launches', { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const body = await response.json();
        launches = body.launches;
        stale = body.stale;
        fetchedAt = body.fetchedAt;
      })
      .catch((error) => {
        if (error.name !== 'AbortError') failed = true;
      });
  });
</script>

<div class="discover space-panel">
  <div class="discover-header">
    <button class="icon-button" type="button" onclick={onClose} aria-label="Close destinations"
      >×</button
    >
  </div>
  <div
    class="discover-tabs"
    role="tablist"
    tabindex="-1"
    aria-label="Explore space"
    onkeydown={changeTab}
  >
    <button
      type="button"
      role="tab"
      id="destination-tab"
      aria-controls="discovery-content"
      tabindex={tab === 'places' ? 0 : -1}
      aria-selected={tab === 'places'}
      onclick={() => (tab = 'places')}>Destinations</button
    ><button
      type="button"
      role="tab"
      id="launch-tab"
      aria-controls="discovery-content"
      tabindex={tab === 'launches' ? 0 : -1}
      aria-selected={tab === 'launches'}
      onclick={() => (tab = 'launches')}>Launch watch <span>↗</span></button
    >
  </div>
  <div
    role="tabpanel"
    id="discovery-content"
    aria-labelledby={tab === 'places' ? 'destination-tab' : 'launch-tab'}
  >
    {#if tab === 'places'}
      <div class="destinations">
        {#each places as place}<button
            type="button"
            onclick={() => choose(place.id)}
            class="destination"
            ><span
              class="planet-thumb"
              class:ringed={place.id === 'saturn'}
              style={`--planet-color:${place.color};background-image:url('${place.texture}')`}
              >{place.texture ? '' : '↗'}</span
            ><span><strong>{place.name}</strong></span><span class="destination-arrow">↗</span
            ></button
          >{/each}
      </div>
      <div class="station-shortcuts">
        <button type="button" onclick={() => choose('iss')}>↗ Visit the ISS</button><button
          type="button"
          onclick={() => choose('starlink-5447')}>↗ Follow Starlink</button
        >
      </div>
    {:else}
      <p class="discovery-note">Times UTC. Launch schedules may change.</p>
      {#if failed}<div class="launch-empty">
          <p>The launch schedule is temporarily unavailable.</p>
          <a href="https://thespacedevs.com/llapi" target="_blank" rel="noreferrer"
            >Visit the data provider ↗</a
          >
        </div>
      {:else if launches}
        {#if stale}<p class="discovery-note">
            Showing a cached schedule from {new Date(fetchedAt).toUTCString()}.
          </p>{/if}
        {#if launches.length === 0}<p class="launch-empty">
            No upcoming launches are available.
          </p>{/if}
        <div class="launches">
          {#each launches as launch}<article>
              <div class="launch-meta">
                <span>{launch.provider}</span><time datetime={launch.date}
                  >{new Date(launch.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    timeZone: 'UTC'
                  })}</time
                >
              </div>
              <h3>{launch.name}</h3>
              <p>{launch.pad}</p>
              <small
                >{launch.status} · {new Date(launch.date).toISOString().slice(11, 16)} UTC</small
              >
            </article>{/each}
        </div>
      {:else}<p class="launch-empty" role="status">Checking the launch schedule…</p>{/if}
      <a
        class="provider-link"
        href="https://thespacedevs.com/llapi"
        target="_blank"
        rel="noreferrer">Source: Launch Library 2 ↗</a
      >
    {/if}
  </div>
</div>

<style>
  .discover {
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: var(--space-scrollbar) transparent;
    width: 284px;
    max-height: calc(100dvh - 198px);
    overflow-y: auto;
    padding: 12px 20px 20px;
  }
  .discover button:hover {
    color: var(--space-text);
    background-color: var(--space-hover);
  }
  .discover .icon-button {
    border-radius: 0;
  }
  .discover-header {
    position: absolute;
    right: 6px;
    top: 10px;
  }
  .discover-tabs {
    display: flex;
    border-bottom: 1px solid var(--space-line);
    gap: 18px;
    margin-right: 25px;
    margin-bottom: 8px;
  }
  .discover-tabs button {
    min-height: 44px;
    font-size: 11px;
    color: var(--space-muted);
    border-bottom: 1px solid transparent;
  }
  .discover-tabs button[aria-selected='true'] {
    color: var(--space-text);
    border-bottom-color: var(--space-accent);
  }
  .discover-tabs span {
    color: var(--space-accent);
    margin-left: 4px;
  }
  .destination {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    min-height: 66px;
    text-align: left;
    border-bottom: 1px solid var(--space-line);
  }
  .planet-thumb {
    position: relative;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: 50%;
    background-color: var(--planet-color);
    background-size: auto 100%;
    box-shadow:
      inset -9px -3px 10px #000c,
      0 0 14px #ffffff08;
    display: grid;
    place-items: center;
  }
  .planet-thumb.ringed::after {
    content: '';
    position: absolute;
    width: 54px;
    height: 18px;
    border: 4px solid #ad9d7c99;
    border-radius: 50%;
    transform: rotate(-28deg);
  }
  strong {
    display: block;
    font-size: 12px;
    font-weight: 500;
  }
  small {
    display: block;
    color: var(--space-muted);
    font-size: 11px;
    margin-top: 4px;
  }
  .destination-arrow {
    margin-left: auto;
    color: var(--space-muted);
    transition: transform 160ms ease;
  }
  .destination:hover .destination-arrow {
    color: var(--space-accent);
    transform: translate(2px, -2px);
  }
  .station-shortcuts {
    display: flex;
    gap: 8px;
    margin: 16px 0;
  }
  .station-shortcuts button {
    font-size: 11px;
    flex: 1;
    padding: 10px 6px;
    min-height: 40px;
    border: 1px solid var(--space-line);
    border-radius: 0;
  }
  .discovery-note {
    font-size: 11px;
    color: var(--space-muted);
    line-height: 1.8;
  }
  .launch-empty {
    font-size: 12px;
    padding: 30px 0;
    color: var(--space-muted);
    line-height: 1.7;
  }
  .launch-empty a,
  .provider-link {
    color: var(--space-accent);
    font-size: 11px;
  }
  .provider-link {
    display: inline-block;
    margin-top: 20px;
  }
  article {
    padding: 18px 0;
    border-bottom: 1px solid var(--space-line);
  }
  .launch-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 11px;
    color: var(--space-accent);
    margin-bottom: 8px;
  }
  .launch-meta time {
    flex-shrink: 0;
    white-space: nowrap;
  }
  article h3 {
    font-size: 13px;
    line-height: 1.6;
  }
  article p {
    font-size: 11px;
    color: var(--space-muted);
    margin: 6px 0;
    line-height: 1.6;
  }
  @media (max-width: 639px) {
    .discover {
      position: relative;
      width: min(360px, calc(100vw - 24px));
      max-height: calc(100dvh - 224px);
    }
  }
</style>
