import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Jupiter — largest planet, true scale (volumetric mean radius 10.97 × Earth,
 * ~69,911 km per NASA Planetary Fact Sheet). True heliocentric position via the
 * Standish ephemeris (~5.2 AU from the Sun).
 *
 * Pole orientation from IAU 2018: RA = 268.057°, Dec = 64.495°. Obliquity just 3.13°,
 * so the pole sits very close to the orbital normal. Galilean moons tracked separately.
 */

const JUPITER_RADIUS_KM = 69911;

export const JUPITER: TrackedObject = {
  id: 'jupiter',
  name: 'Jupiter',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'jupiter', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Sol V · The Gas Giant',
    externalId: '599',
    radius: JUPITER_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: JUPITER_RADIUS_KM,
    textureUrl: '/textures/2k_jupiter.jpg',
    poleVec: equatorialToScene(268.056595, 64.495303),
    rotationModel: 'iau-w',
    rotationW0Deg: 284.95,
    rotationRateDegPerDay: 870.536,
    dayLength: '9h 55m',
    yearLength: '11.86 Earth years',
    description:
      'Jupiter is the largest planet in the solar system, containing more mass than all other planets combined. Its Great Red Spot is a persistent anticyclonic storm larger than Earth that has been observed for over 350 years.',
    facts: [
      { label: 'Mass', value: '1.898 × 10²⁷ kg' },
      { label: 'Surface gravity', value: '24.79 m/s²' },
      { label: 'Mean temperature', value: '165 K (cloud tops)' },
      { label: 'Atmosphere', value: '~90% H₂, ~10% He, traces of CH₄, NH₃, H₂O' },
      { label: 'Magnetic field', value: "Yes, strongest in the solar system (~20,000× Earth's)" }
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
