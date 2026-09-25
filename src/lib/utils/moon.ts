import { Vector3 } from 'three';
import { EARTH_RADIUS_KM, MOON_DISTANCE_SCALE } from '../scene-config';

/**
 * Lunar state at a single instant. Uses low-precision Meeus formulas —
 * A truncated educational model, not a precision ephemeris. Omitted lunar
 * perturbations can produce degree-scale position errors.
 */
export interface LunarState {
  /** Geographic latitude of the sublunar point on Earth */
  lat: number;
  /** Geographic longitude of the sublunar point on Earth */
  lon: number;
  /** Geocentric ecliptic longitude (degrees) — used for scene placement */
  eclipticLon: number;
  /** Geocentric ecliptic latitude (degrees) — typically ±5° */
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

export function getLunarState(date: Date = new Date()): LunarState {
  // Days since J2000.0 (2000-01-01 12:00 UTC)
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;

  // Sun's apparent ecliptic longitude (degrees)
  const sunL = mod(280.46 + 0.9856474 * d, 360);
  const sunM = mod(357.528 + 0.9856003 * d, 360) * DEG;
  const sunLambda = sunL + 1.915 * Math.sin(sunM) + 0.02 * Math.sin(2 * sunM);

  // Moon's mean elements (degrees)
  const Lp = mod(218.316 + 13.176396 * d, 360); // Mean ecliptic longitude
  const Mp = mod(134.963 + 13.064993 * d, 360); // Mean anomaly
  const F = mod(93.272 + 13.22935 * d, 360); // Argument of latitude
  const MpRad = Mp * DEG;
  const FRad = F * DEG;

  // Geocentric ecliptic longitude / latitude (degrees)
  const moonLambda = Lp + 6.289 * Math.sin(MpRad);
  const moonBeta = 5.128 * Math.sin(FRad);
  const distanceKm = 385001 - 20905 * Math.cos(MpRad);

  // Synodic position: moon's eastward angular distance from sun
  const synodicAngle = mod(moonLambda - sunLambda, 360);

  // Phase angle (Sun–Moon–Earth) corresponds to |180° - synodicAngle|.
  // Illuminated fraction = (1 + cos(phaseAngle)) / 2 = (1 - cos(elongation)) / 2,
  // where elongation = the angular sun-moon separation as seen from Earth.
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
    eclipticLon: moonLambda,
    eclipticLat: moonBeta,
    distanceKm,
    synodicAngle,
    illumination,
    ageDays,
    phaseName,
    waxing
  };
}

/**
 * Moon's offset from Earth in scene units (ecliptic frame: scene Y = ecliptic north).
 * Distance is compressed by MOON_DISTANCE_SCALE so it reads as a small ring near Earth.
 */
export function getMoonInertialOffset(target: Vector3, date: Date = new Date()): Vector3 {
  const { eclipticLon, eclipticLat, distanceKm } = getLunarState(date);
  const lambdaR = eclipticLon * DEG;
  const betaR = eclipticLat * DEG;
  const r = (distanceKm / EARTH_RADIUS_KM) * MOON_DISTANCE_SCALE;
  // Ecliptic xyz: x = r·cos(β)·cos(λ), y = r·cos(β)·sin(λ), z = r·sin(β).
  // Mapped to scene frame the same way helio.ts maps the planets:
  //   scene_x = ecl_x, scene_y = ecl_z, scene_z = -ecl_y
  return target.set(
    r * Math.cos(betaR) * Math.cos(lambdaR),
    r * Math.sin(betaR),
    -r * Math.cos(betaR) * Math.sin(lambdaR)
  );
}

const DEG = Math.PI / 180;

function mod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}
