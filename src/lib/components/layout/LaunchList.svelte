<script lang="ts" module>
  import { loadSchedule } from '$lib/launches';
  // One schedule per session.
  let request: ReturnType<typeof loadSchedule> | null = null;
  function schedule() {
    request ??= loadSchedule().catch((error) => {
      request = null; // Let the next visit retry.
      throw error;
    });
    return request;
  }
</script>

<script lang="ts">
  import type { Launch } from '$lib/launches';
  import { activeLaunch, showLaunch } from '$stores/ui';
  import Icon from '$components/ui/Icon.svelte';
  import { setMorphOrigin } from '$components/ui/morph';

  /** Called after a launch is chosen, so the dialog around the list can close. */
  let { onselect }: { onselect?: () => void } = $props();
  const current = schedule();
  function choose(launch: Launch, event: MouseEvent) {
    setMorphOrigin(event.currentTarget as Element);
    showLaunch(launch);
    onselect?.();
  }
  const day = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const time = (date: string) => new Date(date).toISOString().slice(11, 16);
</script>

{#await current}
  <p class="state" role="status">Checking the launch schedule</p>
{:then { launches, stale, fetchedAt }}
  {#if launches.length}
    <ol class="launches">
      {#each launches as launch, index (launch.id)}
        <li class="rise" style:--i={index}>
          <button
            type="button"
            aria-current={$activeLaunch?.id === launch.id ? 'true' : undefined}
            onclick={(event) => choose(launch, event)}
          >
            <div class="when tabular">
              <time datetime={launch.date}>{day(launch.date)}</time>
              <span>{time(launch.date)} UTC</span>
            </div>
            <div class="what">
              <strong>{launch.name}</strong>
              <span>{launch.provider} · {launch.pad}</span>
            </div>
            <span class="status" class:go={launch.status.toLowerCase().startsWith('go')}
              >{launch.status}</span
            >
          </button>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="state">No upcoming launches are listed right now.</p>
  {/if}
  <p class="note">
    {stale
      ? `Cached schedule from ${new Date(fetchedAt).toUTCString().slice(5, 22)} UTC.`
      : 'Schedules change often.'}
    <a href="https://thespacedevs.com/llapi" target="_blank" rel="noreferrer"
      >Launch Library 2 <Icon name="external" size={12} /></a
    >
  </p>
{:catch}
  <div class="state">
    <p>The launch schedule is unavailable right now.</p>
    <a href="https://thespacedevs.com/llapi" target="_blank" rel="noreferrer"
      >Visit the data provider <Icon name="external" size={12} /></a
    >
  </div>
{/await}

<style>
  .launches {
    display: grid;
    gap: 2px;
    padding: 0 8px;
  }
  li button {
    display: grid;
    grid-template-columns: 64px 1fr auto;
    gap: 14px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    text-align: left;
    transition: background-color var(--dur-fast) ease;
  }
  li button:hover,
  li button[aria-current] {
    background: rgb(245 245 245 / 0.07);
  }
  .when {
    display: grid;
    gap: 2px;
  }
  time,
  strong {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-1);
  }
  .when span,
  .what span {
    font-size: 12px;
    color: var(--text-3);
  }
  .what {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .what > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .status {
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    background: rgb(245 245 245 / 0.06);
    color: var(--text-2);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }
  .status.go {
    background: color-mix(in oklab, var(--success), transparent 86%);
    color: var(--success);
  }
  .state {
    padding: 32px 20px;
    color: var(--text-2);
    font-size: 14px;
    text-align: center;
  }
  .note {
    padding: 12px 20px 4px;
    color: var(--text-3);
    font-size: 12px;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-2);
    font-size: 12px;
  }
  .state a {
    margin-top: 8px;
  }
  a:hover {
    color: var(--text-1);
  }
</style>
