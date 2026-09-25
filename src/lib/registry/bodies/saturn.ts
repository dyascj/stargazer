import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Saturn. Volumetric mean radius from the NASA fact sheet. The rings lie in
 * the equatorial plane of the IAU pole, 26.7° from its orbit.
 */

const SATURN_RADIUS_KM = 58232;

export const SATURN: TrackedObject = {
  id: 'saturn',
  name: 'Saturn',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'saturn', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Sixth planet from the Sun',
    externalId: '699',
    radius: SATURN_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: SATURN_RADIUS_KM,
    textureUrl: '/textures/2k_saturn.jpg',
    poleVec: equatorialToScene(40.589, 83.537),
    rotationModel: 'iau-w',
    rotationW0Deg: 38.9,
    rotationRateDegPerDay: 810.7939024,
    // Stylized main ring disc: ~74,500 km inner edge to ~140,180 km
    // outer edge of the A ring. In Earth radii (= scene units): 11.69 to
    // 22.00, which puts the inner edge ~28% beyond Saturn's 9.14-radius
    // surface and the outer edge ~2.4 Saturn radii.
    hasRings: {
      innerRadius: 11.69,
      outerRadius: 22.0,
      textureUrl: '/textures/2k_saturn_ring_alpha.png'
    },
    dayLength: '10h 39m',
    yearLength: '29.46 Earth years',
    description:
      'Saturn is best known for its extensive ring system, made primarily of ice particles with some rocky debris and dust. It is the least dense planet in the solar system and would float in water if a basin large enough existed.',
    facts: [
      { label: 'Mass', value: '5.683 × 10²⁶ kg' },
      { label: 'Surface gravity', value: '10.44 m/s²' },
      { label: 'Mean temperature', value: '134 K (cloud tops)' },
      { label: 'Atmosphere', value: '~96% H₂, ~3% He, traces of CH₄, NH₃' },
      {
        label: 'Magnetic field',
        value: 'Nearly aligned with the rotation axis; equatorial strength ~21 μT'
      }
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
