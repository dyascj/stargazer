import { Vector3 } from 'three';
import { TRACKED_OBJECTS } from '$lib/registry/registry';
import type { TrackedObject } from '$lib/registry/types';
import { bodyRadius } from '$utils/bodyMetrics';

/**
 * World positions of every tracked body for the current frame, computed once
 * (parents before children) and shared by every scene component. Positions
 * are float64 on the CPU; three.js builds model-view matrices in float64 too,
 * so nothing near the camera loses precision even millions of units from the Sun.
 */

const depth = (body: TrackedObject): number =>
  body.parent ? 1 + depth(TRACKED_OBJECTS.find((b) => b.id === body.parent)!) : 0;

/** Bodies ordered so that every parent precedes its children. */
export const BODIES: readonly TrackedObject[] = [...TRACKED_OBJECTS].sort(
  (a, b) => depth(a) - depth(b)
);
export const BODY_COUNT = BODIES.length;
export const RADII = Float64Array.from(BODIES, bodyRadius);
const INDEX = new Map(BODIES.map((body, index) => [body.id, index]));
const PARENT = Int32Array.from(BODIES, (body) => (body.parent ? INDEX.get(body.parent)! : -1));

export const positions = BODIES.map(() => new Vector3());
export const valid = new Uint8Array(BODY_COUNT);

export function indexOf(id: string | null | undefined): number {
  return id ? (INDEX.get(id) ?? -1) : -1;
}

/** Parent index, or -1 for the Sun. */
export function parentOf(index: number): number {
  return PARENT[index];
}

/** This frame's world position of `id`, or null when it has none. */
export function positionOf(id: string | null | undefined): Vector3 | null {
  const index = indexOf(id);
  return index >= 0 && valid[index] ? positions[index] : null;
}

export function updateBodyPositions(date: Date): void {
  for (let i = 0; i < BODY_COUNT; i++) {
    const parent = PARENT[i];
    const offset = BODIES[i].offsetFn(date, positions[i]);
    const ok =
      !!offset &&
      Number.isFinite(offset.x + offset.y + offset.z) &&
      (parent < 0 || valid[parent] === 1);
    valid[i] = ok ? 1 : 0;
    if (ok && parent >= 0) positions[i].add(positions[parent]);
  }
}
