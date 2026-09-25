import { KM_TO_SCENE, MARS_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Mars — true heliocentric position via the JPL approximate planetary
 * element model. Pole and prime meridian follow the IAU 2009 Mars rotation
 * model (RA = 317.68°, Dec = 52.89°), so the lit hemisphere shows the
 * correct seasonal lean.
 */

export const MARS: TrackedObject = {
  id: 'mars',
  name: 'Mars',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'mars', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Sol IV · The Red Planet',
    externalId: '499',
    radius: MARS_RADIUS_KM * KM_TO_SCENE,
    radiusKm: MARS_RADIUS_KM,
    textureUrl: '/textures/mars_albedo_2k.jpg',
    poleVec: equatorialToScene(317.68143, 52.8865),
    rotationModel: 'iau-w',
    atmosphere: { color: [0.95, 0.62, 0.42], heightKm: 70, density: 0.3 },
    rotationW0Deg: 176.63,
    rotationRateDegPerDay: 350.89198226,
    dayLength: '24h 39m 35s',
    yearLength: '687 Earth days',
    description:
      'The fourth planet from the Sun. A cold, dusty desert world with the tallest volcano (Olympus Mons, 21.9 km) and deepest canyon (Valles Marineris, 7 km) in the solar system. Home to two active rovers: Curiosity and Perseverance.',
    facts: [
      { label: 'Diameter', value: '6,779 km' },
      { label: 'Mass', value: '6.42 × 10²³ kg' },
      { label: 'Surface gravity', value: '3.72 m/s²' },
      { label: 'Atmosphere', value: '95% CO₂' },
      { label: 'Axial tilt', value: '25.19°' },
      { label: 'Day length', value: '24h 39m 35s (solar day)' },
      { label: 'Year length', value: '687 Earth days' },
      { label: 'Moons', value: '2 (Phobos, Deimos)' }
    ],
    sources: [
      {
        name: 'NASA Mars Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html'
      },
      { name: 'NASA Mars Exploration', url: 'https://mars.nasa.gov/' }
    ]
  }
};
