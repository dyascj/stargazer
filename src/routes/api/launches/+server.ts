import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface Launch {
  id: string;
  name: string;
  date: string;
  status: string;
  provider: string;
  pad: string;
}
type Schedule = { fetchedAt: number; launches: Launch[] };
let cache: Schedule | null = null;
let pending: Promise<Schedule> | null = null;

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  if (!cache || Date.now() - cache.fetchedAt > 15 * 60_000) {
    pending ??= (async () => {
      const response = await fetch(
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
            status?: { name?: string };
            launch_service_provider?: { name?: string };
            pad?: { name?: string };
          }) => ({
            id: item.id,
            name: item.name,
            date: item.net,
            status: item.status?.name ?? 'Schedule provisional',
            provider: item.launch_service_provider?.name ?? 'Unknown provider',
            pad: item.pad?.name ?? 'Launch site to be confirmed'
          })
        );
      return { fetchedAt: Date.now(), launches };
    })();
    try {
      cache = await pending;
    } catch {
      if (!cache || Date.now() - cache.fetchedAt > 24 * 60 * 60_000)
        error(503, 'Launch schedule is temporarily unavailable.');
    } finally {
      pending = null;
    }
  }
  setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=900' });
  return json({
    ...cache,
    launches: cache!.launches.filter((launch) => Date.parse(launch.date) >= Date.now()),
    source: 'The Space Devs · Launch Library 2',
    stale: Date.now() - cache!.fetchedAt > 15 * 60_000
  });
};
