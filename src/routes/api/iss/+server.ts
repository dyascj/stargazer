import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ISS_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

interface WheretheissResponse {
  name: string;
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  footprint: number;
  timestamp: number;
  daynum: number;
  solar_lat: number;
  solar_lon: number;
  units: string;
}

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  try {
    const res = await fetch(ISS_URL, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      throw error(502, `Upstream ISS API returned ${res.status}`);
    }
    const data = (await res.json()) as WheretheissResponse;

    if (
      ![data.latitude, data.longitude, data.altitude, data.velocity, data.timestamp].every(
        Number.isFinite
      ) ||
      Math.abs(data.latitude) > 90 ||
      Math.abs(data.longitude) > 180 ||
      data.altitude < 0
    )
      throw error(502, 'Invalid ISS telemetry');

    setHeaders({
      // Match the 1 Hz client polling — anything longer would deliver
      // stale positions to the marker.
      'cache-control': 'public, max-age=1, s-maxage=1'
    });

    return json({
      catalogId: 25544,
      name: 'ISS',
      latitude: data.latitude,
      longitude: data.longitude,
      altitudeKm: data.altitude,
      velocityKmh: data.velocity,
      visibility: data.visibility,
      // wheretheiss returns the surface arc DIAMETER, which we keep as-is
      // because it matches the canonical SatelliteState convention
      footprintKm: data.footprint,
      timestamp: data.timestamp
    });
  } catch (err) {
    if ((err as { status?: number }).status) throw err;
    throw error(502, 'ISS telemetry is unavailable');
  }
};
