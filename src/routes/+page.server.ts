import { Vector3 } from 'three';
import { TRACKED_OBJECTS, getById, getWorldPosition } from '$lib/registry/registry';
import type { ObjectType, TrackedObject } from '$lib/registry/types';
import { PLANETS } from '$utils/helio';
import { AU_TO_SCENE } from '$lib/scene-config';
import type { PageServerLoad } from './$types';

// The landing is static. Everything below is computed from the registry at build
// time and serialized, so the registry and three.js never reach the landing bundle.
export const prerender = true;

const count = (...types: ObjectType[]) =>
  TRACKED_OBJECTS.filter((object) => types.includes(object.type)).length;

const fact = (object: TrackedObject | undefined, ...labels: string[]) =>
  object?.metadata.facts?.find((item) => labels.includes(item.label))?.value;

/**
 * Circular-orbit altitude from a fact such as "LEO (540 km)" or "~408 km". Elliptical
 * ranges like "HEO (16,000 x 133,000 km)" and unquantified orbits return null.
 */
const parseKm = (text?: string) => {
  const match = text?.match(/^~?([\d,]+) km$|\(([\d,]+) km\)/);
  return match ? Number((match[1] ?? match[2]).replaceAll(',', '')) : null;
};

const position = new Vector3();
const scratch = new Vector3();
/** Heliocentric distance in AU, falling back to the parent when a snapshot is out of range. */
function distanceAU(id: string, date: Date): number | null {
  for (let object = getById(id); object; object = getById(object.parent)) {
    if (getWorldPosition(object.id, date, position, scratch))
      return position.length() / AU_TO_SCENE;
  }
  return null;
}

export const load: PageServerLoad = () => {
  const now = new Date();
  const iss = getById('iss');

  const planets = Object.keys(PLANETS).map((id) => ({
    id,
    name: getById(id)!.name,
    elements: PLANETS[id]
  }));

  const worlds = ['earth', 'moon', 'mars', 'jupiter', 'saturn'].map((id) => {
    const object = getById(id)!;
    const meta = object.metadata as {
      radiusKm: number;
      textureUrl: string;
      dayLength?: string;
      yearLength?: string;
      subtitle?: string;
      hasRings?: { innerRadius: number; outerRadius: number; textureUrl: string };
      radius?: number;
    };
    return {
      id,
      name: object.name,
      subtitle: meta.subtitle ?? '',
      radiusKm: meta.radiusKm,
      texture: meta.textureUrl,
      day: meta.dayLength ?? '',
      year: meta.yearLength ?? '',
      gravity: fact(object, 'Surface gravity') ?? '',
      rings:
        meta.hasRings && meta.radius
          ? {
              inner: meta.hasRings.innerRadius / meta.radius,
              outer: meta.hasRings.outerRadius / meta.radius,
              texture: meta.hasRings.textureUrl
            }
          : null
    };
  });

  const spacecraft = TRACKED_OBJECTS.filter((object) => object.type === 'spacecraft')
    .map((object) => ({
      id: object.id,
      name: object.name,
      subtitle: object.metadata.subtitle ?? '',
      au: distanceAU(object.id, now)
    }))
    .filter((craft): craft is typeof craft & { au: number } => craft.au !== null)
    .sort((a, b) => a.au - b.au);

  const satellites = TRACKED_OBJECTS.filter((object) => object.type === 'earth-satellite')
    .map((object) => ({
      id: object.id,
      name: object.name,
      altitudeKm: parseKm(fact(object, 'Orbital altitude', 'Orbit type'))
    }))
    .filter((sat): sat is typeof sat & { altitudeKm: number } => sat.altitudeKm !== null);

  return {
    builtAt: now.toISOString(),
    counts: {
      total: TRACKED_OBJECTS.length,
      planets: count('planet'),
      dwarfPlanets: count('dwarf-planet'),
      moons: count('moon'),
      spacecraft: count('spacecraft', 'lander'),
      satellites: count('earth-satellite'),
      smallBodies: count('asteroid', 'comet', 'trans-neptunian')
    },
    planets,
    worlds,
    spacecraft,
    satellites,
    iss: {
      altitude: fact(iss, 'Orbital altitude') ?? '',
      speed: fact(iss, 'Speed') ?? '',
      period: fact(iss, 'Orbital period') ?? '',
      speedKmh: Number((fact(iss, 'Speed') ?? '').replace(/[^\d]/g, ''))
    }
  };
};
