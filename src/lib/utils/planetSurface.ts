import { Quaternion, Vector3 } from 'three';
import { poleQuaternion } from './pole';
import { getById } from '../registry/registry';
import { isPlanetBody } from '../registry/types';
import { latLonAltToVec3 } from './coords';

/**
 * Convert a lat/lon point on a planet's surface (or just above it) into
 * the body's inertial offset from the planet's center, in scene
 * coordinates. Used by surface landers / rovers (Curiosity, Perseverance,
 * future Tianwen-1 Zhurong, future lunar landers, etc.).
 *
 * Pipeline (mirrors the Earth-specific `earthLocalToInertialOffset` but
 * works for any tracked planet that has both a `poleVec` and an
 * `iau-w` rotation model in its registry metadata):
 *
 *   1. lat/lon/alt → local Cartesian in the planet's mesh frame
 *      (parent's local +Y = pole, equator = local XZ plane).
 *   2. Apply the planet's daily rotation (IAU W-formula) around the
 *      LOCAL +Y axis. The W angle is the same one PlanetBody uses
 *      to spin the body — so the lander stays attached to the surface
 *      as the planet rotates beneath it.
 *   3. Apply the planet's pole quaternion to convert from the planet's
 *      mesh frame into the unified scene frame.
 *
 * The result is the lander's offset from the planet's center, in
 * scene units. The registry's parent walk then composes with the
 * planet's heliocentric position to get the lander's world position.
 *
 * Both the pole quaternion and the W-formula constants are looked up
 * from the parent's registry metadata each call. The quaternion is
 * cached per parent for efficiency.
 */

const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DEG_TO_RAD = Math.PI / 180;

const _quatCache = new Map<string, Quaternion | null>();

function getParentPoleQuat(parentId: string): Quaternion | null {
  const cached = _quatCache.get(parentId);
  if (cached !== undefined) return cached;

  const parent = getById(parentId);
  if (!parent || !isPlanetBody(parent) || !parent.metadata.poleVec) {
    _quatCache.set(parentId, null);
    return null;
  }
  const q = poleQuaternion(parent.metadata.poleVec);
  _quatCache.set(parentId, q);
  return q;
}

/**
 * Compute a surface lander's inertial offset from its parent planet's
 * center, for the given simulation date.
 *
 * @param parentId  Registry id of the parent planet (must have poleVec
 *                   and an iau-w rotation model).
 * @param latDeg    Latitude in degrees (+N).
 * @param lonDeg    Longitude in degrees (+E).
 * @param altKm     Altitude above mean radius in km (default 0).
 * @param date      Simulation date.
 * @param target    Vector3 to write the result into.
 */
export function planetSurfaceToInertialOffset(
  parentId: string,
  latDeg: number,
  lonDeg: number,
  altKm: number,
  date: Date,
  target: Vector3
): Vector3 | null {
  const parent = getById(parentId);
  if (!parent || !isPlanetBody(parent) || !parent.metadata.poleVec) return null;

  // Step 1: lat/lon/alt → local Cartesian in the planet's mesh frame.
  // The mesh-frame radius unit is "scene units relative to Earth's
  // radius", since the body's `radius` field follows that convention.
  // We pass the planet's actual radius in km so the conversion uses
  // the right scale.
  const planetRadiusKm = parent.metadata.radiusKm;
  const planetRadiusScene = parent.metadata.radius;
  const [lx, ly, lz] = latLonAltToVec3(latDeg, lonDeg, altKm, planetRadiusScene, planetRadiusKm);

  // Step 2: rotate by the planet's IAU W-formula spin around local +Y.
  // The W angle is the same one PlanetBody uses each frame, so the
  // lander stays glued to the rotating surface.
  let postSpinX = lx;
  let postSpinY = ly;
  let postSpinZ = lz;
  if (
    parent.metadata.rotationModel === 'iau-w' &&
    parent.metadata.rotationW0Deg !== undefined &&
    parent.metadata.rotationRateDegPerDay !== undefined
  ) {
    const days = (date.getTime() - J2000_MS) / 86_400_000;
    const wDeg = parent.metadata.rotationW0Deg + parent.metadata.rotationRateDegPerDay * days;
    const wRad = (((wDeg % 360) + 360) % 360) * DEG_TO_RAD;
    const cosW = Math.cos(wRad);
    const sinW = Math.sin(wRad);
    postSpinX = cosW * lx + sinW * lz;
    postSpinZ = -sinW * lx + cosW * lz;
  }

  // Step 3: apply the parent's pole quaternion.
  target.set(postSpinX, postSpinY, postSpinZ);
  const quat = getParentPoleQuat(parentId);
  if (quat) target.applyQuaternion(quat);

  return target;
}
