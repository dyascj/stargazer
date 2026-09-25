import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Neptune. Volumetric mean radius from the NASA fact sheet; pole and prime
 * meridian from the IAU rotation model, without its small periodic terms.
 */

const NEPTUNE_RADIUS_KM = 24622;

export const NEPTUNE: TrackedObject = {
  id: 'neptune',
  name: 'Neptune',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'neptune', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Eighth planet from the Sun',
    externalId: '899',
    radius: NEPTUNE_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: NEPTUNE_RADIUS_KM,
    textureUrl: '/textures/2k_neptune.jpg',
    poleVec: equatorialToScene(299.36, 43.46),
    rotationModel: 'iau-w',
    rotationW0Deg: 253.18,
    rotationRateDegPerDay: 536.3128492,
    dayLength: '16h 6m',
    yearLength: '164.79 Earth years',
    description:
      'Neptune is the most distant planet from the Sun and has the strongest sustained winds in the solar system, reaching over 2,000 km/h. It was the first planet discovered through mathematical prediction rather than direct observation.',
    facts: [
      { label: 'Mass', value: '1.024 × 10²⁶ kg' },
      { label: 'Surface gravity', value: '11.15 m/s²' },
      { label: 'Mean temperature', value: '72 K (cloud tops)' },
      { label: 'Atmosphere', value: '~80% H₂, ~19% He, ~1.5% CH₄' },
      { label: 'Magnetic field', value: 'Yes, tilted 47° from rotation axis, offset from center' }
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
