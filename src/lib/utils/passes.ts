import * as satellite from 'satellite.js';
import { getSunElevationAt } from './solar';
import { EARTH_RADIUS_KM } from '../scene-config';

interface Observer {
  /** Geographic latitude in degrees, +N */
  latitude: number;
  /** Geographic longitude in degrees, +E */
  longitude: number;
  /** Height above sea level in km (default 0) */
  height?: number;
}

export interface PassEvent {
  /** Time the satellite rises above the minimum elevation */
  startUtc: Date;
  /** Time the satellite sets back below the minimum elevation */
  endUtc: Date;
  /** Pass duration in seconds */
  durationSec: number;
  /** Maximum elevation angle reached during the pass (degrees) */
  maxElevationDeg: number;
  /** UTC time of the maximum-elevation moment */
  maxElevationTime: Date;
  /**
   * True if this pass would be visually observable: ISS sunlit *and*
   * observer in civil twilight or darker. Daytime passes are still
   * returned but with `visible = false`.
   */
  visible: boolean;
}

const DEG = Math.PI / 180;

/**
 * Compute upcoming passes of a satellite over an observer's location.
 * Uses SGP4 propagation with 20-second time sampling; approximate rise/set and peak times.
 * Defaults: 5 days ahead, 20-second steps, 10° minimum elevation.
 */
export function computePasses(
  tle: { line1: string; line2: string },
  observer: Observer,
  options: { daysAhead?: number; minElevationDeg?: number; stepSeconds?: number; start?: Date } = {}
): PassEvent[] {
  const daysAhead = options.daysAhead ?? 5;
  const minElevationDeg = options.minElevationDeg ?? 10;
  const stepSeconds = options.stepSeconds ?? 20;

  if (
    ![
      observer.latitude,
      observer.longitude,
      observer.height ?? 0,
      daysAhead,
      minElevationDeg,
      stepSeconds
    ].every(Number.isFinite) ||
    Math.abs(observer.latitude) > 90 ||
    Math.abs(observer.longitude) > 180 ||
    daysAhead <= 0 ||
    daysAhead > 7 ||
    stepSeconds < 5 ||
    stepSeconds > 60 ||
    minElevationDeg < 0 ||
    minElevationDeg >= 90
  )
    throw new RangeError('Invalid pass prediction parameters');
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const observerGd = {
    latitude: observer.latitude * DEG,
    longitude: observer.longitude * DEG,
    height: observer.height ?? 0
  };

  const start = options.start ?? new Date();
  const epoch = (satrec.jdsatepoch - 2440587.5) * 86400000;
  if (!Number.isFinite(start.getTime()) || Math.abs(start.getTime() - epoch) > 7 * 86400000)
    throw new Error('Current orbital elements are needed to predict passes.');
  const end = new Date(Math.min(start.getTime() + daysAhead * 86400000, epoch + 7 * 86400000));
  const stepMs = stepSeconds * 1000;

  const passes: PassEvent[] = [];
  let currentStart: Date | null = null;
  let currentMaxEl = 0;
  let currentMaxElTime: Date | null = null;
  let currentVisible = false;

  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    const date = new Date(t);
    const result = satellite.propagate(satrec, date);
    if (!result?.position || typeof result.position === 'boolean') continue;

    const gmst = satellite.gstime(date);
    const positionEci = result.position as satellite.EciVec3<satellite.Kilometer>;
    const positionEcf = satellite.eciToEcf(positionEci, gmst);
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
    const elDeg = (lookAngles.elevation * 180) / Math.PI;

    if (elDeg >= minElevationDeg) {
      if (!currentStart) {
        currentStart = date;
        currentMaxEl = elDeg;
        currentMaxElTime = date;
      } else if (elDeg > currentMaxEl) {
        currentMaxEl = elDeg;
        currentMaxElTime = date;
      }
      // Visible when, at any step above the mask, the observer is in civil twilight or darker
      // (Sun below -6°) while the satellite is still sunlit: the Sun is above -dip at its
      // sub-point, where dip = arccos(R/(R+h)) is the horizon depression at its altitude.
      if (!currentVisible && getSunElevationAt(observer.latitude, observer.longitude, date) < -6) {
        const geo = satellite.eciToGeodetic(positionEci, gmst);
        const dipDeg =
          Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + geo.height)) * (180 / Math.PI);
        currentVisible = getSunElevationAt(geo.latitude / DEG, geo.longitude / DEG, date) > -dipDeg;
      }
    } else if (currentStart) {
      passes.push({
        startUtc: currentStart,
        endUtc: date,
        durationSec: (date.getTime() - currentStart.getTime()) / 1000,
        maxElevationDeg: currentMaxEl,
        maxElevationTime: currentMaxElTime!,
        visible: currentVisible
      });
      currentStart = null;
      currentMaxEl = 0;
      currentMaxElTime = null;
      currentVisible = false;
    }
  }

  return passes;
}
