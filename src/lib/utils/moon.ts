import { Vector3 } from 'three';
import { KM_TO_SCENE } from '../scene-config';

/**
 * Lunar state at a single instant from the largest periodic terms of Meeus,
 * Astronomical Algorithms ch. 47. Typical errors are a few tenths of a degree
 * and a few hundred km: an educational model, not an eclipse ephemeris.
 */
export interface LunarState {
  /** Geographic latitude of the sublunar point on Earth */
  lat: number;
  /** Geographic longitude of the sublunar point on Earth */
  lon: number;
  /** Geocentric ecliptic longitude, J2000 frame (degrees), used for scene placement */
  eclipticLon: number;
  /** Geocentric ecliptic latitude (degrees), typically within ±5.3° */
  eclipticLat: number;
  /** Earth–Moon center-to-center distance (km) */
  distanceKm: number;
  /** Synodic angle [0..360°): 0=new, 90=first quarter, 180=full, 270=last quarter */
  synodicAngle: number;
  /** Illuminated fraction of visible disc [0..1] */
  illumination: number;
  /** Phase-derived age estimate (0..29.53 days), not an event-time calculation */
  ageDays: number;
  phaseName: string;
  /** True while waxing (new → full) */
  waxing: boolean;
}

const DEG = Math.PI / 180;
const J2000_MS = Date.UTC(2000, 0, 1, 12);

// [D, M, M', F multipliers, coefficient] from Meeus tables 47.A and 47.B.
const LONGITUDE_TERMS = [
  [0, 0, 1, 0, 6.288774],
  [2, 0, -1, 0, 1.274027],
  [2, 0, 0, 0, 0.658314],
  [0, 0, 2, 0, 0.213618],
  [0, 1, 0, 0, -0.185116],
  [0, 0, 0, 2, -0.114332],
  [2, 0, -2, 0, 0.058793],
  [2, -1, -1, 0, 0.057066],
  [2, 0, 1, 0, 0.053322],
  [2, -1, 0, 0, 0.045758],
  [0, 1, -1, 0, -0.040923],
  [1, 0, 0, 0, -0.03472],
  [0, 1, 1, 0, -0.030383]
];
const DISTANCE_TERMS = [
  [0, 0, 1, 0, -20905.355],
  [2, 0, -1, 0, -3699.111],
  [2, 0, 0, 0, -2955.968],
  [0, 0, 2, 0, -569.925],
  [0, 1, 0, 0, 48.888],
  [2, 0, -2, 0, 246.158],
  [2, -1, -1, 0, -152.138],
  [2, 0, 1, 0, -170.733],
  [2, -1, 0, 0, -204.586],
  [0, 1, -1, 0, -129.62],
  [1, 0, 0, 0, 108.743],
  [0, 1, 1, 0, 104.755]
];
const LATITUDE_TERMS = [
  [0, 0, 0, 1, 5.128122],
  [0, 0, 1, 1, 0.280602],
  [0, 0, 1, -1, 0.277693],
  [2, 0, 0, -1, 0.173237],
  [2, 0, -1, 1, 0.055413],
  [2, 0, -1, -1, 0.046271],
  [2, 0, 0, 1, 0.032573],
  [0, 0, 2, 1, 0.017198]
];

const ecliptic = { lambdaOfDate: 0, lambdaJ2000: 0, beta: 0, distanceKm: 0, sunLambda: 0 };
const angles = [0, 0, 0, 0];

function argument(term: number[]): number {
  return term[0] * angles[0] + term[1] * angles[1] + term[2] * angles[2] + term[3] * angles[3];
}

/** Writes the Moon's geocentric ecliptic coordinates into the shared `ecliptic` scratch. */
function computeEcliptic(time: number): void {
  const T = (time - J2000_MS) / (86_400_000 * 36_525);
  const L = 218.3164477 + 481267.88123421 * T;
  const M = (357.5291092 + 35999.0502909 * T) * DEG;
  angles[0] = (297.8501921 + 445267.1114034 * T) * DEG;
  angles[1] = M;
  angles[2] = (134.9633964 + 477198.8675055 * T) * DEG;
  angles[3] = (93.272095 + 483202.0175233 * T) * DEG;
  let lambda = L;
  for (const term of LONGITUDE_TERMS) lambda += term[4] * Math.sin(argument(term));
  let beta = 0;
  for (const term of LATITUDE_TERMS) beta += term[4] * Math.sin(argument(term));
  let distance = 385000.56;
  for (const term of DISTANCE_TERMS) distance += term[4] * Math.cos(argument(term));
  ecliptic.lambdaOfDate = mod(lambda, 360);
  // The series uses the mean equinox of date; the scene frame is J2000.
  ecliptic.lambdaJ2000 = mod(lambda - 1.3969713 * T, 360);
  ecliptic.beta = beta;
  ecliptic.distanceKm = distance;
  const sunMean = mod(280.46646 + 36000.76983 * T, 360);
  ecliptic.sunLambda = sunMean + 1.914602 * Math.sin(M) + 0.019993 * Math.sin(2 * M);
}

export function getLunarState(date: Date = new Date()): LunarState {
  computeEcliptic(date.getTime());
  const { lambdaOfDate: moonLambda, beta: moonBeta, distanceKm, sunLambda } = ecliptic;
  const d = (date.getTime() - J2000_MS) / 86400000;

  // Synodic position: moon's eastward angular distance from sun
  const synodicAngle = mod(moonLambda - sunLambda, 360);

  // Illuminated fraction from the Sun–Moon elongation seen from Earth.
  const elongation = synodicAngle > 180 ? 360 - synodicAngle : synodicAngle;
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;

  const ageDays = (synodicAngle / 360) * 29.530589;
  const waxing = synodicAngle < 180;

  let phaseName: string;
  if (synodicAngle < 1.5 || synodicAngle > 358.5) phaseName = 'New Moon';
  else if (synodicAngle < 88.5) phaseName = 'Waxing Crescent';
  else if (synodicAngle < 91.5) phaseName = 'First Quarter';
  else if (synodicAngle < 178.5) phaseName = 'Waxing Gibbous';
  else if (synodicAngle < 181.5) phaseName = 'Full Moon';
  else if (synodicAngle < 268.5) phaseName = 'Waning Gibbous';
  else if (synodicAngle < 271.5) phaseName = 'Last Quarter';
  else phaseName = 'Waning Crescent';

  // Convert moon's ecliptic coordinates to equatorial RA/Dec
  const moonLambdaRad = moonLambda * DEG;
  const moonBetaRad = moonBeta * DEG;
  const epsilon = 23.439 * DEG;
  const ra = Math.atan2(
    Math.sin(moonLambdaRad) * Math.cos(epsilon) - Math.tan(moonBetaRad) * Math.sin(epsilon),
    Math.cos(moonLambdaRad)
  );
  const dec = Math.asin(
    Math.sin(moonBetaRad) * Math.cos(epsilon) +
      Math.cos(moonBetaRad) * Math.sin(epsilon) * Math.sin(moonLambdaRad)
  );

  // Convert inertial RA to Earth-fixed geographic longitude using GMST
  // (matches the convention used by the solar helper)
  const gmstHours = mod(18.697374558 + 24.06570982441908 * d, 24);
  const gmstRad = gmstHours * 15 * DEG;
  const lonRad = Math.atan2(Math.sin(ra - gmstRad), Math.cos(ra - gmstRad));

  return {
    lat: dec / DEG,
    lon: lonRad / DEG,
    eclipticLon: ecliptic.lambdaJ2000,
    eclipticLat: moonBeta,
    distanceKm,
    synodicAngle,
    illumination,
    ageDays,
    phaseName,
    waxing
  };
}

/** Moon's true offset from Earth's center in scene units (J2000 ecliptic frame). */
export function getMoonInertialOffset(target: Vector3, date: Date = new Date()): Vector3 {
  computeEcliptic(date.getTime());
  const lambda = ecliptic.lambdaJ2000 * DEG;
  const beta = ecliptic.beta * DEG;
  const r = ecliptic.distanceKm * KM_TO_SCENE;
  // Ecliptic (x, y, z) maps to scene (x, z, -y), as in helio.ts.
  return target.set(
    r * Math.cos(beta) * Math.cos(lambda),
    r * Math.sin(beta),
    -r * Math.cos(beta) * Math.sin(lambda)
  );
}

function mod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}
