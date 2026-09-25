import { Quaternion, Vector3 } from 'three';
import { poleQuaternion } from './pole';
import { iauRotationRad } from './rotation';
import { getById } from '../registry/registry';
import { isPlanetBody } from '../registry/types';
import { latLonAltToVec3 } from './coords';

/**
 * A surface site's offset from its planet's center in scene coordinates. The
 * site is spun by the planet's IAU prime-meridian angle and then oriented by
 * its pole, exactly as PlanetBody transforms the planet mesh, so landers stay
 * on the rendered surface.
 */

const _quatCache = new Map<string, Quaternion>();

export function planetSurfaceToInertialOffset(
  parentId: string,
  latDeg: number,
  lonDeg: number,
  altKm: number,
  date: Date,
  target: Vector3
): Vector3 | null {
  const parent = getById(parentId);
  if (!parent || !isPlanetBody(parent)) return null;
  const meta = parent.metadata;
  const pole = meta.poleVec;
  if (!pole) return null;
  target.set(...latLonAltToVec3(latDeg, lonDeg, altKm, meta.radius, meta.radiusKm));
  const w = iauRotationRad(meta, date);
  if (w !== null) target.applyAxisAngle(Y_AXIS, w);
  let quat = _quatCache.get(parentId);
  if (!quat) _quatCache.set(parentId, (quat = poleQuaternion(pole)));
  return target.applyQuaternion(quat);
}

const Y_AXIS = new Vector3(0, 1, 0);
