import { MARS_POLE_VEC, MARS_RADIUS, MARS_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import type { TrackedObject } from '../types';

/**
 * Mars — true heliocentric position via the same Standish/Meeus
 * approximate planetary element model. At AU = 100 scene units Mars sits ~152 units from the
 * Sun, well within float32 precision.
 *
 * Pole orientation is the IAU 2018 Mars rotational element vector
 * (RA = 317.68°, Dec = 52.89°) converted to scene Cartesian — applied
 * by PlanetBody via `setFromUnitVectors`. The lit hemisphere matches
 * what you'd see in a real telescope, complete with the correct
 * seasonal lean.
 */

export const MARS: TrackedObject = {
  id: 'mars',
  name: 'Mars',
  type: 'planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'mars', date),
  rendererKind: 'planet-body',
  cameraDistance: 1.6,
  labelTier: 1,
  metadata: {
    subtitle: 'Sol IV · The Red Planet',
    externalId: '499',
    radius: MARS_RADIUS,
    radiusKm: MARS_RADIUS_KM,
    textureUrl: '/textures/mars_albedo_2k.jpg',
    poleVec: MARS_POLE_VEC,
    rotationModel: 'iau-w',
    rotationW0Deg: 176.63,
    rotationRateDegPerDay: 350.89198226,
    dayLength: '24h 39m 35s',
    yearLength: '687 Earth days',
    orbitColor: 0xcc6040,
    description:
      'The fourth planet from the Sun. A cold, dusty desert world with the tallest volcano (Olympus Mons, 21.9 km) and deepest canyon (Valles Marineris, 7 km) in the solar system. Home to two active rovers: Curiosity and Perseverance.',
    facts: [
      { label: 'Diameter', value: '6,779 km' },
      { label: 'Mass', value: '6.39 × 10²³ kg' },
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
