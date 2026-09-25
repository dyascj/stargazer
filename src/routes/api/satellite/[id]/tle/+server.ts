import { json } from '@sveltejs/kit';
import { fetchTle } from '$lib/server/tle';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, params, setHeaders }) => {
  const tle = await fetchTle(fetch, params.id);
  setHeaders({ 'cache-control': 'public, max-age=3600, s-maxage=3600' });
  return json(tle);
};
