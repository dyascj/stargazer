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
    status = 'Waiting for your location…';
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
            ? 'Times in your local timezone.'
            : 'No potentially visible passes above 10° in the prediction window.';
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
</script>

<section class="passes">
  <h3>Passes near you</h3>
  <p>
    Find potentially visible passes over your location, starting now. Location stays in your
    browser.
  </p>
  <button class="nav-chip" type="button" disabled={busy} onclick={findPasses}
    >{busy ? 'Finding passes…' : ready ? 'Refresh passes ↗' : 'Find passes near me ↗'}</button
  >
  <p aria-live="polite">{status}</p>
  {#if passes.length}<ul>
      {#each passes as pass}<li>
          <time datetime={pass.startUtc.toISOString()}
            >{pass.startUtc.toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}</time
          ><span
            >{Math.round(pass.maxElevationDeg)}° peak · ~{Math.round(pass.durationSec / 60)} min</span
          >
        </li>{/each}
    </ul>{/if}
  <p class="fine-print">
    Approximate 20-second sampling, up to 5 days ahead, limited by element age. Sunlight and
    twilight are estimates; weather, terrain, and brightness affect visibility.
  </p>
</section>

<style>
  .passes {
    padding: 20px 0 0;
    border-top: 1px solid var(--space-line);
  }
  p {
    font-size: 11px;
    line-height: 1.7;
    color: var(--space-muted);
    margin: 12px 0;
  }
  button {
    width: 100%;
    justify-content: center;
  }
  button:disabled {
    opacity: 0.5;
  }
  li {
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-bottom: 1px solid var(--space-line);
    font-size: 11px;
  }
  li span {
    color: var(--space-muted);
    font-size: 10px;
  }
  .fine-print {
    font-size: 9px;
  }
</style>
