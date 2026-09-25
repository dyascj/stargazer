import { Vector3 } from 'three';
import { getById, getWorldPosition } from '$lib/registry/registry';
import { isPlanetBody, isStar, type TrackedObject } from '$lib/registry/types';
import type { SatelliteState } from '$stores/satelliteFactory';
import type { LunarState } from '$utils/moon';
import { AU_KM, AU_TO_SCENE } from '$lib/scene-config';
import { formatNumber } from '$utils/format';

export interface Stat {
  label: string;
  value: string;
  unit?: string;
}
export type Tracking = { mode: string; source: string; epoch?: string };

const LIGHT_KM_PER_S = 299_792.458;
export function trackingOf(object: TrackedObject): Tracking {
  return (
    object.metadata.tracking ?? {
      mode: 'Approximate orbit',
      source:
        object.id === 'moon' ? 'Truncated lunar model' : 'JPL planetary element fit, 1800–2050'
    }
  );
}

/** The body itself if it orbits the Sun, else its Sun-orbiting ancestor. */
function heliocentric(object: TrackedObject): TrackedObject | null {
  let body: TrackedObject | undefined = object;
  while (body?.parent && body.parent !== 'sun') body = getById(body.parent);
  return body?.parent === 'sun' ? body : null;
}

const position = new Vector3();
const earth = new Vector3();
const scratch = new Vector3();

function lightTime(km: number): Stat {
  const minutes = km / LIGHT_KM_PER_S / 60;
  return minutes < 60
    ? { label: 'Light time', value: formatNumber(minutes, 1), unit: 'min' }
    : { label: 'Light time', value: formatNumber(minutes / 60, 1), unit: 'hr' };
}

/** "243 Earth days (retrograde)" becomes 243 / days with the note moved into the label. */
function period(label: string, text: string): Stat {
  const [, main, note] = /^(.*?)(?:\s*\((.*)\))?$/.exec(text.replace(' Earth ', ' '))!;
  const [, value, unit] = /^([\d.,]+)\s+(.+)$/.exec(main) ?? [, main];
  return { label: note ? `${label}, ${note}` : label, value: value!, unit };
}

/** Three or four headline numbers, chosen for what matters about this kind of body. */
export function heroStats(
  object: TrackedObject,
  date: Date,
  satellite: SatelliteState | null,
  lunar: LunarState | null
): Stat[] {
  if (satellite) {
    const lat = `${formatNumber(Math.abs(satellite.latitude), 1)}°${satellite.latitude >= 0 ? 'N' : 'S'}`;
    const lon = `${formatNumber(Math.abs(satellite.longitude), 1)}°${satellite.longitude >= 0 ? 'E' : 'W'}`;
    return [
      { label: 'Altitude', value: formatNumber(satellite.altitudeKm), unit: 'km' },
      { label: 'Speed', value: formatNumber(satellite.velocityKmh), unit: 'km/h' },
      { label: 'Over', value: `${lat} ${lon}` },
      {
        label: 'Sunlight',
        value:
          satellite.visibility === 'daylight'
            ? 'Sunlit'
            : satellite.visibility === 'eclipsed'
              ? 'In shadow'
              : 'Unknown'
      }
    ];
  }

  const radiusKm =
    isPlanetBody(object) || isStar(object) ? (object.metadata.radiusKm as number) : null;
  const radius: Stat | null = radiusKm
    ? { label: 'Radius', value: formatNumber(radiusKm, radiusKm < 100 ? 1 : 0), unit: 'km' }
    : null;

  if (lunar)
    return [
      { label: 'Phase', value: lunar.phaseName },
      { label: 'Illuminated', value: `${formatNumber(lunar.illumination * 100)}%` },
      { label: 'From Earth', value: formatNumber(lunar.distanceKm), unit: 'km' },
      radius!
    ];

  const hasEarth = !!getWorldPosition('earth', date, earth, scratch);
  const stats: (Stat | null)[] = [];
  if (isStar(object) && hasEarth) {
    const km = (earth.length() / AU_TO_SCENE) * AU_KM;
    stats.push(
      { label: 'From Earth', value: formatNumber(km / AU_KM, 3), unit: 'AU' },
      lightTime(km)
    );
  }
  const helio = heliocentric(object);
  if (helio && getWorldPosition(helio.id, date, position, scratch)) {
    const sun: Stat = {
      label: 'From Sun',
      value: formatNumber(position.length() / AU_TO_SCENE, 2),
      unit: 'AU'
    };
    // A snapshot marker stays put while Earth moves, so a live light time would mislead.
    const light =
      helio.id !== 'earth' && hasEarth && trackingOf(object).mode !== 'Snapshot'
        ? lightTime((position.distanceTo(earth) / AU_TO_SCENE) * AU_KM)
        : null;
    if (object.type === 'moon') stats.push(radius, sun, light);
    else stats.push(sun, light);
  }
  if (isPlanetBody(object)) {
    const { dayLength, yearLength } = object.metadata;
    if (object.type === 'moon') {
      if (yearLength) stats.unshift(period('Orbit', yearLength));
    } else {
      if (dayLength) stats.push(period('Day', dayLength));
      stats.push(radius);
      if (yearLength) stats.push(period('Year', yearLength));
    }
  } else stats.push(radius);

  const hero = stats.filter((stat): stat is Stat => !!stat).slice(0, 4);
  // Bodies without physical data borrow short registry facts so the header is never empty.
  for (const fact of object.metadata.facts ?? []) {
    if (hero.length >= 4) break;
    if (fact.value.length <= 16) hero.push({ label: fact.label, value: fact.value });
  }
  return hero;
}

export type Status = { text: string; tone: 'live' | 'neutral' | 'warning' } | null;

export function statusOf(
  object: TrackedObject,
  options: {
    hasPosition: boolean;
    satellite: SatelliteState | null;
    isSatellite: boolean;
    live: boolean;
  }
): Status {
  if (object.type === 'star') return null;
  const tracking = trackingOf(object);
  if (!options.hasPosition || (options.isSatellite && !options.satellite))
    return { text: 'Position unavailable', tone: 'warning' };
  if (options.isSatellite)
    return options.live
      ? { text: 'Live prediction', tone: 'live' }
      : { text: 'Predicted position', tone: 'neutral' };
  if (tracking.mode === 'Snapshot' && tracking.epoch)
    return { text: `Snapshot from ${tracking.epoch.slice(0, 10)}`, tone: 'neutral' };
  if (object.id === 'moon') return { text: 'Approximate model', tone: 'neutral' };
  return { text: tracking.mode, tone: 'neutral' };
}

/** Plain-language accuracy caveat for the "Data and accuracy" section. */
export function accuracyNote(
  object: TrackedObject,
  options: { hasPosition: boolean; satellite: SatelliteState | null; isSatellite: boolean }
): string {
  const tracking = trackingOf(object);
  if (options.isSatellite && !options.satellite)
    return 'Orbital data is loading or unavailable for this date. Predictions are limited to about 7 days either side of the element epoch, so the view shows Earth instead.';
  if (!options.hasPosition)
    return `Orbiter models are limited to about 30 days either side of their source epoch (${tracking.epoch ?? 'unknown'}), so the view shows the parent world instead.`;
  if (options.satellite)
    return 'SGP4 prediction from published orbital elements. Accuracy degrades with time from the element epoch.';
  if (object.id === 'moon')
    return 'Phase and position come from a truncated lunar model. Good for exploring, not for eclipse timing or precise sky pointing.';
  if (tracking.mode === 'Snapshot')
    return `A fixed position captured on ${tracking.epoch?.slice(0, 10)}. This marker does not move with the simulation clock.`;
  if (tracking.mode === 'Landing site' || tracking.mode === 'Illustration')
    return `${tracking.source}.`;
  if (tracking.epoch)
    return 'Approximate motion from published orbital elements. Accuracy degrades away from the element date.';
  return 'Approximate orbit from published orbital elements, valid from 1800 through 2050.';
}
