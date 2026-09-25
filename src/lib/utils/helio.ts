import { Vector3 } from 'three';
import { AU_TO_SCENE } from '../scene-config';
import { solveKepler } from './kepler';

/**
 * Heliocentric position helpers using the Standish/Meeus orbital element approach.
 * JPL Table 1 fit, valid 1800–2050. Earth uses the Earth–Moon barycenter
 * approximation. Accuracy varies by planet; these are not navigation ephemerides.
 */

const DEG = Math.PI / 180;
const J2000_MS = Date.UTC(2000, 0, 1, 12);

export interface OrbitalElements {
  /** Semi-major axis (AU) */
  a: number;
  /** Eccentricity */
  e: number;
  /** Inclination to ecliptic (deg) */
  i: number;
  /** Mean longitude (deg) */
  L: number;
  /** Longitude of perihelion (deg) */
  longPeri: number;
  /** Longitude of ascending node (deg) */
  longNode: number;
}

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

/** Evaluate orbital elements at a given Julian-century offset T. */
export function evaluateElements(els: OrbitalElementsWithRates, T: number): OrbitalElements {
  return {
    a: els.a[0] + els.a[1] * T,
    e: els.e[0] + els.e[1] * T,
    i: els.i[0] + els.i[1] * T,
    L: els.L[0] + els.L[1] * T,
    longPeri: els.longPeri[0] + els.longPeri[1] * T,
    longNode: els.longNode[0] + els.longNode[1] * T
  };
}

/** Heliocentric ecliptic position of a planet (AU, ecliptic Cartesian). */
export function heliocentricEclipticAU(els: OrbitalElements): { x: number; y: number; z: number } {
  const M = mod(els.L - els.longPeri, 360) * DEG;
  const omega = (els.longPeri - els.longNode) * DEG;
  const i = els.i * DEG;
  const Omega = els.longNode * DEG;

  const E = solveKepler(M, els.e);
  const xOrb = els.a * (Math.cos(E) - els.e);
  const yOrb = els.a * Math.sqrt(1 - els.e * els.e) * Math.sin(E);

  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  const x = (cosO * cosw - sinO * sinw * cosi) * xOrb + (-cosO * sinw - sinO * cosw * cosi) * yOrb;
  const y = (sinO * cosw + cosO * sinw * cosi) * xOrb + (-sinO * sinw + cosO * cosw * cosi) * yOrb;
  const z = sinw * sini * xOrb + cosw * sini * yOrb;

  return { x, y, z };
}

/** Heliocentric scene-space position of a planet (scene Y = ecliptic north). */
export function getPlanetScenePosition(
  target: Vector3,
  planetKey: keyof typeof PLANETS,
  date: Date = new Date()
): Vector3 {
  const T = (date.getTime() - J2000_MS) / (86400000 * 36525);
  const els = evaluateElements(PLANETS[planetKey], T);
  const { x, y, z } = heliocentricEclipticAU(els);
  // Map ecliptic frame to three.js (Y up). The ecliptic Z becomes scene Y;
  // ecliptic X stays as scene X; ecliptic Y maps to -scene Z so we get a
  // right-handed scene with the orbits viewed from "north".
  return target.set(x * AU_TO_SCENE, z * AU_TO_SCENE, -y * AU_TO_SCENE);
}

/** Closed orbit ellipse sampled at evenly-spaced eccentric anomalies, as a Float32Array of XYZ. */
export function getOrbitEllipsePoints(
  planetKey: keyof typeof PLANETS,
  samples = 256,
  date: Date = new Date()
): Float32Array {
  const T = (date.getTime() - J2000_MS) / (86400000 * 36525);
  const els = evaluateElements(PLANETS[planetKey], T);

  const positions = new Float32Array((samples + 1) * 3);
  const omega = (els.longPeri - els.longNode) * DEG;
  const i = els.i * DEG;
  const Omega = els.longNode * DEG;
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  for (let s = 0; s <= samples; s++) {
    const E = (s / samples) * 2 * Math.PI;
    const xOrb = els.a * (Math.cos(E) - els.e);
    const yOrb = els.a * Math.sqrt(1 - els.e * els.e) * Math.sin(E);

    const x =
      (cosO * cosw - sinO * sinw * cosi) * xOrb + (-cosO * sinw - sinO * cosw * cosi) * yOrb;
    const y =
      (sinO * cosw + cosO * sinw * cosi) * xOrb + (-sinO * sinw + cosO * cosw * cosi) * yOrb;
    const z = sinw * sini * xOrb + cosw * sini * yOrb;

    positions[s * 3] = x * AU_TO_SCENE;
    positions[s * 3 + 1] = z * AU_TO_SCENE;
    positions[s * 3 + 2] = -y * AU_TO_SCENE;
  }
  return positions;
}
