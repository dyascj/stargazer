import { Matrix4, Vector3 } from 'three';
import { EARTH_OBLIQUITY_RAD } from '../scene-config';

/**
 * Scene frame: J2000 ecliptic with scene +X = vernal equinox, +Y = ecliptic
 * north, and -Z = ecliptic longitude 90 degrees (ecliptic y maps to -scene z).
 */
const DEG = Math.PI / 180;
const COS_E = Math.cos(EARTH_OBLIQUITY_RAD);
const SIN_E = Math.sin(EARTH_OBLIQUITY_RAD);

/** J2000 equatorial unit vector to scene coordinates. */
export function equatorialVectorToScene(x: number, y: number, z: number): [number, number, number] {
  const eclipticY = y * COS_E + z * SIN_E;
  const eclipticZ = -y * SIN_E + z * COS_E;
  return [x, eclipticZ, -eclipticY];
}

/** J2000 right ascension and declination (degrees) as a scene unit vector. */
export function equatorialToScene(raDeg: number, decDeg: number): [number, number, number] {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  return equatorialVectorToScene(
    Math.cos(dec) * Math.cos(ra),
    Math.cos(dec) * Math.sin(ra),
    Math.sin(dec)
  );
}

// Rows are the galactic x, y, z axes in J2000 equatorial coordinates (Hipparcos, ESA 1997).
const GALACTIC_AXES = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.44482963, 0.7469822445],
  [-0.867666149, -0.1980763734, 0.4559837762]
];

/** Rotation taking galactic vectors (x to the Galactic Center, z to the north pole) into the scene. */
export const GALACTIC_TO_SCENE = new Matrix4().makeBasis(
  ...(GALACTIC_AXES.map(([x, y, z]) => new Vector3(...equatorialVectorToScene(x, y, z))) as [
    Vector3,
    Vector3,
    Vector3
  ])
);
