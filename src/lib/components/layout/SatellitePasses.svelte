<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Readable } from 'svelte/store';
  import { computePasses, type PassEvent } from '$utils/passes';
  import type { TleData } from '$stores/satelliteFactory';
  let { tleStore }: { tleStore: Readable<TleData | null> } = $props();
  let status = $state('');
  let busy = $state(false);
  let passes = $state<PassEvent[]>([]);
  let ready = $state(false);
  let mounted = true;
  onDestroy(() => {
    mounted = false;
  });
  function findPasses() {
    if (!$tleStore) {
      status = 'Current orbital elements are unavailable. Try again shortly.';
      return;
    }
    if (!navigator.geolocation) {
      status = 'Location is unavailable in this browser.';
      return;
    }
    busy = true;
    status = '';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted) return;
        try {
          if (!$tleStore) throw new Error('Orbital elements are unavailable.');
          passes = computePasses($tleStore, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            height: (position.coords.altitude ?? 0) / 1000
          })
            .filter((pass) => pass.visible)
            .slice(0, 5);
          ready = true;
          status = passes.length
            ? ''
            : 'No visible passes above 10° in the next few days. Check back later.';
        } catch (error) {
          status = error instanceof Error ? error.message : 'Pass prediction is unavailable.';
        }
        busy = false;
      },
      (error) => {
        if (mounted) {
          status =
            error.code === 1
              ? 'Location permission was declined. You can try again.'
              : 'Your location could not be determined.';
          busy = false;
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }
  const day = (date: Date) =>
    date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = (date: Date) =>
    date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
</script>

<div class="passes">
  <p>See when it crosses your sky. Your location stays in this browser.</p>
  {#if passes.length}
    <ol>
      {#each passes as pass (pass.startUtc.getTime())}
        <li>
          <time datetime={pass.startUtc.toISOString()}>
            <strong>{day(pass.startUtc)}</strong>
            <span class="tabular">{time(pass.startUtc)}</span>
          </time>
          <span class="detail tabular"
            >{Math.round(pass.maxElevationDeg)}° high · {Math.max(
              1,
              Math.round(pass.durationSec / 60)
            )} min</span
          >
        </li>
      {/each}
    </ol>
  {/if}
  {#if status}<p class="status" aria-live="polite">{status}</p>{/if}
  <button class="btn" type="button" disabled={busy} onclick={findPasses}
    >{busy ? 'Finding passes' : ready ? 'Refresh' : 'Find passes near me'}</button
  >
  <p class="fine-print">
    Up to 5 days ahead in local time. Weather, terrain, and brightness affect what you see.
  </p>
</div>

<style>
  p {
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.6;
  }
  ol {
    display: grid;
    gap: 6px;
    margin-top: 12px;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    background: rgb(245 245 245 / 0.05);
    font-size: 13px;
  }
  time {
    display: flex;
    gap: 8px;
  }
  strong {
    font-weight: 500;
  }
  time span,
  .detail {
    color: var(--text-2);
  }
  .status {
    margin-top: 12px;
    color: var(--text-2);
    font-size: 13px;
  }
  .btn {
    margin-top: 12px;
    height: 36px;
    font-size: 13px;
  }
  .btn:disabled {
    opacity: 0.5;
  }
  .fine-print {
    margin-top: 10px;
    color: var(--text-3);
    font-size: 12px;
  }
</style>
