import { Vector3 } from 'three';
import { EARTH_RADIUS_KM } from '../scene-config';
import { isPlanetBody, type TrackedObject } from '../registry/types';

/** Gravitational parameters (km³/s²) of hosts whose orbiters lack a catalogued period (DE440). */
const GM: Record<string, number> = {
  sun: 1.32712440041e11,
  earth: 398600.435,
  mars: 42828.375,
  jupiter: 126712764.1
};

const _before = new Vector3();
const _after = new Vector3();
const STEP_MS = 10_000;

/**
 * Osculating orbital period in ms from the vis-viva equation, or null for
 * static snapshots, unbound trajectories, and bodies without a known host GM.
 */
export function orbitalPeriodMs(body: TrackedObject, date: Date): number | null {
  if (isPlanetBody(body) && body.metadata.orbitalPeriodDays)
    return body.metadata.orbitalPeriodDays * 86_400_000;
  const gm = body.parent ? GM[body.parent] : undefined;
  const time = date.getTime();
  if (
    !gm ||
    !body.offsetFn(new Date(time - STEP_MS), _before) ||
    !body.offsetFn(new Date(time + STEP_MS), _after)
  )
    return null;
  const speed = (_after.distanceTo(_before) * EARTH_RADIUS_KM) / ((2 * STEP_MS) / 1000);
  const radius = _before.add(_after).multiplyScalar(0.5).length() * EARTH_RADIUS_KM;
  if (speed < 1e-6) return null;
  const inverseA = 2 / radius - (speed * speed) / gm;
  if (inverseA <= 0) return null;
  return 2 * Math.PI * Math.sqrt(1 / (inverseA * inverseA * inverseA * gm)) * 1000;
}

/**
 * Time offset (ms before `now`) of orbit sample `index` of `count`. Samples are
 * denser next to the body, where the camera usually is, so the polyline stays
 * visually on the true curve at close range.
 */
export function orbitSampleOffsetMs(index: number, count: number, periodMs: number): number {
  const s = index / (count - 1);
  return periodMs * (s - (0.9 * Math.sin(2 * Math.PI * s)) / (2 * Math.PI));
}
