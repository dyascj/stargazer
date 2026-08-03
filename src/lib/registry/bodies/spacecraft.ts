import { Vector3 } from 'three';
import { EARTH_RADIUS_KM } from '$lib/scene-config';
import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import { planetSurfaceToInertialOffset } from '$utils/planetSurface';
import { getById } from '../registry';
import type { TrackedObject } from '../types';

/**
 * Active spacecraft and surface landers. Positions from JPL HORIZONS at epoch 2026-04-08.
 * Planet orbiters use live Keplerian propagation; en-route and outer-solar-system
 * spacecraft use static snapshots (their motion is negligible at visualization timescales).
 */

// ── Helpers ─────────────────────────────────────────────────────────────

function spacecraftPointMarker(opts: {
  id: string;
  name: string;
  parent: string | null;
  type: 'spacecraft' | 'lander';
  subtitle?: string;
  externalId?: string;
  color: string;
  cameraDistance: number;
  labelTier?: number;
  description?: string;
  facts?: { label: string; value: string }[];
  sources?: { name: string; url: string }[];
  tracking?: { mode: string; source: string; epoch?: string };
  offsetFn: TrackedObject['offsetFn'];
}): TrackedObject {
  return {
    id: opts.id,
    name: opts.name,
    type: opts.type,
    parent: opts.parent,
    offsetFn: opts.offsetFn,
    rendererKind: 'point-marker',
    cameraDistance: opts.cameraDistance,
    labelTier: opts.labelTier ?? 4,
    metadata: {
      subtitle: opts.subtitle,
      externalId: opts.externalId,
      description: opts.description,
      facts: opts.facts,
      sources: opts.sources,
      tracking: opts.tracking,
      color: opts.color,
      pixelSize: 11
    }
  };
}

/** Wraps a static scene-frame Cartesian position in an offsetFn. */
function staticOffset(scenePos: [number, number, number]): TrackedObject['offsetFn'] {
  return (_date, target) => target.set(scenePos[0], scenePos[1], scenePos[2]);
}

/**
 * Convert HORIZONS heliocentric ECLIPTIC J2000 Cartesian (in AU) to
 * scene-frame Cartesian (in scene units = Earth radii). Used for the
 * static spacecraft snapshots fetched from HORIZONS.
 *
 * helio.ts maps ecliptic axes (x, y, z) → scene axes (x, z, -y), with
 * AU_TO_SCENE = 100 (1 AU = 100 scene units). This helper applies both
 * transformations so each entry can paste the raw HORIZONS X/Y/Z values.
 */
function helioAuToScene(
  ecl_x_au: number,
  ecl_y_au: number,
  ecl_z_au: number
): [number, number, number] {
  return [ecl_x_au * 100, ecl_z_au * 100, -ecl_y_au * 100];
}

/** Build a planet-orbiter offsetFn via the moon Keplerian helper. */
function orbiterOffset(elements: MoonOrbitalElements): TrackedObject['offsetFn'] {
  return (date, target) => computeMoonOffset(elements, date, target);
}

/** Build a surface-lander offsetFn via the planet surface helper. */
function landerOffset(
  parentId: string,
  latDeg: number,
  lonDeg: number,
  altKm = 0
): TrackedObject['offsetFn'] {
  return (date, target) =>
    planetSurfaceToInertialOffset(parentId, latDeg, lonDeg, altKm, date, target);
}

/**
 * Earth-Sun L2 offset from Earth's center: ~1.5 million km in the
 * anti-Sun direction. Computed each frame from Earth's current
 * heliocentric position.
 */
const L2_DISTANCE_KM = 1_500_000;
const L2_DISTANCE_SCENE = L2_DISTANCE_KM / EARTH_RADIUS_KM;
function l2Offset(): TrackedObject['offsetFn'] {
  return (date, target) => {
    const earth = getById('earth');
    if (!earth) return null;
    const earthPos = earth.offsetFn(date, _l2Tmp);
    if (!earthPos) return null;
    const len = earthPos.length();
    if (len === 0) return null;
    const k = L2_DISTANCE_SCENE / len;
    return target.set(earthPos.x * k, earthPos.y * k, earthPos.z * k);
  };
}
const _l2Tmp = new Vector3();

// Wave-3 element epoch — All Keplerian element sets below use this
// epoch for their reference mean anomaly.
const EPOCH_JD = 2461256; // JD TDB at 2026-08-03 00:00 UTC
// MAVEN's HORIZONS ephemeris extends only to 2026-03-01, so its element
// set is captured at that earlier epoch. Forward propagation handles the
// difference automatically via the period.
const MAVEN_EPOCH_JD = 2461100.5;

// ── Mars orbiters (real Keplerian elements from JPL HORIZONS) ───────────

const MRO = spacecraftPointMarker({
  id: 'mro',
  name: 'Mars Reconnaissance Orbiter',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'NASA · In orbit since 2006',
  externalId: '-74',
  color: '#E8441E',
  cameraDistance: 1.0,
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'MRO studies Mars from orbit with the most powerful camera ever sent to another planet. It has returned more data about Mars than all other orbital missions combined.',
  facts: [
    { label: 'Launch Date', value: 'Aug 12, 2005' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'High-resolution imaging and climate monitoring of Mars' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/' }
  ],
  offsetFn: orbiterOffset({
    parentId: 'mars',
    a_km: 3660.697,
    e: 0.008500,
    i_deg: 66.28611,
    Omega_deg: 272.7152,
    omega_deg: 261.0741,
    M_deg: 129.0264,
    period_days: 0.077830,
    epoch_jd: EPOCH_JD
  })
});

const MAVEN = spacecraftPointMarker({
  id: 'maven',
  name: 'MAVEN',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'NASA · Mars Atmosphere & Volatile Evolution',
  externalId: '-202',
  color: '#8A8A85',
  cameraDistance: 1.2,
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'MAVEN studies how Mars lost its atmosphere and water over billions of years by measuring the current rate of atmospheric escape. It also serves as a telecommunications relay for surface rovers.',
  facts: [
    { label: 'Launch Date', value: 'Nov 18, 2013' },
    { label: 'Agency', value: 'NASA/GSFC' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'Study Mars upper atmosphere and atmospheric loss' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/maven/' }
  ],
  offsetFn: orbiterOffset({
    parentId: 'mars',
    a_km: 5737.515,
    e: 0.370304,
    i_deg: 71.55677,
    Omega_deg: 349.7404,
    omega_deg: 26.8032,
    M_deg: 117.7429,
    period_days: 0.152717,
    epoch_jd: MAVEN_EPOCH_JD
  })
});

const MARS_EXPRESS = spacecraftPointMarker({
  id: 'mars-express',
  name: 'Mars Express',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'ESA · In orbit since 2003',
  externalId: '-41',
  color: '#787878',
  cameraDistance: 1.4,
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Mars Express is ESA\'s first planetary mission, studying the Martian surface, subsurface, and atmosphere. Its MARSIS radar confirmed the presence of subsurface water ice deposits.',
  facts: [
    { label: 'Launch Date', value: 'Jun 2, 2003' },
    { label: 'Agency', value: 'ESA' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'Global imaging and subsurface radar of Mars' }
  ],
  sources: [
    { name: 'ESA Mission Page', url: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express' }
  ],
  offsetFn: orbiterOffset({
    parentId: 'mars',
    a_km: 8822.824,
    e: 0.569122,
    i_deg: 113.53311,
    Omega_deg: 92.6461,
    omega_deg: 128.3082,
    M_deg: 324.3349,
    period_days: 0.291214,
    epoch_jd: EPOCH_JD
  })
});

const TGO = spacecraftPointMarker({
  id: 'tgo',
  name: 'ExoMars TGO',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'ESA / Roscosmos · Trace Gas Orbiter',
  externalId: '-143',
  color: '#787878',
  cameraDistance: 1.0,
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'The Trace Gas Orbiter searches for methane and other trace gases in the Martian atmosphere that could indicate biological or geological activity. It also serves as a data relay for surface missions.',
  facts: [
    { label: 'Launch Date', value: 'Mar 14, 2016' },
    { label: 'Agency', value: 'ESA / Roscosmos' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Detect trace gases and relay surface data' }
  ],
  sources: [
    { name: 'ESA Mission Page', url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars' }
  ],
  offsetFn: orbiterOffset({
    parentId: 'mars',
    a_km: 3791.724,
    e: 0.007560,
    i_deg: 52.88982,
    Omega_deg: 228.6128,
    omega_deg: 294.4475,
    M_deg: 76.0513,
    period_days: 0.082046,
    epoch_jd: EPOCH_JD
  })
});

// ── Mars surface landers ────────────────────────────────────────────────

const CURIOSITY = spacecraftPointMarker({
  id: 'curiosity',
  name: 'Curiosity',
  type: 'lander',
  parent: 'mars',
  subtitle: 'NASA · MSL rover, Gale crater, since 2012',
  externalId: '-76',
  color: '#E8441E',
  cameraDistance: 0.6,
  labelTier: 5,
  tracking: { mode: 'Live', source: 'Published landing coordinates + IAU Mars rotation model' },
  description:
    'Curiosity is a car-sized rover exploring Gale crater on Mars. It confirmed that Mars once had conditions suitable for microbial life, including liquid water and key chemical ingredients.',
  facts: [
    { label: 'Launch Date', value: 'Nov 26, 2011' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'Assess past habitability of Gale crater' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/msl-curiosity/' }
  ],
  offsetFn: landerOffset('mars', -4.59, 137.44)
});

const PERSEVERANCE = spacecraftPointMarker({
  id: 'perseverance',
  name: 'Perseverance',
  type: 'lander',
  parent: 'mars',
  subtitle: 'NASA · Mars 2020 rover, Jezero crater, since 2021',
  externalId: '-168',
  color: '#CC6040',
  cameraDistance: 0.6,
  labelTier: 5,
  tracking: { mode: 'Live', source: 'Published landing coordinates + IAU Mars rotation model' },
  description:
    'Perseverance searches for signs of ancient microbial life in Jezero crater, an ancient lake bed. It is collecting rock samples for future return to Earth and deployed the Ingenuity helicopter.',
  facts: [
    { label: 'Launch Date', value: 'Jul 30, 2020' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Seek biosignatures and cache samples for return' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/' }
  ],
  offsetFn: landerOffset('mars', 18.44, 77.45)
});

// ── Jupiter orbiter (real elements: e ≈ 0.97 polar orbit) ───────────────

const JUNO = spacecraftPointMarker({
  id: 'juno',
  name: 'Juno',
  type: 'spacecraft',
  parent: 'jupiter',
  subtitle: 'NASA · Highly elliptical polar orbit since 2016',
  externalId: '-61',
  color: '#A09A90',
  cameraDistance: 30,
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Juno orbits Jupiter in a highly elliptical polar orbit, studying the planet\'s interior structure, magnetic field, and atmosphere. It has revealed detailed views of Jupiter\'s polar cyclones and deep atmospheric dynamics.',
  facts: [
    { label: 'Launch Date', value: 'Aug 5, 2011' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'Study Jupiter\'s interior, magnetosphere, and atmosphere' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/juno/' }
  ],
  offsetFn: orbiterOffset({
    parentId: 'jupiter',
    a_km: 2949379.04,
    e: 0.973308,
    i_deg: 100.27105,
    Omega_deg: 292.4206,
    omega_deg: 105.5037,
    M_deg: 314.6941,
    period_days: 32.726291,
    epoch_jd: EPOCH_JD
  })
});

// ── Earth-Sun L2 ────────────────────────────────────────────────────────

const JWST = spacecraftPointMarker({
  id: 'jwst',
  name: 'James Webb Space Telescope',
  type: 'spacecraft',
  parent: 'earth',
  subtitle: 'NASA / ESA / CSA · Earth-Sun L2 halo orbit, since 2022',
  externalId: '-170',
  color: '#E8441E',
  cameraDistance: 4,
  labelTier: 3,
  tracking: { mode: 'Live', source: 'Earth-Sun L2 offset recomputed from Earth ephemeris each frame' },
  description:
    'JWST is the largest and most powerful space telescope ever launched, observing the universe in infrared from the Earth-Sun L2 point. It studies the earliest galaxies, exoplanet atmospheres, and star formation.',
  facts: [
    { label: 'Launch Date', value: 'Dec 25, 2021' },
    { label: 'Agency', value: 'NASA / ESA / CSA' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Infrared astronomy from first galaxies to exoplanets' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/webb/' }
  ],
  offsetFn: l2Offset()
});

// ── Heliocentric snapshots from JPL HORIZONS at JD 2461138.5 ────────────
// Each call to helioAuToScene takes the raw ECLIPTIC J2000 Cartesian
// (X, Y, Z in AU) returned by HORIZONS and maps it to scene-frame
// Cartesian via (x, z, -y) × AU_TO_SCENE.

const PARKER = spacecraftPointMarker({
  id: 'parker-solar-probe',
  name: 'Parker Solar Probe',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · Closest spacecraft to the Sun in history',
  externalId: '-96',
  color: '#E8441E',
  cameraDistance: 5,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'Parker Solar Probe flies closer to the Sun than any previous spacecraft, diving through the solar corona to study the solar wind and magnetic fields. It has broken speed records, becoming the fastest human-made object.',
  facts: [
    { label: 'Launch Date', value: 'Aug 12, 2018' },
    { label: 'Agency', value: 'NASA/APL' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Study the solar corona and solar wind up close' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/parker-solar-probe/' }
  ],
  offsetFn: staticOffset(helioAuToScene(0.61169183, -0.32688626, -0.03976949))
});

const SOLAR_ORBITER = spacecraftPointMarker({
  id: 'solar-orbiter',
  name: 'Solar Orbiter',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'ESA / NASA · Heliocentric, observing the Sun\'s poles',
  externalId: '-144',
  color: '#E8441E',
  cameraDistance: 5,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'Solar Orbiter uses gravity assists from Venus to tilt its orbit and obtain the first direct images of the Sun\'s polar regions. It carries ten instruments studying the heliosphere and solar wind.',
  facts: [
    { label: 'Launch Date', value: 'Feb 10, 2020' },
    { label: 'Agency', value: 'ESA / NASA' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Image the Sun\'s poles and study the heliosphere' }
  ],
  sources: [
    { name: 'ESA Mission Page', url: 'https://www.esa.int/Science_Exploration/Space_Science/Solar_Orbiter' }
  ],
  offsetFn: staticOffset(helioAuToScene(-0.43337082, 0.00280751, -0.05876495))
});

const BEPI = spacecraftPointMarker({
  id: 'bepicolombo',
  name: 'BepiColombo',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'ESA / JAXA · En route to Mercury orbit',
  externalId: '-121',
  color: '#8A8A85',
  cameraDistance: 5,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'BepiColombo is a joint ESA/JAXA mission carrying two orbiters to Mercury. It uses nine gravity assists (Earth, Venus, and Mercury flybys) to slow down enough to enter Mercury orbit in late 2025.',
  facts: [
    { label: 'Launch Date', value: 'Oct 20, 2018' },
    { label: 'Agency', value: 'ESA / JAXA' },
    { label: 'Status', value: 'En route (Mercury orbit insertion 2025)' },
    { label: 'Objective', value: 'Study Mercury\'s surface, interior, and magnetosphere' }
  ],
  sources: [
    { name: 'ESA Mission Page', url: 'https://www.esa.int/Science_Exploration/Space_Science/BepiColombo' }
  ],
  offsetFn: staticOffset(helioAuToScene(0.30786158, 0.13645044, -0.01707955))
});

const LUCY = spacecraftPointMarker({
  id: 'lucy',
  name: 'Lucy',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · En route to the Jupiter Trojans',
  externalId: '-49',
  color: '#8A8A85',
  cameraDistance: 8,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'Lucy is the first mission to explore the Jupiter Trojan asteroids, primitive bodies trapped in Jupiter\'s orbit that are thought to be remnants of the early solar system. It will visit eight asteroids over 12 years.',
  facts: [
    { label: 'Launch Date', value: 'Oct 16, 2021' },
    { label: 'Agency', value: 'NASA/GSFC' },
    { label: 'Status', value: 'En route' },
    { label: 'Objective', value: 'Fly by Jupiter Trojan asteroids to study solar system origins' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/lucy/' }
  ],
  offsetFn: staticOffset(helioAuToScene(-3.73570856, -3.13789775, -0.24842407))
});

const PSYCHE = spacecraftPointMarker({
  id: 'psyche',
  name: 'Psyche',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · En route to the metal asteroid 16 Psyche',
  externalId: '-255',
  color: '#787878',
  cameraDistance: 8,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'The Psyche mission is traveling to asteroid 16 Psyche, a metal-rich body that may be the exposed core of an early planetesimal. It will be the first mission to explore a world made largely of metal.',
  facts: [
    { label: 'Launch Date', value: 'Oct 13, 2023' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'En route (arrival Aug 2029)' },
    { label: 'Objective', value: 'Study a metal asteroid to understand planetary cores' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/psyche/' }
  ],
  offsetFn: staticOffset(helioAuToScene(0.69947559, 1.29476568, -0.06669979))
});

const JUICE = spacecraftPointMarker({
  id: 'juice',
  name: 'JUICE',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'ESA · Jupiter Icy Moons Explorer, en route',
  externalId: '-28',
  color: '#787878',
  cameraDistance: 8,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'JUICE (Jupiter Icy Moons Explorer) will study Jupiter\'s three large ocean-bearing moons: Ganymede, Callisto, and Europa. It will ultimately enter orbit around Ganymede, the first spacecraft to orbit a moon other than our own.',
  facts: [
    { label: 'Launch Date', value: 'Apr 14, 2023' },
    { label: 'Agency', value: 'ESA' },
    { label: 'Status', value: 'En route (arrival Jul 2031)' },
    { label: 'Objective', value: 'Characterize Jupiter\'s icy moons and their oceans' }
  ],
  sources: [
    { name: 'ESA Mission Page', url: 'https://www.esa.int/Science_Exploration/Space_Science/Juice' }
  ],
  offsetFn: staticOffset(helioAuToScene(1.08265343, -0.76910301, -0.00239123))
});

const EUROPA_CLIPPER = spacecraftPointMarker({
  id: 'europa-clipper',
  name: 'Europa Clipper',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · En route to Jupiter system, arrival 2030',
  externalId: '-159',
  color: '#A09A90',
  cameraDistance: 8,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'Europa Clipper will perform nearly 50 close flybys of Jupiter\'s moon Europa to investigate whether its subsurface ocean has conditions suitable for life. It is the largest spacecraft NASA has ever built for a planetary mission.',
  facts: [
    { label: 'Launch Date', value: 'Oct 14, 2024' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'En route (arrival Apr 2030)' },
    { label: 'Objective', value: 'Assess Europa\'s habitability and subsurface ocean' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/europa-clipper/' }
  ],
  offsetFn: staticOffset(helioAuToScene(0.24439382, -1.24181758, -0.02240865))
});

// ── Interstellar / outer solar system ───────────────────────────────────
// Real heliocentric positions from JPL HORIZONS. Distances:
//   Voyager 1   ~170 AU (-31.95, -135.44, +97.99 AU ecliptic)
//   Voyager 2   ~141 AU (+39.46, -104.51, -88.55 AU ecliptic)
//   New Horizons ~64 AU (+20.31, -61.01, +2.24 AU ecliptic)

const VOYAGER_1 = spacecraftPointMarker({
  id: 'voyager-1',
  name: 'Voyager 1',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · Farthest human-made object, in interstellar space since 2012',
  externalId: '-31',
  color: '#E8441E',
  cameraDistance: 50,
  labelTier: 2,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'Voyager 1 is the farthest human-made object from Earth, now traveling through interstellar space beyond the heliopause. Launched in 1977, it flew by Jupiter and Saturn before heading out of the solar system.',
  facts: [
    { label: 'Launch Date', value: 'Sep 5, 1977' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (interstellar space)' },
    { label: 'Objective', value: 'Fly by outer planets and explore interstellar space' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/voyager/' }
  ],
  offsetFn: staticOffset(helioAuToScene(-32.09307734, -136.36471744, 98.66303457))
});

const VOYAGER_2 = spacecraftPointMarker({
  id: 'voyager-2',
  name: 'Voyager 2',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · In interstellar space since 2018',
  externalId: '-32',
  color: '#8A8A85',
  cameraDistance: 50,
  labelTier: 2,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'Voyager 2 is the only spacecraft to have visited all four giant planets: Jupiter, Saturn, Uranus, and Neptune. It crossed the heliopause in 2018 and continues to return data from interstellar space.',
  facts: [
    { label: 'Launch Date', value: 'Aug 20, 1977' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (interstellar space)' },
    { label: 'Objective', value: 'Grand tour of outer planets, now interstellar exploration' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/voyager/' }
  ],
  offsetFn: staticOffset(helioAuToScene(39.74825278, -105.14876506, -89.32094213))
});

const NEW_HORIZONS = spacecraftPointMarker({
  id: 'new-horizons',
  name: 'New Horizons',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · Past Pluto, into the Kuiper belt, since 2015',
  externalId: '-98',
  color: '#A09A90',
  cameraDistance: 30,
  labelTier: 3,
  tracking: { mode: 'Snapshot', source: 'JPL HORIZONS heliocentric ecliptic Cartesian', epoch: 'Aug 3, 2026' },
  description:
    'New Horizons performed the first flyby of Pluto in 2015, revealing a geologically active world with nitrogen glaciers and a thin atmosphere. It later flew by Kuiper Belt object Arrokoth, the most distant object ever visited.',
  facts: [
    { label: 'Launch Date', value: 'Jan 19, 2006' },
    { label: 'Agency', value: 'NASA/APL' },
    { label: 'Status', value: 'Active (extended mission, Kuiper Belt)' },
    { label: 'Objective', value: 'Explore Pluto and Kuiper Belt objects' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/new-horizons/' }
  ],
  offsetFn: staticOffset(helioAuToScene(20.66780923, -61.85377646, 2.27390870))
});

// ── Aggregate export ────────────────────────────────────────────────────

export const SPACECRAFT: TrackedObject[] = [
  // Mars system
  MRO,
  MAVEN,
  MARS_EXPRESS,
  TGO,
  CURIOSITY,
  PERSEVERANCE,
  // Jupiter system
  JUNO,
  // Earth-Sun L2
  JWST,
  // Heliocentric snapshots from HORIZONS
  PARKER,
  SOLAR_ORBITER,
  BEPI,
  LUCY,
  PSYCHE,
  JUICE,
  EUROPA_CLIPPER,
  // Interstellar / deep space
  VOYAGER_1,
  VOYAGER_2,
  NEW_HORIZONS
];
