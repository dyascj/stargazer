<script lang="ts">
  import type { Launch } from '$lib/launches';
  import { setSimRate, setSimTime } from '$stores/simTime';
  import { cameraCommand, closeInfoPanel } from '$stores/ui';
  import BlurText from '$components/ui/BlurText.svelte';
  import Icon from '$components/ui/Icon.svelte';
  import { countdown, formatCoordinates, launchTitle, utc, windowOf } from './launch';

  let { launch }: { launch: Launch } = $props();

  const { title, vehicle } = $derived(launchTitle(launch));
  const liftoff = $derived(new Date(launch.date));
  const go = $derived(launch.status.toLowerCase().startsWith('go'));
  const launchWindow = $derived(windowOf(launch));
  const coordinates = $derived(launch.site && formatCoordinates(launch.site));

  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });
  const remaining = $derived(countdown(liftoff.getTime() - now, launch.precision));

  /** Show the sky at liftoff: the clock stops at T-0 and the camera turns back to the pad. */
  function goToLiftoff() {
    setSimTime(liftoff);
    setSimRate(0);
    cameraCommand.set('reset');
  }
</script>

<article class="launch">
  <header>
    <h2><BlurText text={title} /></h2>
    <p class="subtitle rise">{[vehicle, launch.provider].filter(Boolean).join(' · ')}</p>
    <button class="icon-btn close" type="button" aria-label="Close launch" onclick={closeInfoPanel}
      ><Icon name="close" size={18} /></button
    >
  </header>

  <dl class="stats">
    <div class="stat rise" style:--i="1">
      <dt>{remaining.label}</dt>
      <dd class="tabular">{remaining.value}</dd>
    </div>
    <div class="stat rise" style:--i="2" data-sheet-peek>
      <dt>Your time</dt>
      <dd class="tabular">
        {liftoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}<span
          class="unit"
          >{liftoff.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span
        >
      </dd>
    </div>
  </dl>

  <p class="status rise" style:--i="3">
    <span class="dot" class:go></span>{launch.status}
  </p>

  <dl class="facts rise" style:--i="4">
    <div>
      <dt>Pad</dt>
      <dd>{launch.pad}</dd>
    </div>
    {#if launch.site?.location}
      <div>
        <dt>Location</dt>
        <dd>{launch.site.location}</dd>
      </div>
    {/if}
    {#if coordinates}
      <div>
        <dt>Coordinates</dt>
        <dd class="tabular">{coordinates}</dd>
      </div>
    {/if}
    {#if launch.orbit}
      <div>
        <dt>Destination</dt>
        <dd>{launch.orbit}</dd>
      </div>
    {/if}
    <div>
      <dt>{launchWindow ? 'Window' : 'Liftoff'}</dt>
      <dd class="tabular">{launchWindow ?? `${utc(launch.date)} UTC`}</dd>
    </div>
  </dl>

  {#if launch.mission}<p class="mission rise" style:--i="5">{launch.mission}</p>{/if}

  <div class="actions rise" style:--i="6">
    <button class="btn" type="button" onclick={goToLiftoff}>Set clock to liftoff</button>
    {#if launch.site}
      <a
        class="btn"
        href="https://www.google.com/maps?q={launch.site.latitude},{launch.site.longitude}"
        target="_blank"
        rel="noreferrer">Pad on a map <Icon name="external" size={14} /></a
      >
    {/if}
  </div>

  <p class="source rise" style:--i="7">
    Schedules change often.
    <a href="https://thespacedevs.com/llapi" target="_blank" rel="noreferrer"
      >Launch Library 2 <Icon name="external" size={12} /></a
    >
  </p>
</article>

<style>
  .launch {
    padding: 20px 20px 24px;
  }
  header {
    position: relative;
    padding-right: 40px;
  }
  h2 {
    font-size: 24px;
    line-height: 1.15;
    letter-spacing: -0.02em;
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
    /* The countdown keeps to one line; the date gives way. */
    grid-template-columns: auto 1fr;
    gap: 8px;
    margin-top: 20px;
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
  }
  .stat:first-child dd {
    white-space: nowrap;
  }
  .unit {
    margin-left: 6px;
    color: var(--text-2);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    color: var(--text-2);
    font-size: 13px;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-3);
  }
  .dot.go {
    background: var(--success);
  }

  .facts {
    display: grid;
    margin-top: 12px;
  }
  .facts div {
    display: grid;
    grid-template-columns: minmax(96px, 36%) 1fr;
    gap: 12px;
    padding: 8px 0;
    font-size: 13px;
    line-height: 1.45;
  }
  .facts dt {
    font-size: 13px;
    font-weight: 400;
  }
  .mission {
    margin-top: 12px;
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-line;
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
  .source {
    margin-top: 16px;
    color: var(--text-3);
    font-size: 12px;
  }
  .source a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-2);
  }
  .source a:hover {
    color: var(--text-1);
  }

  @media (pointer: coarse) {
    .close {
      width: 44px;
      height: 44px;
      top: -10px;
      right: -12px;
    }
    .actions .btn {
      height: 40px;
    }
  }
</style>
