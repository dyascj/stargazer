import { error } from '@sveltejs/kit';
import { fetchNasa } from '$lib/server/nasa';
import type { RequestHandler } from './$types';

/**
 * Generic NASA API proxy. Any request to /api/nasa/<path> is forwarded to
 * https://api.nasa.gov/<path> with our server-side API key injected.
 *
 * Example: GET /api/nasa/planetary/apod -> APOD endpoint
 */
export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
  const path = params.path ?? '';
  if (!path) error(400, 'Missing NASA endpoint path');

  const upstream = await fetchNasa(path, new URLSearchParams(url.search));
  if (!upstream.ok) {
    error(upstream.status, `NASA upstream error: ${upstream.statusText}`);
  }

  setHeaders({
    'content-type': upstream.headers.get('content-type') ?? 'application/json',
    // Cache for a minute at the edge for non-personalized data
    'cache-control': 'public, max-age=60, s-maxage=60'
  });

  return new Response(upstream.body, { status: 200 });
};
