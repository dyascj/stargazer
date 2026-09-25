import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Mercury. Pole and prime meridian from the IAU rotation model; a 3:2
 * spin-orbit resonance makes its solar day last two Mercury years.
 */

const MERCURY_RADIUS_KM = 2439.7;

export const MERCURY: TrackedObject = {
  id: 'mercury',
  name: 'Mercury',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'mercury', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Closest planet to the Sun',
    externalId: '199',
    radius: MERCURY_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: MERCURY_RADIUS_KM,
    textureUrl: '/textures/2k_mercury.jpg',
    poleVec: equatorialToScene(281.0103, 61.4155),
    rotationModel: 'iau-w',
    rotationW0Deg: 329.5469,
    rotationRateDegPerDay: 6.1385025,
    dayLength: '58.65 Earth days',
    yearLength: '87.97 Earth days',
    description:
      'Mercury is the smallest and innermost planet in the solar system, with virtually no atmosphere and extreme temperature swings between day and night. Its surface is heavily cratered and resembles the Moon.',
    facts: [
      { label: 'Mass', value: '3.301 × 10²³ kg' },
      { label: 'Surface gravity', value: '3.7 m/s²' },
      { label: 'Mean temperature', value: '440 K (day) / 100 K (night)' },
      { label: 'Atmosphere', value: 'Trace exosphere (O₂, Na, H₂, He, K)' },
      { label: 'Known moons', value: '0' },
      { label: 'Magnetic field', value: "Yes, weak (~1% of Earth's)" }
    ],
    sources: [
      {
        name: 'NASA Planetary Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
      }
    ],
    tracking: {
      mode: 'Approximate orbit',
      source: 'JPL planetary ephemeris (NASA JPL Approximate Positions)'
    }
  }
};
