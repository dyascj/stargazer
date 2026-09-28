// Shared by the browser, /api/launches and the stargazer-edge worker, so no SvelteKit imports.

export interface Launch {
  id: string;
  name: string;
  date: string;
  status: string;
  provider: string;
  pad: string;
}
export type Schedule = { fetchedAt: number; launches: Launch[] };
/** KV key the stargazer-edge cron writes and /api/launches reads. */
export const KEY = 'schedule';

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

/** Launch Library's upcoming launches, normalized. Callers filter with `upcoming` when serving. */
export async function fetchSchedule(fetcher: typeof fetch = fetch): Promise<Schedule> {
  const response = await fetcher(
    'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=8&mode=normal',
    { signal: AbortSignal.timeout(10_000) }
  );
  if (!response.ok) throw new Error('Launch provider unavailable');
  const body = await response.json();
  if (!Array.isArray(body.results)) throw new Error('Invalid launch response');
  const launches: Launch[] = body.results
    .filter(
      (item: { id?: unknown; name?: unknown; net?: unknown }) =>
        item != null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.net === 'string' &&
        Number.isFinite(Date.parse(item.net))
    )
    .map(
      (item: {
        id: string;
        name: string;
        net: string;
        status?: { name?: unknown };
        launch_service_provider?: { name?: unknown };
        pad?: { name?: unknown };
      }) => ({
        id: item.id,
        name: item.name,
        date: item.net,
        status: text(item.status?.name, 'Schedule provisional'),
        provider: text(item.launch_service_provider?.name, 'Unknown provider'),
        pad: text(item.pad?.name, 'Launch site to be confirmed')
      })
    );
  return { fetchedAt: Date.now(), launches };
}

export const upcoming = (launches: Launch[]) =>
  launches.filter((launch) => Date.parse(launch.date) >= Date.now());

/**
 * The site's copy of the schedule, or Launch Library directly when that copy is missing
 * or stale. The edge cron is often throttled; a visitor's own IP has its own allowance.
 */
export async function loadSchedule(): Promise<Schedule & { stale: boolean }> {
  const cached: (Schedule & { stale: boolean }) | null = await fetch('/api/launches')
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  if (cached && !cached.stale) return cached;
  try {
    const live = await fetchSchedule();
    return { ...live, launches: upcoming(live.launches), stale: false };
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}
