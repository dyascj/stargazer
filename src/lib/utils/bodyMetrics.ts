import { Vector3 } from 'three';
import { KM_TO_SCENE, SUN_RADIUS } from '../scene-config';
import { isPlanetBody, isStar, type TrackedObject } from '../registry/types';

/** Half the ISS's 109 m truss span, the only spacecraft drawn as a model. */
export const ISS_RADIUS = 0.0545 * KM_TO_SCENE;

/** Physical radius in scene units; 0 for bodies drawn only as markers. */
export function bodyRadius(body: TrackedObject): number {
  if (isPlanetBody(body)) return body.metadata.radius;
  if (isStar(body)) return SUN_RADIUS;
  return body.id === 'iss' ? ISS_RADIUS : 0;
}

/** Radius that a close framing must keep on screen, including rings. */
export function framingRadius(body: TrackedObject): number {
  return isPlanetBody(body) && body.metadata.hasRings
    ? body.metadata.hasRings.outerRadius
    : bodyRadius(body);
}

const _offset = new Vector3();

/**
 * Camera distance for a fly-to. Resolved bodies fill a fixed share of the
 * narrower half of the view; marker-only bodies are framed relative to their
 * distance from the parent, so satellites show the limb of their planet and
 * small bodies show a stretch of their orbit.
 */
export function framingDistance(
  body: TrackedObject,
  date: Date,
  fovYRad: number,
  aspect: number
): number {
  const radius = framingRadius(body);
  const halfAngle = Math.min(fovYRad / 2, Math.atan(Math.tan(fovYRad / 2) * aspect));
  if (radius > 0) return radius / Math.sin(halfAngle * (body.id === 'iss' ? 0.12 : 0.4));
  const fromParent = body.offsetFn(date, _offset)?.length() ?? 0;
  return Math.max(0.25 * fromParent, 1e-3);
}

/** Closest safe camera distance from a body's center. */
export function minimumDistance(body: TrackedObject): number {
  const radius = bodyRadius(body);
  return radius > 0 ? radius * 1.0015 + 1e-6 : 2e-6;
}
