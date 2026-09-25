import { Vector3 } from 'three';

const UP = new Vector3(0, 1, 0);
const _toSun = new Vector3();
const _side = new Vector3();

/**
 * Direction from a body to the camera for a fly-to. Resolved worlds are seen
 * about 50° off the Sun line, so the disc is mostly lit with the terminator in
 * view; ringed planets are raised toward their pole so the rings open; bodies
 * in orbit around a planet are seen from above with the day side behind them;
 * small heliocentric bodies are seen from beyond, with the Sun in the frame.
 */
export function framingDirection(
  body: Vector3,
  parent: Vector3 | null,
  resolved: boolean,
  ringPole: Vector3 | null,
  out: Vector3
): Vector3 {
  if (body.lengthSq() === 0) return out.set(0.55, 0.4, 0.73).normalize();
  _toSun.copy(body).negate().normalize();
  if (resolved) {
    out
      .copy(_toSun)
      .applyAxisAngle(UP, ringPole ? 0.55 : 0.9)
      .addScaledVector(UP, 0.35);
    if (ringPole) out.addScaledVector(ringPole, out.dot(ringPole) >= 0 ? 0.7 : -0.7);
  } else if (parent && parent.lengthSq() > 0) {
    out.copy(body).sub(parent).normalize().addScaledVector(_toSun, 0.8).addScaledVector(UP, 0.2);
  } else {
    _side.crossVectors(UP, _toSun).normalize();
    out.copy(_side).multiplyScalar(0.8).addScaledVector(_toSun, -1).addScaledVector(UP, 0.3);
  }
  return out.lengthSq() < 1e-12 ? out.set(0, 1, 0) : out.normalize();
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Log-distance at eased flight progress `t`. Long hops pull back mid-flight
 * far enough to see both endpoints, then settle in, instead of skimming past
 * or through anything between them.
 */
export function flightLogDistance(
  fromDistance: number,
  toDistance: number,
  separation: number,
  t: number
): number {
  const from = Math.log(fromDistance);
  const to = Math.log(toDistance);
  const hump = Math.max(0, Math.log(separation * 1.1) - (from + to) / 2);
  return from + (to - from) * t + hump * Math.sin(Math.PI * t);
}

/** Flight length in ms: about 1.2 s for short hops, up to 3 s across the solar system. */
export function flightDuration(fromDistance: number, toDistance: number, separation: number) {
  const zoom = Math.abs(Math.log(toDistance / fromDistance));
  return Math.min(
    3000,
    1200 + 200 * Math.log1p(separation / (fromDistance + toDistance)) + 40 * zoom
  );
}
