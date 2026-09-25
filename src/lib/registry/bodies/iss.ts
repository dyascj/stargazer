import { Vector3 } from 'three';
import { iss } from '$stores/iss';
import { latLonAltToVec3 } from '$utils/coords';
import { earthLocalToInertialOffset } from '$utils/earth';
import { EARTH_RADIUS, EARTH_RADIUS_KM } from '$lib/scene-config';
import type { TrackedObject } from '../types';

/**
 * International Space Station — live position polled from
 * wheretheiss.at at 1 Hz.
 *
 * Position pipeline:
 *   1. Read latest lat/lon/alt from the iss store. Return null if no
 *      data yet (cold start) — the renderer skips bodies that return
 *      null for the current frame.
 *   2. lat/lon/alt → local Earth-fixed Cartesian via latLonAltToVec3.
 *   3. earthLocalToInertialOffset → applies Earth's combined
 *      `R_x(-obliquity) · R_y(GMST)` transform, giving the body's
 *      inertial offset from Earth's center.
 *
 * The registry's parent walk then adds Earth's heliocentric position
 * to compose the world position.
 */

const _localTmp = new Vector3();

export const ISS: TrackedObject = {
  id: 'iss',
  name: 'International Space Station',
  type: 'earth-satellite',
  parent: 'earth',
  offsetFn: (date, target) => {
    const data = iss.at(date);
    if (!data) return null;
    const [x, y, z] = latLonAltToVec3(
      data.latitude,
      data.longitude,
      data.altitudeKm,
      EARTH_RADIUS,
      EARTH_RADIUS_KM
    );
    _localTmp.set(x, y, z);
    return earthLocalToInertialOffset(_localTmp, target, date);
  },
  rendererKind: 'satellite-marker',
  cameraDistance: 2,
  labelTier: 5,
  metadata: {
    subtitle: 'ISS · NORAD 25544',
    externalId: '25544',
    noradId: 25544,
    liveStoreKey: 'iss',
    satelliteCategory: 'space-station',
    tracking: { mode: 'TLE prediction', source: 'CelesTrak orbital elements + SGP4' },
    description:
      "The International Space Station — humanity's largest structure in orbit. A collaboration between NASA, Roscosmos, JAXA, ESA, and CSA. Continuously inhabited since November 2, 2000 — the longest unbroken human presence in space.",
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
