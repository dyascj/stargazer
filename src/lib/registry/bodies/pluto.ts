import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { getPlanetScenePosition } from '$utils/helio';
import type { TrackedObject } from '../types';

/**
 * Pluto — dwarf planet, true body radius (0.186 × Earth, ~1188.3 km per NASA
 * Planetary Fact Sheet, smaller
 * than the Moon). True heliocentric position from the JPL simplified
 * Keplerian fit (~39.48 AU mean = ~3948 scene units from the Sun, but
 * Pluto's eccentric orbit takes it between ~30 and ~49 AU).
 *
 * Pluto was reclassified as a dwarf planet in 2006. Charon is tracked separately.
 *
 * Pole orientation from IAU 2018: RA = 132.99°, Dec = -6.16°. Pluto's
 * obliquity is 122.5° — significantly tilted AND retrograde. The IAU
 * pole vector points BELOW the ecliptic in scene coordinates because of
 * the retrograde rotation: scene.y = -0.388.
 */

const PLUTO_RADIUS_KM = 1188.3;

export const PLUTO: TrackedObject = {
  id: 'pluto',
  name: 'Pluto',
  type: 'dwarf-planet',
  parent: 'sun',
  offsetFn: (date, target) => getPlanetScenePosition(target, 'pluto', date),
  rendererKind: 'planet-body',
  cameraDistance: 1,
  labelTier: 1,
  metadata: {
    subtitle: 'Dwarf planet · 134340 Pluto',
    externalId: '999',
    radius: PLUTO_RADIUS_KM / EARTH_RADIUS_KM,
    radiusKm: PLUTO_RADIUS_KM,
    solidColor: '#b89b7a',
    poleVec: [-0.678, -0.3878, -0.6245],
    rotationModel: 'iau-w',
    rotationW0Deg: 302.695,
    rotationRateDegPerDay: -56.3625225,
    dayLength: '6.39 Earth days (retrograde)',
    yearLength: '248.0 Earth years',
    orbitColor: 0x585858,
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
