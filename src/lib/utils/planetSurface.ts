import { Quaternion, Vector3 } from 'three';
import { poleQuaternion } from './pole';
import { iauRotationRad } from './rotation';
import { getById } from '../registry/registry';
import { isPlanetBody } from '../registry/types';

/**
 * A surface site's offset from its planet's center in scene coordinates. The
 * site starts in the planet's mesh frame (+X at 0° longitude, +Y north, east
 * toward -Z), is spun by the IAU prime-meridian angle, and is then oriented by
 * the pole, exactly as PlanetBody transforms the planet mesh, so landers stay
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
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const r = meta.radius * (1 + altKm / meta.radiusKm);
  target.set(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    -r * Math.cos(lat) * Math.sin(lon)
  );
  const w = iauRotationRad(meta, date);
  if (w !== null) target.applyAxisAngle(Y_AXIS, w);
  let quat = _quatCache.get(parentId);
  if (!quat) _quatCache.set(parentId, (quat = poleQuaternion(pole)));
  return target.applyQuaternion(quat);
}

const DEG = Math.PI / 180;
const Y_AXIS = new Vector3(0, 1, 0);
