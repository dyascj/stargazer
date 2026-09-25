import type { Vector3 } from 'three';
import { AU_TO_SCENE } from '../scene-config';
import { orbitToEcliptic, solveKepler } from './kepler';

/**
 * Heliocentric position helpers using the Standish/Meeus orbital element approach.
 * JPL Table 1 fit, valid 1800–2050. The 'earth' elements describe the Earth–Moon
 * barycenter (see getEarthScenePosition). These are not navigation ephemerides.
 */

const DEG = Math.PI / 180;
const J2000_MS = Date.UTC(2000, 0, 1, 12);

export interface OrbitalElementsWithRates {
  /** Semi-major axis at J2000 (AU), and rate per Julian century */
  a: [number, number];
  e: [number, number];
  i: [number, number];
  L: [number, number];
  longPeri: [number, number];
  longNode: [number, number];
}

// J2000 mean elements + linear rates per Julian century.
// Source: https://ssd.jpl.nasa.gov/planets/approx_pos.html
export const PLANETS: Record<string, OrbitalElementsWithRates> = {
  mercury: {
    a: [0.38709927, 0.00000037],
    e: [0.20563593, 0.00001906],
    i: [7.00497902, -0.00594749],
    L: [252.2503235, 149472.67411175],
    longPeri: [77.45779628, 0.16047689],
    longNode: [48.33076593, -0.12534081]
  },
  venus: {
    a: [0.72333566, 0.0000039],
    e: [0.00677672, -0.00004107],
    i: [3.39467605, -0.0007889],
    L: [181.9790995, 58517.81538729],
    longPeri: [131.60246718, 0.00268329],
    longNode: [76.67984255, -0.27769418]
  },
  earth: {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    i: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981],
    longPeri: [102.93768193, 0.32327364],
    longNode: [0, 0]
  },
  mars: {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    i: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499],
    longPeri: [-23.94362959, 0.44441088],
    longNode: [49.55953891, -0.29257343]
  },
  jupiter: {
    a: [5.202887, -0.00011607],
    e: [0.04838624, -0.00013253],
    i: [1.30439695, -0.00183714],
    L: [34.39644051, 3034.74612775],
    longPeri: [14.72847983, 0.21252668],
    longNode: [100.47390909, 0.20469106]
  },
  saturn: {
    a: [9.53667594, -0.0012506],
    e: [0.05386179, -0.00050991],
    i: [2.48599187, 0.00193609],
    L: [49.95424423, 1222.49362201],
    longPeri: [92.59887831, -0.41897216],
    longNode: [113.66242448, -0.28867794]
  },
  uranus: {
    a: [19.18916464, -0.00196176],
    e: [0.04725744, -0.00004397],
    i: [0.77263783, -0.00242939],
    L: [313.23810451, 428.48202785],
    longPeri: [170.9542763, 0.40805281],
    longNode: [74.01692503, 0.04240589]
  },
  neptune: {
    a: [30.06992276, 0.00026291],
    e: [0.00859048, 0.00005105],
    i: [1.77004347, 0.00035372],
    L: [-55.12002969, 218.45945325],
    longPeri: [44.96476227, -0.32241464],
    longNode: [131.78422574, -0.00508664]
  },
  pluto: {
    a: [39.48211675, -0.00031596],
    e: [0.2488273, 0.0000517],
    i: [17.14001206, 0.00004818],
    L: [238.92903833, 145.20780515],
    longPeri: [224.06891629, -0.04062942],
    longNode: [110.30393684, -0.01183482]
  }
};

function mod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function at(element: [number, number], T: number): number {
  return element[0] + element[1] * T;
}

/** Elements at a date: `a` in AU, angles in radians, `M` the mean anomaly. */
export interface MeanElements {
  a: number;
  e: number;
  i: number;
  node: number;
  argPeri: number;
  M: number;
}

export function meanElements(
  elements: OrbitalElementsWithRates,
  date: Date,
  out = {} as MeanElements
): MeanElements {
  const T = (date.getTime() - J2000_MS) / (86400000 * 36525);
  const longPeri = at(elements.longPeri, T);
  const longNode = at(elements.longNode, T);
  out.a = at(elements.a, T);
  out.e = at(elements.e, T);
  out.i = at(elements.i, T) * DEG;
  out.node = longNode * DEG;
  out.argPeri = (longPeri - longNode) * DEG;
  out.M = mod(at(elements.L, T) - longPeri, 360) * DEG;
  return out;
}

type Point = { x: number; y: number; z: number };

/** Ecliptic position in AU at eccentric anomaly `E` along the orbit. */
export function orbitPointAU<T extends Point>(el: MeanElements, E: number, out: T): T {
  const x = el.a * (Math.cos(E) - el.e);
  const y = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  return orbitToEcliptic(x, y, el.node, el.argPeri, el.i, out);
}

const scratch = {} as MeanElements;

/** Heliocentric J2000 ecliptic position in AU. */
export function planetEclipticAU<T extends Point>(
  elements: OrbitalElementsWithRates,
  date: Date,
  out: T
): T {
  const el = meanElements(elements, date, scratch);
  return orbitPointAU(el, solveKepler(el.M, el.e), out);
}

/** Heliocentric scene-space position of a planet (scene Y = ecliptic north). */
export function getPlanetScenePosition(
  target: Vector3,
  planetKey: keyof typeof PLANETS,
  date: Date
): Vector3 {
  const { x, y, z } = planetEclipticAU(PLANETS[planetKey], date, target);
  // Ecliptic (x, y, z) maps to scene (x, z, -y): scene Y is ecliptic north.
  return target.set(x * AU_TO_SCENE, z * AU_TO_SCENE, -y * AU_TO_SCENE);
}
