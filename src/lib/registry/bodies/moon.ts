import { KM_TO_SCENE, MOON_RADIUS_KM } from '$lib/scene-config';
import { getMoonInertialOffset } from '$utils/moon';
import type { TrackedObject } from '../types';

/**
 * Earth's Moon: true geocentric position from the main periodic terms
 * of Meeus's lunar theory. The 'tidal-lock' rotation model keeps the
 * selenographic prime meridian (local +X) pointed at Earth's center.
 */

export const MOON: TrackedObject = {
  id: 'moon',
  name: 'Moon',
  type: 'moon',
  parent: 'earth',
  offsetFn: (date, target) => getMoonInertialOffset(target, date),
  rendererKind: 'planet-body',
  labelTier: 2,
  metadata: {
    subtitle: "Earth's natural satellite",
    radius: MOON_RADIUS_KM * KM_TO_SCENE,
    radiusKm: MOON_RADIUS_KM,
    textureUrl: '/textures/moon_albedo_2k.webp',
    rotationModel: 'tidal-lock',
    dayLength: '29.53 Earth days',
    yearLength: '27.32 Earth days (sidereal)',
    orbitalPeriodDays: 27.32166,
    description:
      "Earth's only natural satellite and the fifth-largest moon in the solar system. Tidally locked, it always turns the same face toward Earth. Its gravitational pull drives Earth's ocean tides.",
    facts: [
      { label: 'Diameter', value: '3,474.8 km' },
      { label: 'Mass', value: '7.342 × 10²² kg' },
      { label: 'Surface gravity', value: '1.62 m/s²' },
      { label: 'Orbital period', value: '27.32 days (sidereal)' },
      { label: 'Distance from Earth', value: '384,400 km' },
      { label: 'Surface temperature', value: '−173 to 127 °C' },
      { label: 'Age', value: '~4.51 billion years' }
    ],
    sources: [
      {
        name: 'NASA Moon Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html'
      },
      { name: 'LROC', url: 'https://lroc.im-ldi.com/' }
    ]
  }
};
