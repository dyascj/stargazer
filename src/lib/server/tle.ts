import { error } from '@sveltejs/kit';
import { parseTle, type TleData } from '$utils/tle';

// Share one request per catalog across concurrent viewers and honor provider update cadence.
const cache = new Map<string, { expires: number; result: Promise<TleData> }>();
export async function fetchTle(fetcher: typeof fetch, catalogId: string): Promise<TleData> {
  if (!/^\d{1,5}$/.test(catalogId) || Number(catalogId) < 1) error(400, 'Invalid catalog id');
  const key = String(Number(catalogId));
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const result = (async () => {
    try {
      const response = await fetcher(
        `https://celestrak.org/NORAD/elements/gp.php?CATNR=${key}&FORMAT=TLE`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!response.ok) throw new Error('Provider unavailable');
      return parseTle(await response.text(), Number(key));
    } catch {
      const entry = cache.get(key);
      if (entry) entry.expires = Date.now() + 60_000;
      error(502, 'Valid orbital elements are unavailable. Please try again later.');
    }
  })();
  // Bound memory for public catalog requests; failed requests are briefly cached too.
  if (cache.size >= 128 && !cache.has(key)) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 60 * 60_000, result });
  return result;
}
