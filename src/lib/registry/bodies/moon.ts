import { MOON_RADIUS, MOON_RADIUS_KM } from '$lib/scene-config';
import { getMoonInertialOffset } from '$utils/moon';
import type { TrackedObject } from '../types';

/**
 * Earth's Moon — geocentric ecliptic position via Meeus's lunar
 * formulas, distance compressed by `MOON_DISTANCE_SCALE` to fit the
 * heliocentric scale (the true 384,400 km is reported in the info
 * panel — see `feedback_stargazer_science_first.md`).
 *
 * `parent: 'earth'`, so the registry's parent walk adds Earth's
 * heliocentric position to this offset to get the Moon's world
 * position. This means the Moon naturally tracks Earth around the
 * Sun without any manual translation logic in the renderer.
 *
 * Tidal lock is handled by the `'tidal-lock'` rotation model in
 * PlanetBody.svelte — the body's local +X (selenographic prime
 * meridian) always points back toward Earth's center.
 */

export const MOON: TrackedObject = {
  id: 'moon',
  name: 'Moon',
  type: 'moon',
  parent: 'earth',
  offsetFn: (date, target) => getMoonInertialOffset(target, date),
  rendererKind: 'planet-body',
  cameraDistance: 0.7,
  labelTier: 2,
  metadata: {
    subtitle: "Earth's natural satellite",
    radius: MOON_RADIUS,
    radiusKm: MOON_RADIUS_KM,
    textureUrl: '/textures/moon_albedo_2k.webp',
    rotationModel: 'tidal-lock',
    lightingFromParent: true,
    dayLength: '29.53 Earth days',
    yearLength: '27.32 Earth days (sidereal)',
    orbitalPeriodDays: 27.32166,
    description:
      "Earth's only natural satellite and the fifth-largest moon in the solar system. Tidally locked — the same face always points toward Earth. Its gravitational pull drives Earth's ocean tides.",
    facts: [
      { label: 'Diameter', value: '3,474.8 km' },
      { label: 'Mass', value: '7.342 × 10²² kg' },
      { label: 'Surface gravity', value: '1.62 m/s²' },
      { label: 'Orbital period', value: '27.32 days (sidereal)' },
      { label: 'Distance from Earth', value: '384,400 km' },
      { label: 'Surface temp', value: '−173 to 127 °C' },
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
