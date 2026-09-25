import { solveKepler } from '$utils/kepler';
import type { OrbitalElementsWithRates } from '$utils/helio';

/**
 * Top-down (ecliptic plane) planet geometry for the landing diagrams. Uses the
 * same JPL approximate elements as the explorer, projected onto the ecliptic.
 */

const DEG = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12);
const CENTURY_MS = 36525 * 86_400_000;

/** Seconds for sunlight to cross one astronomical unit. */
export const LIGHT_SECONDS_PER_AU = 499.004784;

function evaluate(elements: OrbitalElementsWithRates, date: Date) {
  const t = (date.getTime() - J2000) / CENTURY_MS;
  const at = ([value, rate]: [number, number]) => value + rate * t;
  return {
    a: at(elements.a),
    e: at(elements.e),
    i: at(elements.i) * DEG,
    L: at(elements.L) * DEG,
    peri: at(elements.longPeri) * DEG,
    node: at(elements.longNode) * DEG
  };
}

/** Rotate an in-orbit-plane point to the ecliptic and drop z. */
function project(x: number, y: number, el: ReturnType<typeof evaluate>): [number, number] {
  const w = el.peri - el.node;
  const [cO, sO, cw, sw, ci] = [
    Math.cos(el.node),
    Math.sin(el.node),
    Math.cos(w),
    Math.sin(w),
    Math.cos(el.i)
  ];
  return [
    (cO * cw - sO * sw * ci) * x + (-cO * sw - sO * cw * ci) * y,
    (sO * cw + cO * sw * ci) * x + (-sO * sw + cO * cw * ci) * y
  ];
}

/** Heliocentric ecliptic x, y in AU. */
export function planetXY(elements: OrbitalElementsWithRates, date: Date): [number, number] {
  const el = evaluate(elements, date);
  const E = solveKepler(el.L - el.peri, el.e);
  return project(el.a * (Math.cos(E) - el.e), el.a * Math.sqrt(1 - el.e ** 2) * Math.sin(E), el);
}

/** Closed SVG path of the orbit in AU, with y flipped for screen space. */
export function orbitPath(elements: OrbitalElementsWithRates, date: Date, steps = 180): string {
  const el = evaluate(elements, date);
  const b = el.a * Math.sqrt(1 - el.e ** 2);
  let d = '';
  for (let k = 0; k < steps; k++) {
    const E = (k / steps) * Math.PI * 2;
    const [x, y] = project(el.a * (Math.cos(E) - el.e), b * Math.sin(E), el);
    d += `${k ? 'L' : 'M'}${x.toFixed(4)} ${(-y).toFixed(4)}`;
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
