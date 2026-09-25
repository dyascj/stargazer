<script lang="ts">
  import { get } from 'svelte/store';
  import {
    displayTime,
    simRate,
    setSimTime,
    setSimRate,
    resyncSimTimeToNow,
    isLive,
    togglePause,
    reverseTime,
    MIN_SIM_TIME,
    MAX_SIM_TIME
  } from '$stores/simTime';
  import { timeExpanded } from '$stores/ui';
  const presets = [
    { value: 1, label: 'Real time' },
    { value: 60, label: '1 min / sec' },
    { value: 3600, label: '1 hour / sec' },
    { value: 86400, label: '1 day / sec' },
    { value: 2592000, label: '1 month / sec' },
    { value: 31536000, label: '1 year / sec' }
  ];
  let draft = $state('');
  let dateError = $state('');
  $effect(() => {
    if ($timeExpanded) draft = get(displayTime).toISOString().slice(0, 16);
  });
  function jump(event: SubmitEvent) {
    event.preventDefault();
    const date = new Date(draft + ':00Z');
    if (
      !Number.isFinite(date.getTime()) ||
      date.getTime() < MIN_SIM_TIME ||
      date.getTime() > MAX_SIM_TIME
    ) {
      dateError = 'Choose a date from 1800 through 2049.';
      return;
    }
    dateError = '';
    setSimTime(date);
    setSimRate(0);
    timeExpanded.set(false);
  }
</script>

<div class="time-control space-panel">
  {#if $timeExpanded}
    <form class="time-details" onsubmit={jump}>
      <div class="section-heading">
        <label for="simulation-date">Travel through time</label><button
          type="button"
          class="icon-button"
          aria-label="Close date controls"
          onclick={() => timeExpanded.set(false)}>×</button
        >
      </div>
      <p>Choose a date and time in UTC. Planet model: 1800–2050.</p>
      <div class="date-row">
        <input
          id="simulation-date"
          type="datetime-local"
          bind:value={draft}
          min="1800-01-01T00:00"
          max="2050-01-01T00:00"
          required
        /><button class="accent-button" type="submit">Go to date →</button>
      </div>
      {#if dateError}<p role="alert">{dateError}</p>{/if}
      <div class="time-steps">
        {#each [-30, -1, 1, 30] as days}<button
            type="button"
            onclick={() => {
              const date = new Date($displayTime.getTime() + days * 86400000);
              setSimTime(date);
              draft = get(displayTime).toISOString().slice(0, 16);
            }}
            >{days > 0 ? '+' : '−'}{Math.abs(days)} {Math.abs(days) === 1 ? 'day' : 'days'}</button
          >{/each}
      </div>
      <button class="reverse-expanded" type="button" onclick={reverseTime}
        >↶ Reverse direction</button
      >
      <p>
        Satellite predictions are available only near their orbital-data epoch. Dated spacecraft
        snapshots remain fixed.
      </p>
    </form>
  {/if}
  <div class="transport">
    <button
      class="icon-button play-button"
      type="button"
      onclick={togglePause}
      aria-label={$simRate === 0 ? 'Resume time' : 'Pause time'}
      title="Pause / play (Space)"
    >
      {#if $simRate === 0}<svg viewBox="0 0 16 16" aria-hidden="true"
          ><path d="M5 3 13 8 5 13Z" fill="currentColor" /></svg
        >{:else}<svg viewBox="0 0 16 16" aria-hidden="true"
          ><path d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="2.5" /></svg
        >{/if}
    </button>
    <button
      type="button"
      class="date-button"
      aria-expanded={$timeExpanded}
      onclick={() => timeExpanded.update((value) => !value)}
      title="Change simulation date"
    >
      <span class="clock-date"
        >{$displayTime.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        })}</span
      >
      <span class="clock-time">{$displayTime.toISOString().slice(11, 19)} <span>UTC</span></span>
    </button>
    <span class="transport-divider"></span>
    <button
      class="icon-button reverse-button"
      type="button"
      aria-label="Reverse time"
      aria-pressed={$simRate < 0}
      onclick={reverseTime}
      title="Reverse time">↶</button
    >
    <select
      aria-label="Simulation speed"
      value={Math.abs($simRate)}
      onchange={(event) => setSimRate(Number(event.currentTarget.value) * ($simRate < 0 ? -1 : 1))}
    >
      <option value={0} disabled>Paused</option>
      {#each presets as preset}<option value={preset.value}>{preset.label}</option>{/each}
    </select>
    <button
      class="now-button"
      class:live={$isLive}
      type="button"
      onclick={resyncSimTimeToNow}
      title="Return to the current time (N)"><span></span>{$isLive ? 'Now' : 'Back to now'}</button
    >
  </div>
</div>

<style>
  .reverse-expanded {
    display: none;
    min-height: 40px;
    font-size: 11px;
    color: var(--space-accent);
  }
  .time-control {
    width: max-content;
    max-width: calc(100vw - 24px);
  }
  .transport {
    display: flex;
    align-items: center;
    padding: 7px;
    gap: 6px;
  }
  .play-button {
    background: var(--space-action);
    color: #fff;
    border-radius: 0;
  }
  .play-button:hover {
    background: var(--space-accent);
    color: #fff;
  }
  .icon-button svg {
    width: 16px;
    height: 16px;
  }
  .date-button {
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    text-align: left;
    min-height: 44px;
    justify-content: center;
    gap: 3px;
  }
  .clock-date {
    font-size: 12px;
  }
  .clock-time {
    font:
      10px var(--font-mono),
      monospace;
    color: var(--space-muted);
  }
  .clock-time span {
    font-size: 8px;
    opacity: 0.7;
  }
  .transport-divider {
    height: 24px;
    width: 1px;
    background: var(--space-line);
  }
  select {
    color: var(--space-text);
    background: transparent;
    border: 0;
    font-size: 11px;
    min-height: 44px;
    max-width: 130px;
    padding: 0 4px;
    cursor: pointer;
    color-scheme: light;
  }
  .now-button {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    min-height: 44px;
    padding: 0 12px;
    color: var(--space-accent);
    white-space: nowrap;
  }
  .now-button span {
    height: 5px;
    width: 5px;
    border-radius: 50%;
    background: currentColor;
  }
  .now-button.live {
    color: var(--space-positive);
  }
  .time-details {
    padding: 18px;
    border-bottom: 1px solid var(--space-line);
    width: 490px;
    max-width: calc(100vw - 26px);
  }
  .time-details p {
    font-size: 11px;
    color: var(--space-muted);
    line-height: 1.7;
    margin: 10px 0;
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
  }
  .date-row {
    display: flex;
    gap: 8px;
  }
  input {
    min-width: 0;
    flex: 1;
    background: var(--space-inset);
    color: var(--space-text);
    border: 1px solid var(--space-line);
    padding: 10px;
    font:
      12px var(--font-mono),
      monospace;
    color-scheme: light;
    border-radius: 0;
  }
  .time-steps {
    display: flex;
    gap: 6px;
    margin-top: 12px;
  }
  .time-steps button {
    min-height: 40px;
    flex: 1;
    border: 1px solid var(--space-line);
    font-size: 11px;
    border-radius: 0;
  }
  @media (max-width: 560px) {
    .transport {
      gap: 0;
    }
    .date-button {
      padding: 0 9px;
    }
    .clock-date {
      font-size: 10px;
    }
    .clock-time {
      font-size: 9px;
    }
    .reverse-button {
      display: none;
    }
    .reverse-expanded {
      display: block;
    }
    select {
      width: 102px;
      font-size: 10px;
    }
    .now-button {
      padding: 0 8px;
      font-size: 10px;
    }
    .date-row {
      flex-direction: column;
    }
  }
</style>
