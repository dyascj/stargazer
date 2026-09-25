import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Uranus — ice giant, volumetric mean radius (3.98 × Earth, ~25,362 km per NASA
 * Planetary Fact Sheet). True
 * heliocentric position from the Standish ephemeris (~19.19 AU from the Sun).
 *
 * Pole orientation from IAU 2018: RA = 257.31°, Dec = -15.18°. Uranus's
 * obliquity is 97.77° — its rotation axis lies almost in its orbital
 * plane, so Uranus is "rolling" along its orbit. The IAU pole vector
 * captures this directly: in scene coordinates the pole is at
 * (-0.21, 0.13, 0.97), tilted 82° from ecliptic north — visible in
 * the static body orientation as a planet rotated almost on its side.
 */

const URANUS_RADIUS_KM = 25362;

export const URANUS: TrackedObject = {
  id: 'uranus',
  name: 'Uranus',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'uranus', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Sol VII · The Tilted Ice Giant',
    externalId: '799',
    radius: URANUS_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: URANUS_RADIUS_KM,
    textureUrl: '/textures/2k_uranus.jpg',
    poleVec: equatorialToScene(257.311, -15.175),
    rotationModel: 'iau-w',
    rotationW0Deg: 203.81,
    rotationRateDegPerDay: -501.1600928,
    dayLength: '17h 14m (retrograde)',
    yearLength: '84.01 Earth years',
    description:
      'Uranus is an ice giant tilted nearly 98 degrees on its side, likely from an ancient collision with an Earth-sized object. Its blue-green color comes from methane in the atmosphere absorbing red wavelengths of sunlight.',
    facts: [
      { label: 'Mass', value: '8.681 × 10²⁵ kg' },
      { label: 'Surface gravity', value: '8.87 m/s²' },
      { label: 'Mean temperature', value: '76 K (cloud tops)' },
      { label: 'Atmosphere', value: '~83% H₂, ~15% He, ~2% CH₄' },
      { label: 'Magnetic field', value: 'Yes, tilted 59° from rotation axis, offset from center' }
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
