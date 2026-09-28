import { error, json } from '@sveltejs/kit';
import { KEY, fetchSchedule, type Schedule } from '$lib/server/launches';
import type { RequestHandler } from './$types';

export type { Launch } from '$lib/server/launches';

let cache: Schedule | null = null;
let pending: Promise<Schedule> | null = null;

/** Direct fetch for local runs and a cold KV; one request per isolate every 15 minutes. */
async function live(fetcher: typeof fetch) {
  if (!cache || Date.now() - cache.fetchedAt > 15 * 60_000) {
    pending ??= fetchSchedule(fetcher);
    try {
      cache = await pending;
    } catch {
      // Serve the last good schedule, if any.
    } finally {
      pending = null;
    }
  }
  return cache;
}

export const GET: RequestHandler = async ({ fetch, platform, setHeaders }) => {
  // Launch Library throttles Cloudflare's shared egress IPs, so in production the
  // stargazer-edge cron (workers/edge.js) keeps the schedule in KV instead.
  const schedule =
    (await platform?.env.LAUNCHES?.get<Schedule>(KEY, 'json')) ?? (await live(fetch));
  if (!schedule || Date.now() - schedule.fetchedAt > 24 * 60 * 60_000)
    error(503, 'Launch schedule is temporarily unavailable.');

  setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=900' });
  return json({
    ...schedule,
    launches: schedule.launches.filter((launch) => Date.parse(launch.date) >= Date.now()),
    source: 'The Space Devs · Launch Library 2',
    stale: Date.now() - schedule.fetchedAt > 15 * 60_000
  });
};
