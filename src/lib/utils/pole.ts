import { Matrix4, Quaternion, Vector3 } from 'three';
import { EARTH_OBLIQUITY_RAD } from '../scene-config';

/** IAU W=0 frame: x is the ascending node on the J2000 equator, y the body pole. */
export function poleQuaternion(pole: readonly [number, number, number]): Quaternion {
  const y = new Vector3(...pole).normalize();
  const equatorialNorth = new Vector3(
    0,
    Math.cos(EARTH_OBLIQUITY_RAD),
    -Math.sin(EARTH_OBLIQUITY_RAD)
  );
  const x = new Vector3().crossVectors(equatorialNorth, y).normalize();
  if (x.lengthSq() < 0.5) x.set(1, 0, 0);
  const z = new Vector3().crossVectors(x, y).normalize();
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}
