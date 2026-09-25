import * as satellite from 'satellite.js';
import { latLonAltToVec3 } from './coords';
import { EARTH_RADIUS, EARTH_RADIUS_KM } from '../scene-config';

export interface IssOrbitOptions {
  start?: Date;
  /** Earth-fixed frame in which the entire inertial orbit is drawn. */
  frameDate?: Date;
  /** Defaults to one period derived from the TLE's mean motion. */
  durationMinutes?: number;
  samples?: number;
}

/** An inertial orbital arc expressed in the Earth mesh's current rotating frame. */
export function computeIssOrbit(
  tle: { line1: string; line2: string },
  options: IssOrbitOptions = {}
): Float32Array {
  const start = options.start ?? new Date();
  const frameDate = options.frameDate ?? start;
  const samples = options.samples ?? 240;
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const duration = options.durationMinutes ?? (2 * Math.PI) / satrec.no;
  const epoch = (satrec.jdsatepoch - 2440587.5) * 86400000;
  if (
    !Number.isInteger(samples) ||
    samples < 2 ||
    samples > 2000 ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    throw new RangeError('Invalid orbit sampling parameters');
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(frameDate.getTime()) ||
    Math.abs(start.getTime() - epoch) > 7 * 86400000
  )
    return new Float32Array();
  const positions = new Float32Array(samples * 3);
  const gmst = satellite.gstime(frameDate);
  for (let i = 0; i < samples; i++) {
    const date = new Date(start.getTime() + (i * duration * 60000) / (samples - 1));
    if (Math.abs(date.getTime() - epoch) > 7 * 86400000) return new Float32Array();
    const result = satellite.propagate(satrec, date);
    if (!result?.position) return new Float32Array();
    const geo = satellite.eciToGeodetic(result.position, gmst);
    if (![geo.latitude, geo.longitude, geo.height].every(Number.isFinite) || geo.height < 0)
      return new Float32Array();
    positions.set(
      latLonAltToVec3(
        satellite.degreesLat(geo.latitude),
        satellite.degreesLong(geo.longitude),
        geo.height,
        EARTH_RADIUS,
        EARTH_RADIUS_KM
      ),
      i * 3
    );
  }
  return positions;
}
