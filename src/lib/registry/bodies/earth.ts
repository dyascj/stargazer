import { EARTH_OBLIQUITY_RAD, EARTH_RADIUS, EARTH_RADIUS_KM } from '$lib/scene-config';
import { getEarthScenePosition } from '$utils/earth';
import type { TrackedObject } from '../types';

/**
 * Earth — true heliocentric position via the Standish/Meeus ephemeris.
 *
 * Earth's parent is the Sun (at world origin), so "offset from Sun" is
 * exactly Earth's heliocentric position. The Moon and all Earth-orbit
 * satellites have `parent: 'earth'` and the registry's parent walk
 * stacks their offsets onto this one to compose their world position.
 */

export const EARTH: TrackedObject = {
  id: 'earth',
  name: 'Earth',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getEarthScenePosition(target, date),
  rendererKind: 'planet-body',
  cameraDistance: 3,
  labelTier: 1,
  metadata: {
    subtitle: 'Sol III',
    radius: EARTH_RADIUS,
    radiusKm: EARTH_RADIUS_KM,
    textureUrl: '/textures/earth_albedo_2k.webp',
    obliquityRad: EARTH_OBLIQUITY_RAD,
    rotationModel: 'gmst',
    hasAtmosphere: true,
    dayLength: '23h 56m 04s',
    yearLength: '365.25 days',
    orbitColor: 0xe8441e,
    description:
      'Third planet from the Sun. The only known world with liquid surface water, a nitrogen-oxygen atmosphere, and confirmed life. Orbits at 1 AU — the baseline distance used to measure the rest of the solar system.',
    facts: [
      { label: 'Mass', value: '5.972 × 10²⁴ kg' },
      { label: 'Diameter', value: '12,742 km' },
      { label: 'Surface gravity', value: '9.81 m/s²' },
      { label: 'Atmosphere', value: '78% N₂, 21% O₂' },
      { label: 'Axial tilt', value: '23.44°' },
      { label: 'Day length', value: '23h 56m 04s (sidereal)' },
      { label: 'Year length', value: '365.25 days' },
      { label: 'Distance from Sun', value: '1 AU (149.6M km)' }
    ],
    sources: [
      {
        name: 'NASA Planetary Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html'
      },
      { name: 'NASA Earth Observatory', url: 'https://science.nasa.gov/earth/earth-observatory/' }
    ]
  }
};
