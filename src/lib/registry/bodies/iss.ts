import { iss } from '$stores/iss';
import { ecfKmToInertialOffset } from '$utils/earth';
import type { TrackedObject } from '../types';

/**
 * International Space Station: CelesTrak elements propagated with SGP4. The
 * Earth-fixed position is rotated into the inertial scene frame; the registry
 * parent walk adds Earth's heliocentric position.
 */

export const ISS: TrackedObject = {
  id: 'iss',
  name: 'International Space Station',
  type: 'earth-satellite',
  parent: 'earth',
  offsetFn: (date, target) => {
    const data = iss.at(date);
    return data ? ecfKmToInertialOffset(data.ecfKm, target, date) : null;
  },
  rendererKind: 'satellite-marker',
  labelTier: 5,
  metadata: {
    subtitle: 'ISS · NORAD 25544',
    externalId: '25544',
    noradId: 25544,
    liveStoreKey: 'iss',
    satelliteCategory: 'space-station',
    tracking: { mode: 'TLE prediction', source: 'CelesTrak orbital elements + SGP4' },
    description:
      "The International Space Station is humanity's largest structure in orbit. A collaboration between NASA, Roscosmos, JAXA, ESA, and CSA. Continuously inhabited since November 2, 2000: the longest unbroken human presence in space.",
    facts: [
      { label: 'Orbital altitude', value: '~408 km' },
      { label: 'Speed', value: '~27,600 km/h' },
      { label: 'Orbital period', value: '~92 minutes' },
      { label: 'Mass', value: '~420,000 kg' },
      { label: 'Pressurized volume', value: '916 m³' },
      { label: 'Crew capacity', value: '6–7' },
      { label: 'First module launched', value: '1998 (Zarya)' },
      { label: 'Orbits per day', value: '~15.5' }
    ],
    sources: [
      {
        name: 'NASA ISS Reference Guide',
        url: 'https://www.nasa.gov/international-space-station/'
      },
      { name: 'wheretheiss.at', url: 'https://wheretheiss.at/' },
      { name: 'Celestrak', url: 'https://celestrak.org/' }
    ]
  }
};
