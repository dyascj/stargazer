import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Venus. The IAU north pole lies on the north side of the invariable plane,
 * so its slow retrograde spin is a negative W rate.
 */

const VENUS_RADIUS_KM = 6051.8;

export const VENUS: TrackedObject = {
  id: 'venus',
  name: 'Venus',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'venus', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Second planet from the Sun',
    externalId: '299',
    radius: VENUS_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: VENUS_RADIUS_KM,
    textureUrl: '/textures/2k_venus_atmosphere.jpg',
    poleVec: equatorialToScene(272.76, 67.16),
    rotationModel: 'iau-w',
    rotationW0Deg: 160.2,
    rotationRateDegPerDay: -1.4813688,
    atmosphere: { color: [1.0, 0.86, 0.6], heightKm: 250, density: 1.1 },
    dayLength: '243 Earth days (retrograde)',
    yearLength: '224.7 Earth days',
    description:
      'Venus is the hottest planet in the solar system due to a runaway greenhouse effect, with surface temperatures high enough to melt lead. It rotates backward compared to most planets, and its thick clouds of sulfuric acid completely obscure the surface.',
    facts: [
      { label: 'Mass', value: '4.867 × 10²⁴ kg' },
      { label: 'Surface gravity', value: '8.87 m/s²' },
      { label: 'Mean temperature', value: '737 K (464 °C)' },
      { label: 'Atmosphere', value: '96.5% CO₂, 3.5% N₂' },
      { label: 'Known moons', value: '0' },
      {
        label: 'Magnetic field',
        value: 'No intrinsic field; induced magnetosphere from solar wind interaction'
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
