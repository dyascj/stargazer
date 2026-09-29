import { error, json } from '@sveltejs/kit';
import { getTles, parseIds } from '$lib/server/tle';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, platform, setHeaders, url }) => {
  const ids = parseIds(url.searchParams.get('ids'));
  if (!ids) error(400, 'Invalid catalog ids');
  setHeaders({ 'cache-control': 'public, max-age=900' });
  return json(await getTles(fetch, ids, platform?.env.FEEDS));
};
