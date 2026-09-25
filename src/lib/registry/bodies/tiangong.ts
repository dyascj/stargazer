import { tiangong } from '$stores/tiangong';
import { ecfKmToInertialOffset } from '$utils/earth';
import type { TrackedObject } from '../types';

/** Tiangong space station: CelesTrak elements propagated with SGP4, like the ISS. */

export const TIANGONG: TrackedObject = {
  id: 'tiangong',
  name: 'Tiangong',
  type: 'earth-satellite',
  parent: 'earth',
  offsetFn: (date, target) => {
    const data = tiangong.at(date);
    return data ? ecfKmToInertialOffset(data.ecfKm, target, date) : null;
  },
  rendererKind: 'satellite-marker',
  labelTier: 5,
  metadata: {
    subtitle: 'CSS · NORAD 48274',
    externalId: '48274',
    tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
    description:
      "China's modular space station, operational since 2022. Built from three modules: the Tianhe core, Wentian laboratory, and Mengtian experiment module. Supports a permanent crew of three taikonauts.",
    facts: [
      { label: 'Orbital altitude', value: '~390 km' },
      { label: 'Mass', value: '~66,000 kg (three-module)' },
      { label: 'Modules', value: '3 (Tianhe, Wentian, Mengtian)' },
      { label: 'Crew capacity', value: '3 (up to 6 during handover)' },
      { label: 'Core module launched', value: 'April 29, 2021' },
      { label: 'Orbit type', value: 'LEO, 41.5° inclination' }
    ],
    sources: [
      { name: 'CMSA', url: 'http://www.cmsa.gov.cn/' },
      { name: 'Celestrak TLE', url: 'https://celestrak.org/NORAD/elements/gp.php?CATNR=48274' }
    ]
  }
};
