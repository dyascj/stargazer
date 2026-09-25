import type { Vector3 } from 'three';
import type { TrackedObject } from './types';
import { SUN } from './bodies/sun';
import { MERCURY } from './bodies/mercury';
import { VENUS } from './bodies/venus';
import { EARTH } from './bodies/earth';
import { MOON } from './bodies/moon';
import { MARS } from './bodies/mars';
import { JUPITER } from './bodies/jupiter';
import { SATURN } from './bodies/saturn';
import { URANUS } from './bodies/uranus';
import { NEPTUNE } from './bodies/neptune';
import { PLUTO } from './bodies/pluto';
import { ISS } from './bodies/iss';
import { TIANGONG } from './bodies/tiangong';
import { NOTABLE_MOONS } from './bodies/moons';
import { SPACECRAFT } from './bodies/spacecraft';
import { SMALL_BODIES } from './bodies/smallBodies';
import { CURATED_SATELLITES } from './bodies/satellites';

/** Central registry — all tracked bodies. Add a bodies/<id>.ts entry and import it here. */
export const TRACKED_OBJECTS: TrackedObject[] = [
  SUN,
  // Inner planets
  MERCURY,
  VENUS,
  EARTH,
  MOON,
  MARS,
  // Outer planets + dwarf
  JUPITER,
  SATURN,
  URANUS,
  NEPTUNE,
  PLUTO,
  // Notable moons of the major planets (Phobos through Charon)
  ...NOTABLE_MOONS,
  // Earth-orbit satellites
  ISS,
  TIANGONG,
  // Curated Earth-orbit satellites (Hubble, Chandra, GPS, Starlink, etc.)
  ...CURATED_SATELLITES,
  // Active interplanetary spacecraft and surface landers
  ...SPACECRAFT,
  // Famous small bodies: asteroids, NEOs, KBO dwarf planets, comets
  ...SMALL_BODIES
];

/** Index by id for O(1) lookup. Built once at module load. */
const BY_ID: Record<string, TrackedObject> = (() => {
  const map: Record<string, TrackedObject> = Object.create(null);
  for (const obj of TRACKED_OBJECTS) {
    if (map[obj.id]) {
      throw new Error(`Duplicate registry id: ${obj.id}`);
    }
    map[obj.id] = obj;
  }
  for (const object of TRACKED_OBJECTS) {
    const visited = new Set<string>();
    let current: TrackedObject | undefined = object;
    while (current) {
      if (visited.has(current.id)) throw new Error(`Registry cycle: ${current.id}`);
      visited.add(current.id);
      if (current.parent && !map[current.parent])
        throw new Error(`Unknown parent: ${current.parent}`);
      current = current.parent ? map[current.parent] : undefined;
    }
  }
  return map;
})();

/** Look up a tracked object by id. Returns undefined if not found. */
export function getById(id: string | null | undefined): TrackedObject | undefined {
  if (!id) return undefined;
  return BY_ID[id];
}

/** Return all direct children of a body. Pass null for root-level bodies. */
export function getChildren(id: string | null): TrackedObject[] {
  return TRACKED_OBJECTS.filter((obj) => obj.parent === id);
}

/** Ancestor chain in root-first order. Example: getAncestors('iss') → [SUN, EARTH, ISS]. */
export function getAncestors(id: string): TrackedObject[] {
  const chain: TrackedObject[] = [];
  let current: TrackedObject | undefined = getById(id);
  while (current) {
    chain.unshift(current);
    current = current.parent ? getById(current.parent) : undefined;
  }
  return chain;
}

/**
 * Walk the parent chain and accumulate each ancestor's offset into `target`.
 * Returns null if any link has no valid position for `date`.
 * `scratch` is reused per level to avoid per-frame allocations.
 */
export function getWorldPosition(
  id: string,
  date: Date,
  target: Vector3,
  scratch: Vector3
): Vector3 | null {
  target.set(0, 0, 0);
  let currentId: string | null = id;
  while (currentId) {
    const body: TrackedObject | undefined = BY_ID[currentId];
    if (!body) return null;
    const offset = body.offsetFn(date, scratch);
    if (!offset || !Number.isFinite(offset.x + offset.y + offset.z)) return null;
    target.add(offset);
    currentId = body.parent;
  }
  return target;
}
