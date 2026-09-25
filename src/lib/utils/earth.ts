import { Matrix4, Vector3 } from 'three';
import { getPlanetScenePosition } from './helio';
import { getMoonInertialOffset } from './moon';
import { EARTH_OBLIQUITY_RAD, KM_TO_SCENE } from '../scene-config';

/**
 * Earth's orientation is R_x(-obliquity) · R_y(GMST): GMST spins Earth about
 * its geographic axis and the obliquity tilts that axis from ecliptic north.
 * PlanetBody applies the same composition to the Earth mesh, so bodies placed
 * with these helpers stay attached to the rendered surface.
 */

const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DEG_PER_HOUR = 15;
const DEG_TO_RAD = Math.PI / 180;
/** Moon mass over Earth–Moon mass (DE440 mass ratio 81.3006). */
const MOON_MASS_FRACTION = 1 / 82.3006;

/** Greenwich Mean Sidereal Time as a rotation angle in radians. */
export function getGmstRadians(date: Date): number {
  const d = (date.getTime() - J2000_MS) / 86400000;
  let hours = (18.697374558 + 24.06570982441908 * d) % 24;
  if (hours < 0) hours += 24;
  return hours * DEG_PER_HOUR * DEG_TO_RAD;
}

/**
 * Earth's heliocentric scene position. JPL's approximate elements describe the
 * Earth–Moon barycenter, which sits about 4,700 km from Earth's center; that
 * offset is visible at true scale, so it is removed using the lunar model.
 */
export function getEarthScenePosition(target: Vector3, date: Date): Vector3 {
  getPlanetScenePosition(target, 'earth', date);
  return target.addScaledVector(getMoonInertialOffset(_moon, date), -MOON_MASS_FRACTION);
}

/**
 * Apply Earth's orientation (without translation) to an Earth-fixed offset,
 * giving the inertial offset from Earth's center in scene coordinates.
 */
function earthLocalToInertialOffset(
  local: { x: number; y: number; z: number },
  target: Vector3,
  date: Date
): Vector3 {
  _earthRot.makeRotationX(-EARTH_OBLIQUITY_RAD);
  _gmstRot.makeRotationY(getGmstRadians(date));
  _earthRot.multiply(_gmstRot);
  return target.set(local.x, local.y, local.z).applyMatrix4(_earthRot);
}

/**
 * Earth-centered, Earth-fixed kilometres (x to 0° longitude, z to the north
 * pole) in the Earth mesh's local frame, where +Y is north and east is -Z.
 */
export function ecfKmToEarthLocal(
  ecf: { x: number; y: number; z: number },
  target: Vector3
): Vector3 {
  return target.set(ecf.x * KM_TO_SCENE, ecf.z * KM_TO_SCENE, -ecf.y * KM_TO_SCENE);
}

/**
 * Earth-fixed satellite position (from SGP4's TEME output rotated by GMST) as
 * an inertial scene offset. Going through the Earth-fixed frame keeps the
 * satellite above the correct point of the rendered, GMST-rotated globe.
 */
export function ecfKmToInertialOffset(
  ecf: { x: number; y: number; z: number },
  target: Vector3,
  date: Date
): Vector3 {
  return earthLocalToInertialOffset(ecfKmToEarthLocal(ecf, _local), target, date);
}

const _moon = new Vector3();
const _local = new Vector3();
const _earthRot = new Matrix4();
const _gmstRot = new Matrix4();
