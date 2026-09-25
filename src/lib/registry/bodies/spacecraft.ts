import { Vector3 } from 'three';
import { AU_TO_SCENE } from '$lib/scene-config';
import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import { planetSurfaceToInertialOffset } from '$utils/planetSurface';
import { getById } from '../registry';
import type { TrackedObject } from '../types';

/**
 * Spacecraft and landing sites. Each orbital record carries its own source epoch.
 * Planet orbiters use live Keplerian propagation; en-route and outer-solar-system
 * spacecraft use dated snapshots. These do not predict their current positions.
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
 * scene-frame Cartesian (100 scene units per AU). Used for the
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
  return [ecl_x_au * AU_TO_SCENE, ecl_z_au * AU_TO_SCENE, -ecl_y_au * AU_TO_SCENE];
}

/** Build a planet-orbiter offsetFn via the moon Keplerian helper. */
function orbiterOffset(elements: MoonOrbitalElements): TrackedObject['offsetFn'] {
  return (date, target) => {
    const jd = date.getTime() / 86400000 + 2440587.5;
    return Math.abs(jd - elements.epoch_jd) <= 30
      ? computeMoonOffset(elements, date, target)
      : null;
  };
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
// Illustrative local offset: L2 would sit at Earth's enlarged surface at AU scale.
const L2_DISTANCE_SCENE = 8;
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
  tracking: {
    epoch: '2026-09-06T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    'MRO studies Mars from orbit with the most powerful camera ever sent to another planet. It has returned more data about Mars than all other orbital missions combined.',
  facts: [
    { label: 'Launch Date', value: 'Aug 12, 2005' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'High-resolution imaging and climate monitoring of Mars' }
  ],
  sources: [
    {
      name: 'NASA Mission Page',
      url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/'
    }
  ],
  offsetFn: orbiterOffset({
    parentId: 'mars',
    a_km: 3666.366841982969,
    e: 0.009248259126813945,
    i_deg: 68.9478735995148,
    Omega_deg: 291.5168269529451,
    omega_deg: 263.5165057963207,
    M_deg: 73.83394314400293,
    period_days: 0.07801070507071697,
    epoch_jd: 2461289.5
  })
});

const MAVEN = spacecraftPointMarker({
  id: 'maven',
  name: 'MAVEN',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'NASA · Mars atmosphere mission, 2013–2026',
  externalId: '-202',
  color: '#8A8A85',
  cameraDistance: 1.2,
  tracking: {
    epoch: '2026-03-01T00:00:00 TDB',
    mode: 'Historical orbit',
    source: 'Archived JPL elements; current trajectory unavailable'
  },
  description:
    'MAVEN revealed how Mars lost much of its atmosphere to space and relayed rover communications. Contact was lost on December 6, 2025; NASA announced the mission’s end on June 3, 2026. The archived orbit shown here is not a current position.',
  facts: [
    { label: 'Launch Date', value: 'Nov 18, 2013' },
    { label: 'Agency', value: 'NASA/GSFC' },
    { label: 'Status', value: 'Mission ended June 3, 2026' },
    { label: 'Objective', value: 'Study Mars upper atmosphere and atmospheric loss' }
  ],
  sources: [
    {
      name: 'NASA mission conclusion',
      url: 'https://www.nasa.gov/news-release/nasa-says-farewell-to-maven-mars-mission-hosts-media-call-today/'
    }
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
    epoch_jd: 2461100.5
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
  tracking: {
    epoch: '2026-09-06T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    "Mars Express is ESA's first planetary mission, studying the Martian surface, subsurface, and atmosphere. Its MARSIS radar confirmed the presence of subsurface water ice deposits.",
  facts: [
    { label: 'Launch Date', value: 'Jun 2, 2003' },
    { label: 'Agency', value: 'ESA' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'Global imaging and subsurface radar of Mars' }
  ],
  sources: [
    {
      name: 'ESA Mission Page',
      url: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express'
    }
  ],
  offsetFn: orbiterOffset({
    parentId: 'mars',
    a_km: 8813.804007592702,
    e: 0.5683019864612752,
    i_deg: 113.6887752080507,
    Omega_deg: 90.5158208008366,
    omega_deg: 107.5269992595181,
    M_deg: 8.358808838043343,
    period_days: 0.29076719815847374,
    epoch_jd: 2461289.5
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
  tracking: {
    epoch: '2026-09-06T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    'The Trace Gas Orbiter searches for methane and other trace gases in the Martian atmosphere that could indicate biological or geological activity. It also serves as a data relay for surface missions.',
  facts: [
    { label: 'Launch Date', value: 'Mar 14, 2016' },
    { label: 'Agency', value: 'ESA / Roscosmos' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Detect trace gases and relay surface data' }
  ],
  sources: [
    {
      name: 'ESA Mission Page',
      url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars'
    }
  ],
  offsetFn: orbiterOffset({
    parentId: 'mars',
    a_km: 3781.450563866031,
    e: 0.007626330092980428,
    i_deg: 86.6157133881136,
    Omega_deg: 147.6965138928658,
    omega_deg: 283.9563136998439,
    M_deg: 145.024440897344,
    period_days: 0.0817124004589512,
    epoch_jd: 2461289.5
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
  tracking: {
    mode: 'Landing site',
    source: 'Landing coordinates; current rover traverse not modeled'
  },
  description:
    'Curiosity is a car-sized rover exploring Gale crater on Mars. It confirmed that Mars once had conditions suitable for microbial life, including liquid water and key chemical ingredients.',
  facts: [
    { label: 'Launch Date', value: 'Nov 26, 2011' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: 'Assess past habitability of Gale crater' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/msl-curiosity/' }],
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
  tracking: {
    mode: 'Landing site',
    source: 'Landing coordinates; current rover traverse not modeled'
  },
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
  tracking: {
    epoch: '2026-09-06T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    "Juno orbits Jupiter in a highly elliptical polar orbit, studying the planet's interior structure, magnetic field, and atmosphere. It has revealed detailed views of Jupiter's polar cyclones and deep atmospheric dynamics.",
  facts: [
    { label: 'Launch Date', value: 'Aug 5, 2011' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: "Study Jupiter's interior, magnetosphere, and atmosphere" }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/juno/' }],
  offsetFn: orbiterOffset({
    parentId: 'jupiter',
    a_km: 2945959.538531495,
    e: 0.9730932068690359,
    i_deg: 100.2867735252098,
    Omega_deg: 292.6714821462257,
    omega_deg: 104.739819598398,
    M_deg: 324.000557272754,
    period_days: 32.669393260069235,
    epoch_jd: 2461289.5
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
  tracking: { mode: 'Illustration', source: 'Approximate L2 direction; halo orbit not modeled' },
  description:
    'JWST is the largest and most powerful space telescope ever launched, observing the universe in infrared from the Earth-Sun L2 point. It studies the earliest galaxies, exoplanet atmospheres, and star formation.',
  facts: [
    { label: 'Launch Date', value: 'Dec 25, 2021' },
    { label: 'Agency', value: 'NASA / ESA / CSA' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Infrared astronomy from first galaxies to exoplanets' },
    { label: 'L2 distance from Earth', value: '~1.5 million km' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/webb/' }],
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
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
  offsetFn: staticOffset(
    helioAuToScene(-0.04201764645654524, -0.09462028737411272, 0.001110365247759253)
  )
});

const SOLAR_ORBITER = spacecraftPointMarker({
  id: 'solar-orbiter',
  name: 'Solar Orbiter',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: "ESA / NASA · Heliocentric, observing the Sun's poles",
  externalId: '-144',
  color: '#E8441E',
  cameraDistance: 5,
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    "Solar Orbiter uses gravity assists from Venus to tilt its orbit and obtain the first direct images of the Sun's polar regions. It carries ten instruments studying the heliosphere and solar wind.",
  facts: [
    { label: 'Launch Date', value: 'Feb 10, 2020' },
    { label: 'Agency', value: 'ESA / NASA' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: "Image the Sun's poles and study the heliosphere" }
  ],
  sources: [
    {
      name: 'ESA Mission Page',
      url: 'https://www.esa.int/Science_Exploration/Space_Science/Solar_Orbiter'
    }
  ],
  offsetFn: staticOffset(
    helioAuToScene(0.4597990983308619, 0.02760312453835497, 0.06776854108725179)
  )
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    'BepiColombo is a joint ESA/JAXA mission carrying two orbiters to Mercury. It uses nine gravity assists (Earth, Venus, and Mercury flybys) to slow down enough to enter Mercury orbit in November 2026.',
  facts: [
    { label: 'Launch Date', value: 'Oct 20, 2018' },
    { label: 'Agency', value: 'ESA / JAXA' },
    { label: 'Status', value: 'En route (Mercury orbit insertion Nov 2026)' },
    { label: 'Objective', value: "Study Mercury's surface, interior, and magnetosphere" }
  ],
  sources: [
    {
      name: 'ESA Mission Page',
      url: 'https://www.esa.int/Science_Exploration/Space_Science/BepiColombo'
    }
  ],
  offsetFn: staticOffset(
    helioAuToScene(-0.4039700779999102, -0.1058981877383437, 0.02835215867312124)
  )
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    "Lucy is the first mission to explore the Jupiter Trojan asteroids, primitive bodies trapped in Jupiter's orbit that are thought to be remnants of the early solar system. Its planned encounters include eleven asteroids over its twelve-year primary mission.",
  facts: [
    { label: 'Launch Date', value: 'Oct 16, 2021' },
    { label: 'Agency', value: 'NASA/GSFC' },
    { label: 'Status', value: 'En route' },
    { label: 'Objective', value: 'Fly by Jupiter Trojan asteroids to study solar system origins' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/lucy/' }],
  offsetFn: staticOffset(
    helioAuToScene(-3.724250313455452, -3.325556285975688, -0.2453369783964399)
  )
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    'The Psyche mission is traveling to asteroid 16 Psyche, a metal-rich body that may be the exposed core of an early planetesimal. It will be the first mission to explore a world made largely of metal.',
  facts: [
    { label: 'Launch Date', value: 'Oct 13, 2023' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'En route (arrival Aug 2029)' },
    { label: 'Objective', value: 'Study a metal asteroid to understand planetary cores' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/psyche/' }],
  offsetFn: staticOffset(
    helioAuToScene(0.2468091653183093, 1.558635752977187, -0.07100053884292332)
  )
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    "JUICE (Jupiter Icy Moons Explorer) will study Jupiter's three large ocean-bearing moons: Ganymede, Callisto, and Europa. It will ultimately enter orbit around Ganymede, the first spacecraft to orbit a moon other than our own.",
  facts: [
    { label: 'Launch Date', value: 'Apr 14, 2023' },
    { label: 'Agency', value: 'ESA' },
    { label: 'Status', value: 'En route (arrival Jul 2031)' },
    { label: 'Objective', value: "Characterize Jupiter's icy moons and their oceans" }
  ],
  sources: [
    { name: 'ESA Mission Page', url: 'https://www.esa.int/Science_Exploration/Space_Science/Juice' }
  ],
  offsetFn: staticOffset(
    helioAuToScene(1.111367565608323, -0.2783441268286004, -0.001047643252088193)
  )
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    "Europa Clipper will perform nearly 50 close flybys of Jupiter's moon Europa to investigate whether its subsurface ocean has conditions suitable for life. It is the largest spacecraft NASA has ever built for a planetary mission.",
  facts: [
    { label: 'Launch Date', value: 'Oct 14, 2024' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'En route (arrival Apr 2030)' },
    { label: 'Objective', value: "Assess Europa's habitability and subsurface ocean" }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/europa-clipper/' }],
  offsetFn: staticOffset(
    helioAuToScene(0.6525425151224767, -0.7913415859434472, -0.03110847086586124)
  )
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    'Voyager 1 is the farthest human-made object from Earth, now traveling through interstellar space beyond the heliopause. Launched in 1977, it flew by Jupiter and Saturn before heading out of the solar system.',
  facts: [
    { label: 'Launch Date', value: 'Sep 5, 1977' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (interstellar space)' },
    { label: 'Objective', value: 'Fly by outer planets and explore interstellar space' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/voyager/' }],
  offsetFn: staticOffset(helioAuToScene(-32.13313396310912, -136.6280685490722, 98.85326993344566))
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    'Voyager 2 is the only spacecraft to have visited all four giant planets: Jupiter, Saturn, Uranus, and Neptune. It crossed the heliopause in 2018 and continues to return data from interstellar space.',
  facts: [
    { label: 'Launch Date', value: 'Aug 20, 1977' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (interstellar space)' },
    { label: 'Objective', value: 'Grand tour of outer planets, now interstellar exploration' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/voyager/' }],
  offsetFn: staticOffset(helioAuToScene(39.82958024438035, -105.329485300838, -89.53991014402757))
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-06T00:00:00.000 TDB'
  },
  description:
    'New Horizons performed the first flyby of Pluto in 2015, revealing a geologically active world with nitrogen glaciers and a thin atmosphere. It later flew by Kuiper Belt object Arrokoth, the most distant object ever visited.',
  facts: [
    { label: 'Launch Date', value: 'Jan 19, 2006' },
    { label: 'Agency', value: 'NASA/APL' },
    { label: 'Status', value: 'Active (extended mission, Kuiper Belt)' },
    { label: 'Objective', value: 'Explore Pluto and Kuiper Belt objects' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/new-horizons/' }],
  offsetFn: staticOffset(helioAuToScene(20.77052844849516, -62.09550124964671, 2.283422192604087))
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
