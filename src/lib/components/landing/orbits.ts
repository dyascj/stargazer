import {
  meanElements,
  orbitPointAU,
  planetEclipticAU,
  type OrbitalElementsWithRates
} from '$utils/helio';

/**
 * Top-down (ecliptic plane) planet geometry for the landing diagrams: the
 * explorer's JPL approximate elements, projected onto the ecliptic.
 */

/** Seconds for sunlight to cross one astronomical unit. */
const LIGHT_SECONDS_PER_AU = 499.004784;

const point = { x: 0, y: 0, z: 0 };

/** Heliocentric ecliptic x, y in AU. */
export function planetXY(elements: OrbitalElementsWithRates, date: Date): [number, number] {
  planetEclipticAU(elements, date, point);
  return [point.x, point.y];
}

/** Closed SVG path of the orbit in AU, with y flipped for screen space. */
export function orbitPath(elements: OrbitalElementsWithRates, date: Date, steps = 180): string {
  const el = meanElements(elements, date);
  let d = '';
  for (let k = 0; k < steps; k++) {
    orbitPointAU(el, (k / steps) * Math.PI * 2, point);
    d += `${k ? 'L' : 'M'}${point.x.toFixed(4)} ${(-point.y).toFixed(4)}`;
  }
  return d + 'Z';
}

/** "4 h 10 min", "23 h 14 min", "8 min 19 s" */
export function formatLightTime(au: number): string {
  const seconds = au * LIGHT_SECONDS_PER_AU;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h) return `${h} h ${m} min`;
  return `${m} min ${Math.round(seconds % 60)} s`;
}
