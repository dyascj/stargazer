<script lang="ts">
  import {
    displayTime,
    simRate,
    isLive,
    setSimTime,
    setSimRate,
    togglePause,
    reverseTime,
    resyncSimTimeToNow,
    RATE_STEPS,
    MIN_SIM_TIME,
    MAX_SIM_TIME
  } from '$stores/simTime';
  import Icon from '$components/ui/Icon.svelte';
  import Segmented from '$components/ui/Segmented.svelte';

  const SPEED_LABELS = ['Real', '1 min', '1 hr', '1 day', '1 mo', '1 yr'];
  const speeds = RATE_STEPS.map((value, index) => ({ value, label: SPEED_LABELS[index] }));

  let sheet: HTMLElement;
  let draft = $state('');
  let dateError = $state('');
  // Remembered so the direction control still reads correctly while paused.
  let direction = $state(1);
  $effect(() => {
    if ($simRate !== 0) direction = Math.sign($simRate);
  });

  const date = $derived(
    $displayTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    })
  );
  const clock = $derived($displayTime.toISOString().slice(11, 19));
  const rateLabel = $derived.by(() => {
    if ($simRate === 0) return 'Paused';
    const index = RATE_STEPS.indexOf(Math.abs($simRate));
    const label = index === 0 ? '1×' : `${SPEED_LABELS[index] ?? `${Math.abs($simRate)}×`}/s`;
    return $simRate < 0 ? `−${label}` : label;
  });

  function toggled(event: ToggleEvent) {
    if (event.newState !== 'open') return;
    draft = $displayTime.toISOString().slice(0, 16);
    dateError = '';
  }

  function jump(event: SubmitEvent) {
    event.preventDefault();
    const time = Date.parse(`${draft}:00Z`);
    if (!Number.isFinite(time) || time < MIN_SIM_TIME || time > MAX_SIM_TIME) {
      dateError = 'Choose a date from 1800 through 2049.';
      return;
    }
    setSimTime(new Date(time));
    setSimRate(0);
    sheet.hidePopover();
  }

  function backToNow() {
    resyncSimTimeToNow();
    sheet.hidePopover();
  }
</script>

<div class="pill glass">
  <button
    class="icon-btn play"
    type="button"
    onclick={togglePause}
    aria-label={$simRate === 0 ? 'Play' : 'Pause'}
    data-tip={$simRate === 0 ? 'Play' : 'Pause'}
    data-tip-side="top"><Icon name={$simRate === 0 ? 'play' : 'pause'} size={18} /></button
  >
  <button class="readout" type="button" popovertarget="time-sheet">
    <span class="when tabular"
      ><span class="date">{date}</span><span class="clock">{clock} UTC</span></span
    >
    {#if !$isLive}<span class="rate tabular">{rateLabel}</span>{/if}
  </button>
  <button
    class="live"
    class:on={$isLive}
    type="button"
    onclick={resyncSimTimeToNow}
    aria-label={$isLive ? 'Showing live time' : 'Return to live time'}
    aria-pressed={$isLive}
  >
    <span class={$isLive ? 'live-dot' : 'dot'}></span>Live
  </button>
</div>

<div id="time-sheet" class="sheet glass" popover bind:this={sheet} ontoggle={toggled}>
  <div class="section">
    <h2 class="heading">Speed</h2>
    <Segmented
      label="Direction"
      fill
      options={[
        { value: -1, label: 'Reverse' },
        { value: 1, label: 'Forward' }
      ]}
      value={direction}
      onchange={(value) => {
        if (value !== direction) reverseTime();
        direction = value;
      }}
    />
    <Segmented
      label="Simulated time per second"
      fill
      options={speeds}
      value={$simRate === 0 ? null : Math.abs($simRate)}
      onchange={(value) => setSimRate(value * direction)}
    />
    <p class="hint">Simulated time per real second</p>
  </div>
  <form class="section" onsubmit={jump}>
    <label class="heading" for="time-sheet-date">Date and time, UTC</label>
    <div class="date-row">
      <input
        id="time-sheet-date"
        class="tabular"
        type="datetime-local"
        bind:value={draft}
        min="1800-01-01T00:00"
        max="2049-12-31T23:59"
        required
      />
      <button class="btn" type="submit">Go</button>
    </div>
    {#if dateError}<p class="error" role="alert">{dateError}</p>{/if}
  </form>
  {#if !$isLive}
    <button class="btn btn-primary now" type="button" onclick={backToNow}>Back to now</button>
  {/if}
</div>

<style>
  .pill {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 52px;
    padding: 0 6px;
    border-radius: var(--radius-pill);
  }
  .play {
    width: 40px;
    height: 40px;
    color: var(--text-1);
  }
  .readout {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 40px;
    padding: 0 12px;
    border-radius: var(--radius-pill);
    text-align: left;
    transition: background-color var(--dur-fast) ease;
  }
  .readout:hover,
  .readout:focus-visible {
    background: rgb(245 245 245 / 0.08);
  }
  .when {
    display: grid;
    white-space: nowrap;
    line-height: 1.2;
  }
  .date {
    font-size: 13px;
    font-weight: 500;
  }
  .clock {
    color: var(--text-2);
    font-size: 12px;
  }
  .rate {
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    background: rgb(245 245 245 / 0.08);
    color: var(--text-1);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 14px 0 12px;
    border-radius: var(--radius-pill);
    color: var(--text-2);
    font-size: 13px;
    font-weight: 500;
    transition:
      background-color var(--dur-fast) ease,
      color var(--dur-fast) ease;
  }
  .live:hover {
    background: rgb(245 245 245 / 0.08);
    color: var(--text-1);
  }
  .live.on {
    color: var(--accent-strong);
    pointer-events: none;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-3);
  }

  .sheet {
    position: fixed;
    inset: auto 0 calc(var(--dock-bottom, 24px) + 60px);
    width: min(400px, calc(100vw - 24px));
    margin: 0 auto;
    padding: 8px;
    border: 0;
    border-radius: var(--radius-2xl);
    color: var(--text-1);
    opacity: 1;
    transform: none;
    transition:
      opacity 200ms var(--ease-out),
      transform 320ms var(--ease-out),
      overlay 200ms allow-discrete,
      display 200ms allow-discrete;
  }
  .sheet:not(:popover-open) {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  @starting-style {
    .sheet:popover-open {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }
  .section {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: var(--radius-xl);
    background: rgb(245 245 245 / 0.04);
  }
  .section + .section {
    margin-top: 8px;
  }
  .heading {
    color: var(--text-2);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0;
  }
  .hint {
    color: var(--text-3);
    font-size: 12px;
  }
  .date-row {
    display: flex;
    gap: 8px;
  }
  input {
    flex: 1;
    min-width: 0;
    height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: var(--radius-pill);
    background: rgb(245 245 245 / 0.08);
    color: var(--text-1);
    font: 500 14px var(--font-sans);
    color-scheme: dark;
  }
  .error {
    color: var(--danger);
    font-size: 13px;
  }
  .now {
    width: 100%;
    margin-top: 8px;
  }

  @media (max-width: 639px) {
    .pill {
      height: 52px;
    }
    .readout {
      padding: 0 10px;
      gap: 8px;
    }
    .live {
      padding: 0 12px 0 10px;
    }
    .play,
    .readout,
    .live {
      height: 44px;
    }
    .play {
      width: 44px;
    }
  }
</style>
