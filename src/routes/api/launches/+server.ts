import { error, json } from '@sveltejs/kit';
import { KEY, upcoming, type Schedule } from '$lib/launches';
import type { RequestHandler } from './$types';

// Launch Library throttles Cloudflare's shared egress IPs, so the stargazer-edge cron
// (workers/edge.js) keeps the schedule in KV. When this fails, browsers fetch it directly.
export const GET: RequestHandler = async ({ platform, setHeaders }) => {
  const schedule = await platform?.env.LAUNCHES?.get<Schedule>(KEY, 'json');
  if (!schedule || Date.now() - schedule.fetchedAt > 24 * 60 * 60_000)
    error(503, 'Launch schedule is temporarily unavailable.');

  setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=900' });
  return json({
    ...schedule,
    launches: upcoming(schedule.launches),
    source: 'The Space Devs · Launch Library 2',
    stale: Date.now() - schedule.fetchedAt > 15 * 60_000
  });
};
