// No SvelteKit imports or aliases: the stargazer-edge worker bundles this too.
import type { KVNamespace } from '@cloudflare/workers-types';
import { parseTle, type TleData } from '../utils/tle';

type Store = Record<string, TleData>;

const KEY = 'tle';
/** The cron refreshes every stored satellite in one run; the free plan allows 50 subrequests. */
const KEEP = 40;
/** A satellite CelesTrak did not answer for is not asked about again from this isolate for a while. */
const RETRY = 10 * 60_000;

/** Up to 32 distinct catalog numbers from `?ids=25544,48274`, or null when invalid. */
export function parseIds(param: string | null): number[] | null {
  const ids = [...new Set((param ?? '').split(',').map(Number))];
  const valid =
    ids.length > 0 &&
    ids.length <= 32 &&
    ids.every((id) => Number.isInteger(id) && id >= 1 && id <= 99_999);
  return valid ? ids : null;
}

// Without KV (local runs and tests) the store lives in this isolate.
const memory: Store = {};
const failedAt = new Map<number, number>();
// One CelesTrak request per catalog number at a time.
const inflight = new Map<number, Promise<TleData | null>>();

function fetchOne(fetcher: typeof fetch, id: number, timeout: number): Promise<TleData | null> {
  let request = inflight.get(id);
  if (!request) {
    request = fetcher(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`, {
      signal: AbortSignal.timeout(timeout)
    })
      .then(async (response) => (response.ok ? parseTle(await response.text(), id) : null))
      .catch(() => null)
      .then((tle) => {
        if (!tle) failedAt.set(id, Date.now());
        return tle;
      })
      .finally(() => inflight.delete(id));
    inflight.set(id, request);
  }
  return request;
}

/**
 * Fetches `ids` and adds whatever arrived to the store, returning the new store, or null when
 * nothing arrived. Failures never overwrite a copy.
 */
async function update(fetcher: typeof fetch, ids: number[], timeout: number, kv?: KVNamespace) {
  const results = await Promise.all(ids.map((id) => fetchOne(fetcher, id, timeout)));
  const fetched = results.filter((tle) => tle !== null);
  if (!fetched.length) return null;
  // Re-read just before writing so a slow fetch loses as little as possible to a concurrent write.
  const store: Store = kv ? ((await kv.get<Store>(KEY, 'json')) ?? {}) : memory;
  for (const tle of fetched) store[Number(tle.line1.slice(2, 7))] = tle;
  const kept: Store = Object.fromEntries(
    Object.entries(store)
      .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
      .slice(0, KEEP)
  );
  if (kv) await kv.put(KEY, JSON.stringify(kept));
  else Object.assign(memory, kept);
  return kept;
}

/**
 * Element sets for `ids` from the shared store. Only a satellite the store has never held is
 * fetched here, so visitors wait for CelesTrak about once per satellite. Keeping copies fresh
 * is the stargazer-edge cron's job. Satellites without a copy are omitted.
 */
export async function getTles(
  fetcher: typeof fetch,
  ids: number[],
  kv?: KVNamespace
): Promise<Store> {
  let store: Store = kv ? ((await kv.get<Store>(KEY, 'json')) ?? {}) : memory;
  const missing = ids.filter((id) => !store[id] && !(Date.now() - (failedAt.get(id) ?? 0) < RETRY));
  if (missing.length) store = (await update(fetcher, missing, 5_000, kv)) ?? store;
  return Object.fromEntries(ids.filter((id) => store[id]).map((id) => [id, store[id]]));
}

/** The cron's refresh of every stored satellite. Throws when CelesTrak answered for none. */
export async function refreshTles(fetcher: typeof fetch, kv: KVNamespace) {
  const ids = Object.keys((await kv.get<Store>(KEY, 'json')) ?? {}).map(Number);
  if (ids.length && !(await update(fetcher, ids, 10_000, kv)))
    throw new Error('CelesTrak unavailable');
}
