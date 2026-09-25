import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import { equatorialToScene } from '$utils/frames';
import type { TrackedObject } from '../types';

/**
 * Pluto. IAU 2015 pole convention: the positive pole points below the
 * ecliptic, and the planet spins prograde about it (122.5° obliquity).
 */

const PLUTO_RADIUS_KM = 1188.3;

export const PLUTO: TrackedObject = {
  id: 'pluto',
  name: 'Pluto',
  type: 'dwarf-planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'pluto', date),
  rendererKind: 'planet-body',
  labelTier: 1,
  metadata: {
    subtitle: 'Dwarf planet · 134340 Pluto',
    externalId: '999',
    radius: PLUTO_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: PLUTO_RADIUS_KM,
    solidColor: '#b89b7a',
    poleVec: equatorialToScene(132.993, -6.163),
    rotationModel: 'iau-w',
    rotationW0Deg: 302.695,
    rotationRateDegPerDay: 56.3625225,
    dayLength: '6.39 Earth days (retrograde)',
    yearLength: '248.0 Earth years',
    description:
      "Pluto is a dwarf planet in the Kuiper Belt, reclassified from full planet status in 2006. NASA's New Horizons flyby in 2015 revealed a complex surface with nitrogen ice glaciers, mountains of water ice, and a thin atmosphere.",
    facts: [
      { label: 'Mass', value: '1.303 × 10²² kg' },
      { label: 'Surface gravity', value: '0.62 m/s²' },
      { label: 'Mean temperature', value: '44 K (-229 °C)' },
      { label: 'Atmosphere', value: 'Thin; N₂, CH₄, CO (collapses when farther from Sun)' },
      { label: 'Known moons', value: '5 (Charon, Nix, Hydra, Kerberos, Styx)' },
      { label: 'Magnetic field', value: 'No confirmed field' }
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
