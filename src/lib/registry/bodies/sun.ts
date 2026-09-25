import { SUN_RADIUS_KM } from '$lib/scene-config';
import type { TrackedObject } from '../types';

/**
 * The Sun. Sits at the world origin (it's the heliocentric anchor),
 * so its `offsetFn` writes (0, 0, 0) into the target. Rendered with
 * the special `'star'` renderer kind because it's a corona shell, not
 * a texture-mapped sphere like the planets.
 */

export const SUN: TrackedObject = {
  id: 'sun',
  name: 'Sun',
  type: 'star',
  parent: null,
  offsetFn: (_date, target) => target.set(0, 0, 0),
  rendererKind: 'star',
  labelTier: 1,
  metadata: {
    subtitle: 'Sol',
    radiusKm: SUN_RADIUS_KM,
    description:
      "The Sun is a G-type main-sequence star containing 99.86% of the solar system's total mass. It fuses roughly 600 million tons of hydrogen into helium every second, producing the energy that drives nearly all life on Earth.",
    facts: [
      { label: 'Mass', value: '1.989 × 10³⁰ kg' },
      { label: 'Surface temperature', value: '5,772 K' },
      { label: 'Core temperature', value: '~1.57 × 10⁷ K' },
      { label: 'Spectral class', value: 'G2V' },
      { label: 'Age', value: '~4.6 billion years' },
      { label: 'Composition', value: '~73% hydrogen, ~25% helium by mass' }
    ],
    sources: [
      {
        name: 'NASA Sun Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html'
      }
    ],
    tracking: { mode: 'Live', source: 'Fixed at heliocentric origin' }
  }
};
