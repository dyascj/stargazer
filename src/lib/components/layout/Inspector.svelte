<script lang="ts">
  import { Vector3 } from 'three';
  import { selection } from '$stores/selection';
  import { getById, getChildren, getWorldPosition } from '$lib/registry/registry';
  import { isPlanetBody, type TrackedObject } from '$lib/registry/types';
  import { displayTime, isLive, setSimRate, setSimTime } from '$stores/simTime';
  import { closeInfoPanel, compareOpen, selectBody } from '$stores/ui';
  import { getLunarState } from '$utils/moon';
  import { iss, issTle } from '$stores/iss';
  import { tiangong, tiangongTle } from '$stores/tiangong';
  import { getCuratedSatelliteStore } from '$lib/registry/bodies/satellites';
  import BlurText from '$components/ui/BlurText.svelte';
  import BodyGlyph from '$components/ui/BodyGlyph.svelte';
  import Icon from '$components/ui/Icon.svelte';
  import SatellitePasses from './SatellitePasses.svelte';
  import { accuracyNote, heroStats, statusOf, trackingOf } from './inspector';

  // The parent keys this component on the selection, so the body is fixed per instance.
  const object = getById($selection) as TrackedObject;
  const parent = getById(object.parent);
  const satelliteStore =
    object.id === 'iss'
      ? iss
      : object.id === 'tiangong'
        ? tiangong
        : getCuratedSatelliteStore(object.id);
  const passTle = object.id === 'iss' ? issTle : object.id === 'tiangong' ? tiangongTle : null;
  const tracking = trackingOf(object);
  const children = getChildren(object.id);
  const nearby = children.length
    ? children
    : getChildren(object.parent).filter((body) => body.type === object.type && body !== object);
  const nearbyLabel = children.length
    ? `Around ${object.name}`
    : `Also around ${parent?.name ?? 'the Sun'}`;
  const facts = object.metadata.facts ?? [];
  const sources = [
    ...(object.metadata.sources ?? []),
    ...(object.parent === 'sun' && object.type === 'planet'
      ? [{ name: 'JPL position model', url: 'https://ssd.jpl.nasa.gov/planets/approx_pos.html' }]
      : [])
  ];

  const satellite = $derived(satelliteStore?.at($displayTime) ?? null);
  const lunar = $derived(object.id === 'moon' ? getLunarState($displayTime) : null);
  const hasPosition = $derived(
    !!getWorldPosition(object.id, $displayTime, new Vector3(), new Vector3())
  );
  const context = $derived({ hasPosition, satellite, isSatellite: !!satelliteStore });
  const stats = $derived(heroStats(object, $displayTime, satellite, lunar));
  const status = $derived(statusOf(object, { ...context, live: $isLive }));
  const note = $derived(accuracyNote(object, context));

  let dataSection: HTMLDetailsElement;
  function showData() {
    dataSection.open = true;
    requestAnimationFrame(() => dataSection.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  function goToSnapshot() {
    const epoch = tracking.epoch?.replace(' TDB', 'Z');
    if (!epoch) return;
    setSimTime(new Date(epoch));
    setSimRate(0);
  }
  const utc = (time: number) => new Date(time).toISOString().slice(0, 16).replace('T', ' ');
</script>

<article class="inspector">
  <header>
    <h2><BlurText text={object.name} /></h2>
    {#if object.metadata.subtitle}<p class="subtitle rise">{object.metadata.subtitle}</p>{/if}
    <button class="icon-btn close" type="button" aria-label="Close details" onclick={closeInfoPanel}
      ><Icon name="close" size={18} /></button
    >
  </header>

  {#if stats.length}
    <dl class="stats">
      {#each stats as stat, index (stat.label)}
        <div
          class="stat rise"
          style:--i={index + 1}
          data-sheet-peek={index === Math.min(1, stats.length - 1) ? '' : undefined}
        >
          <dt>{stat.label}</dt>
          <dd class="tabular">
            {stat.value}{#if stat.unit}<span class="unit">{stat.unit}</span>{/if}
          </dd>
        </div>
      {/each}
    </dl>
  {:else}
    <div data-sheet-peek></div>
  {/if}

  {#if status}
    <button type="button" class="status rise" style:--i="3" onclick={showData}>
      {#if status.tone === 'live'}<span class="live-dot"></span>{:else}<span
          class="dot"
          class:warning={status.tone === 'warning'}
        ></span>{/if}
      {status.text}
      <Icon name="info" size={15} />
    </button>
  {/if}

  {#if isPlanetBody(object) || passTle}
    <div class="actions rise" style:--i="4">
      {#if isPlanetBody(object)}
        <button class="btn" type="button" onclick={() => compareOpen.set(true)}
          ><Icon name="compare" size={18} /> Compare sizes</button
        >
      {/if}
      {#if passTle}
        <a class="btn" href="https://www.nasa.gov/live/" target="_blank" rel="noreferrer"
          >Watch NASA live <Icon name="external" size={14} /></a
        >
      {/if}
    </div>
  {/if}

  {#if nearby.length}
    <section class="nearby rise" style:--i="5" aria-label={nearbyLabel}>
      <h3>{nearbyLabel}</h3>
      <div class="chips">
        {#each nearby as body (body.id)}
          <button type="button" class="chip" onclick={() => selectBody(body.id)}
            ><BodyGlyph {body} size={10} />{body.name}</button
          >
        {/each}
      </div>
    </section>
  {/if}

  <div class="disclosures rise" style:--i="6">
    {#if object.metadata.description || facts.length}
      <details>
        <summary>About <Icon name="chevron-down" size={16} /></summary>
        <div class="content">
          {#if object.metadata.description}<p>{object.metadata.description}</p>{/if}
          {#if facts.length}
            <dl class="facts">
              {#each facts as fact (fact.label)}
                <div>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              {/each}
            </dl>
          {/if}
        </div>
      </details>
    {/if}
    {#if passTle}
      <details>
        <summary>Passes near you <Icon name="chevron-down" size={16} /></summary>
        <div class="content"><SatellitePasses tleStore={passTle} /></div>
      </details>
    {/if}
    <details bind:this={dataSection}>
      <summary>Data and accuracy <Icon name="chevron-down" size={16} /></summary>
      <div class="content">
        <p>{note}</p>
        <dl class="facts">
          <div>
            <dt>Model</dt>
            <dd>{tracking.mode}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{tracking.source}</dd>
          </div>
          {#if tracking.epoch}
            <div>
              <dt>Epoch</dt>
              <dd class="tabular">{tracking.epoch.slice(0, 10)}</dd>
            </div>
          {/if}
          {#if satellite}
            <div>
              <dt>Elements</dt>
              <dd class="tabular">{utc(satellite.elementEpoch)} UTC</dd>
            </div>
          {/if}
        </dl>
        {#if tracking.mode === 'Snapshot' && tracking.epoch}
          <button class="btn" type="button" onclick={goToSnapshot}>Set clock to snapshot</button>
        {/if}
        {#if sources.length}
          <ul class="sources">
            {#each sources as source (source.url)}
              <li>
                <a href={source.url} target="_blank" rel="noreferrer"
                  >{source.name} <Icon name="external" size={12} /></a
                >
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </details>
  </div>
</article>

<style>
  .inspector {
    padding: 20px 20px 24px;
  }
  header {
    position: relative;
    padding-right: 40px;
  }
  h2 {
    font-size: 28px;
    line-height: 1.1;
    letter-spacing: -0.025em;
    overflow-wrap: anywhere;
  }
  .subtitle {
    margin-top: 6px;
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.4;
  }
  .close {
    position: absolute;
    top: -6px;
    right: -8px;
    width: 36px;
    height: 36px;
  }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 20px;
  }
  .stat:last-child:nth-child(odd) {
    grid-column: span 2;
  }
  .stat {
    padding: 12px 14px;
    border-radius: var(--radius-lg);
    background: rgb(245 245 245 / 0.05);
  }
  dt {
    color: var(--text-3);
    font-size: 12px;
    font-weight: 500;
  }
  .stat dd {
    margin-top: 4px;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .unit {
    margin-left: 4px;
    color: var(--text-2);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    margin: 12px 0 0 -8px;
    padding: 0 8px;
    border-radius: var(--radius-pill);
    color: var(--text-2);
    font-size: 13px;
    transition:
      background-color var(--dur-fast) ease,
      color var(--dur-fast) ease;
  }
  .status:hover {
    background: rgb(245 245 245 / 0.06);
    color: var(--text-1);
  }
  .status :global(svg) {
    color: var(--text-3);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-3);
  }
  .dot.warning {
    background: var(--warning);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }
  .actions .btn {
    height: 36px;
    padding: 0 14px;
    font-size: 13px;
  }

  h3 {
    color: var(--text-3);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0;
  }
  .nearby {
    margin-top: 24px;
  }
  .chips {
    display: flex;
    gap: 6px;
    margin: 10px -20px 0;
    padding: 0 20px 2px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    /* Vertical drags on the row move the phone sheet, until the sheet itself scrolls. */
    touch-action: pan-x;
    mask-image: linear-gradient(90deg, transparent, #000 20px, #000 calc(100% - 28px), transparent);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: none;
    height: 34px;
    padding: 0 14px 0 12px;
    border-radius: var(--radius-pill);
    background: rgb(245 245 245 / 0.07);
    font-size: 13px;
    font-weight: 500;
    transition:
      background-color var(--dur-fast) ease,
      scale 260ms var(--ease-overshoot);
  }
  .chip:hover {
    background: rgb(245 245 245 / 0.12);
  }
  .chip:active {
    scale: 0.96;
    transition-duration: 90ms;
  }
  :global(.scrolls) .chips {
    touch-action: pan-x pan-y;
  }

  .disclosures {
    margin-top: 20px;
  }
  details {
    border-radius: var(--radius-lg);
    interpolate-size: allow-keywords;
  }
  details + details {
    margin-top: 2px;
  }
  details::details-content {
    block-size: 0;
    overflow: hidden;
    transition:
      block-size 320ms var(--ease-out),
      content-visibility 320ms allow-discrete;
  }
  details[open]::details-content {
    block-size: auto;
  }
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 0 12px;
    margin: 0 -12px;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    list-style: none;
    transition: background-color var(--dur-fast) ease;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    background: rgb(245 245 245 / 0.05);
  }
  summary :global(svg) {
    color: var(--text-3);
    transition: rotate 320ms var(--ease-out);
  }
  details[open] summary :global(svg) {
    rotate: 180deg;
  }
  .content {
    padding: 4px 0 16px;
  }
  .content > p {
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.6;
  }
  .facts {
    display: grid;
    margin-top: 12px;
  }
  .facts div {
    display: grid;
    grid-template-columns: minmax(96px, 40%) 1fr;
    gap: 12px;
    padding: 8px 0;
    font-size: 13px;
    line-height: 1.45;
  }
  .facts dt {
    font-size: 13px;
    font-weight: 400;
  }
  .facts dd {
    color: var(--text-1);
  }
  .content .btn {
    margin-top: 12px;
    height: 36px;
    font-size: 13px;
  }
  .sources {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 12px;
  }
  .sources a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    color: var(--text-2);
    font-size: 13px;
  }
  .sources a:hover {
    color: var(--text-1);
  }

  /* Fingers need bigger targets than the pointer-sized defaults. */
  @media (pointer: coarse) {
    .close {
      width: 44px;
      height: 44px;
      top: -10px;
      right: -12px;
    }
    .status,
    .sources a {
      min-height: 44px;
    }
    .chip,
    .actions .btn,
    .content .btn {
      height: 40px;
    }
  }
</style>
