import { get, readable, writable, type Readable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import * as satellite from 'satellite.js';
import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getSunElevationAt } from '$utils/solar';
import { parseTle, type TleData } from '$utils/tle';
import { simTime } from './simTime';
export type { TleData } from '$utils/tle';

export interface SatelliteState {
  catalogId: number;
  name: string;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh: number;
  visibility: 'daylight' | 'eclipsed' | 'unknown';
  footprintKm: number;
  timestamp: number;
  elementEpoch: number;
}
export interface SatelliteStore {
  data: Writable<SatelliteState | null>;
  status: Writable<'idle' | 'loading' | 'ready' | 'error'>;
  error: Writable<string | null>;
  at: (date: Date) => SatelliteState | null;
  start: () => void;
  stop: () => void;
}

/** Fetch only while a consumer is subscribed; tear down requests and timers together. */
export function createTleStore(catalogId: number): Readable<TleData | null> {
  return readable<TleData | null>(null, (set) => {
    if (!browser) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    async function refresh() {
      controller = new AbortController();
      try {
        const res = await fetch(`/api/satellite/${catalogId}/tle`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)])
        });
        if (!res.ok) throw new Error('Orbital data unavailable');
        const raw = await res.json();
        const tle = parseTle(`${raw.name}\n${raw.line1}\n${raw.line2}`, catalogId, raw.fetchedAt);
        if (!stopped) set(tle);
      } catch {
        // Keep the last valid element set; its epoch still limits propagation.
      } finally {
        if (!stopped) timer = setTimeout(refresh, 60 * 60 * 1000);
      }
    }
    void refresh();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
    };
  });
}

/** A visualization validity window, not a guarantee of orbital accuracy. */
export const TLE_MAX_AGE_DAYS = 7;
export function isTleUsable(satrec: satellite.SatRec, date: Date): boolean {
  const jd = date.getTime() / 86_400_000 + 2440587.5;
  return (
    Number.isFinite(jd) &&
    Number.isFinite(satrec.jdsatepoch) &&
    Math.abs(jd - satrec.jdsatepoch) <= TLE_MAX_AGE_DAYS
  );
}

export function createTleBackedStore({
  catalogId,
  name,
  tleStore
}: {
  catalogId: number;
  name: string;
  tleStore: Readable<TleData | null>;
}): SatelliteStore {
  const data = writable<SatelliteState | null>(null);
  const status = writable<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const error = writable<string | null>(null);
  let timer: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;
  let satrec: satellite.SatRec | null = null;
  let lastTime = NaN;
  let lastState: SatelliteState | null = null;

  function at(date: Date): SatelliteState | null {
    const time = date.getTime();
    if (time === lastTime) return lastState;
    lastTime = time;
    lastState = null;
    if (!satrec || !isTleUsable(satrec, date)) return null;
    try {
      const result = satellite.propagate(satrec, date);
      if (
        !result?.position ||
        !result.velocity ||
        typeof result.position === 'boolean' ||
        typeof result.velocity === 'boolean'
      )
        return null;
      const geo = satellite.eciToGeodetic(result.position, satellite.gstime(date));
      const latitude = satellite.degreesLat(geo.latitude);
      const longitude = satellite.degreesLong(geo.longitude);
      const altitudeKm = geo.height;
      const velocityKmh =
        Math.hypot(result.velocity.x, result.velocity.y, result.velocity.z) * 3600;
      if (![latitude, longitude, altitudeKm, velocityKmh].every(Number.isFinite) || altitudeKm < 0)
        return null;
      const horizon = Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm));
      lastState = {
        catalogId,
        name,
        latitude,
        longitude,
        altitudeKm,
        velocityKmh,
        visibility:
          getSunElevationAt(latitude, longitude, date) > (-horizon * 180) / Math.PI
            ? 'daylight'
            : 'eclipsed',
        footprintKm: 2 * EARTH_RADIUS_KM * horizon,
        timestamp: time / 1000,
        elementEpoch: (satrec.jdsatepoch - 2440587.5) * 86_400_000
      };
      return lastState;
    } catch {
      return null;
    }
  }
  function tick() {
    const state = at(get(simTime));
    data.set(state);
    status.set(state ? 'ready' : 'error');
    error.set(
      state
        ? null
        : satrec
          ? 'No reliable position at this date. Satellite elements are used only within 7 days of their epoch.'
          : 'Orbital data unavailable. Try again later.'
    );
  }
  function start() {
    if (!browser || timer) return;
    status.set('loading');
    unsubscribe = tleStore.subscribe((tle) => {
      lastTime = NaN;
      satrec = tle ? satellite.twoline2satrec(tle.line1, tle.line2) : null;
      if (tle) tick();
    });
    timer = setInterval(tick, 500);
  }
  function stop() {
    clearInterval(timer);
    timer = undefined;
    unsubscribe?.();
    unsubscribe = undefined;
    satrec = null;
    lastTime = NaN;
    lastState = null;
    data.set(null);
    status.set('idle');
  }
  return { data, status, error, at, start, stop };
}
