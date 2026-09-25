import { Matrix4, Quaternion, Vector3 } from 'three';
import type { PlanetBodyMetadata } from '../registry/types';

const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DEG = Math.PI / 180;

/** IAU prime-meridian angle W (radians) at `date`, or null without a W model. */
export function iauRotationRad(meta: PlanetBodyMetadata, date: Date): number | null {
  if (
    meta.rotationModel !== 'iau-w' ||
    meta.rotationW0Deg === undefined ||
    meta.rotationRateDegPerDay === undefined
  )
    return null;
  const days = (date.getTime() - J2000_MS) / 86_400_000;
  const w = (meta.rotationW0Deg + meta.rotationRateDegPerDay * days) % 360;
  return (w < 0 ? w + 360 : w) * DEG;
}

const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _basis = new Matrix4();
const ECLIPTIC_NORTH = new Vector3(0, 1, 0);

/**
 * Orientation of a synchronously rotating moon: local +X (the sub-parent
 * meridian) points at the parent and local +Y lies along the parent's pole.
 * Regular moons orbit in their planet's equatorial plane, so the planet's pole
 * is a close proxy for their spin axis; without one (Earth's Moon), ecliptic
 * north is within 1.6 degrees of the lunar pole.
 */
export function tidalLockQuaternion(
  offsetFromParent: Vector3,
  parentPole: readonly [number, number, number] | undefined,
  target: Quaternion
): Quaternion {
  _x.copy(offsetFromParent).normalize().negate();
  if (parentPole) _y.set(parentPole[0], parentPole[1], parentPole[2]).normalize();
  else _y.copy(ECLIPTIC_NORTH);
  _y.addScaledVector(_x, -_y.dot(_x)).normalize();
  _z.crossVectors(_x, _y);
  return target.setFromRotationMatrix(_basis.makeBasis(_x, _y, _z));
}
