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
    labelTier: opts.labelTier ?? 4,
    metadata: {
      subtitle: opts.subtitle,
      externalId: opts.externalId,
      description: opts.description,
      facts: opts.facts,
      sources: opts.sources,
      tracking: opts.tracking
    }
  };
}

/** Wraps a static scene-frame Cartesian position in an offsetFn. */
function staticOffset(scenePos: [number, number, number]): TrackedObject['offsetFn'] {
  return (_date, target) => target.set(scenePos[0], scenePos[1], scenePos[2]);
}

/** HORIZONS heliocentric ecliptic J2000 AU to scene coordinates, so records paste raw X/Y/Z. */
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
 * Sun–Earth L2, about 1.5 million km beyond Earth on the Sun–Earth line:
 * r · (mu / 3)^(1/3), with mu the Earth–Moon to Sun mass ratio.
 */
const L2_FRACTION = Math.cbrt(3.0404e-6 / 3);
function l2Offset(): TrackedObject['offsetFn'] {
  return (date, target) => {
    const earth = getById('earth')?.offsetFn(date, target);
    return earth ? earth.multiplyScalar(L2_FRACTION) : null;
  };
}

// ── Mars orbiters (real Keplerian elements from JPL HORIZONS) ───────────

const MRO = spacecraftPointMarker({
  id: 'mro',
  name: 'Mars Reconnaissance Orbiter',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'NASA · In orbit since 2006',
  externalId: '-74',
  tracking: {
    epoch: '2026-09-28T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    'MRO studies Mars from orbit with the most powerful camera ever sent to another planet. It has returned more data about Mars than all other orbital missions combined.',
  facts: [
    { label: 'Launch date', value: 'Aug 12, 2005' },
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
    a_km: 3650.704170518863,
    e: 0.01138354194152707,
    i_deg: 71.85119773825843,
    Omega_deg: 303.3833578891596,
    omega_deg: 261.5187911523078,
    M_deg: 191.6380083091273,
    period_days: 0.07751134825731427,
    epoch_jd: 2461311.5
  })
});

const MAVEN = spacecraftPointMarker({
  id: 'maven',
  name: 'MAVEN',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'NASA · Mars atmosphere mission, 2013–2026',
  externalId: '-202',
  tracking: {
    epoch: '2026-03-01T00:00:00 TDB',
    mode: 'Predicted orbit',
    source: 'Last JPL elements after loss of contact; not a current position'
  },
  description:
    'MAVEN revealed how Mars lost much of its atmosphere to space and relayed rover communications. Contact was lost on December 6, 2025; NASA announced the mission’s end on June 3, 2026. The orbit shown is the last prediction, not a current position.',
  facts: [
    { label: 'Launch date', value: 'Nov 18, 2013' },
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
  tracking: {
    epoch: '2026-09-28T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    "Mars Express is ESA's first planetary mission, studying the Martian surface, subsurface, and atmosphere. Its MARSIS radar confirmed the presence of subsurface water ice deposits.",
  facts: [
    { label: 'Launch date', value: 'Jun 2, 2003' },
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
    a_km: 8815.993015292175,
    e: 0.5684019052586781,
    i_deg: 113.7658292245649,
    Omega_deg: 89.10775667959591,
    omega_deg: 94.22209720253284,
    M_deg: 226.2928400545382,
    period_days: 0.2908755278569743,
    epoch_jd: 2461311.5
  })
});

const TGO = spacecraftPointMarker({
  id: 'tgo',
  name: 'ExoMars TGO',
  type: 'spacecraft',
  parent: 'mars',
  subtitle: 'ESA / Roscosmos · Trace Gas Orbiter',
  externalId: '-143',
  tracking: {
    epoch: '2026-09-28T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    'The Trace Gas Orbiter searches for methane and other trace gases in the Martian atmosphere that could indicate biological or geological activity. It also serves as a data relay for surface missions.',
  facts: [
    { label: 'Launch date', value: 'Mar 14, 2016' },
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
    a_km: 3775.553714337802,
    e: 0.005266078895341655,
    i_deg: 101.942874484221,
    Omega_deg: 96.3880228997139,
    omega_deg: 265.2122730828029,
    M_deg: 32.02265029656931,
    period_days: 0.08152133971766247,
    epoch_jd: 2461311.5
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
  labelTier: 5,
  tracking: {
    mode: 'Landing site',
    source: 'Landing coordinates; current rover traverse not modeled'
  },
  description:
    'Curiosity is a car-sized rover exploring Gale crater on Mars. It confirmed that Mars once had conditions suitable for microbial life, including liquid water and key chemical ingredients.',
  facts: [
    { label: 'Launch date', value: 'Nov 26, 2011' },
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
  labelTier: 5,
  tracking: {
    mode: 'Landing site',
    source: 'Landing coordinates; current rover traverse not modeled'
  },
  description:
    'Perseverance searches for signs of ancient microbial life in Jezero crater, an ancient lake bed. It has sealed rock samples for a possible future return to Earth and deployed the Ingenuity helicopter.',
  facts: [
    { label: 'Launch date', value: 'Jul 30, 2020' },
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
  tracking: {
    epoch: '2026-09-28T00:00:00.000 TDB',
    mode: 'Approximate orbit',
    source: 'Two-body model; maneuvers and perturbations omitted'
  },
  description:
    "Juno orbits Jupiter in a highly elliptical polar orbit, studying the planet's interior structure, magnetic field, and atmosphere. It has revealed detailed views of Jupiter's polar cyclones and deep atmospheric dynamics.",
  facts: [
    { label: 'Launch date', value: 'Aug 5, 2011' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (extended mission)' },
    { label: 'Objective', value: "Study Jupiter's interior, magnetosphere, and atmosphere" }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/juno/' }],
  offsetFn: orbiterOffset({
    a_km: 2948004.304171887,
    e: 0.9729218825180916,
    i_deg: 100.2683335450813,
    Omega_deg: 293.0068564168724,
    omega_deg: 104.0323686871533,
    M_deg: 206.2692868710772,
    period_days: 32.70341248648557,
    epoch_jd: 2461311.5
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
  labelTier: 3,
  tracking: {
    mode: 'Illustration',
    source: 'Sun–Earth L2 point; the halo orbit around it is not modeled'
  },
  description:
    'JWST is the largest and most powerful space telescope ever launched, observing the universe in infrared from the Earth-Sun L2 point. It studies the earliest galaxies, exoplanet atmospheres, and star formation.',
  facts: [
    { label: 'Launch date', value: 'Dec 25, 2021' },
    { label: 'Agency', value: 'NASA / ESA / CSA' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Infrared astronomy from first galaxies to exoplanets' },
    { label: 'L2 distance from Earth', value: '~1.5 million km' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/webb/' }],
  offsetFn: l2Offset()
});

// ── Heliocentric snapshots from JPL HORIZONS, refreshed weekly ─────────
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
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    'Parker Solar Probe flies closer to the Sun than any previous spacecraft, diving through the solar corona to study the solar wind and magnetic fields. It has broken speed records, becoming the fastest human-made object.',
  facts: [
    { label: 'Launch date', value: 'Aug 12, 2018' },
    { label: 'Agency', value: 'NASA/APL' },
    { label: 'Status', value: 'Active' },
    { label: 'Objective', value: 'Study the solar corona and solar wind up close' }
  ],
  sources: [
    { name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/parker-solar-probe/' }
  ],
  offsetFn: staticOffset(
    helioAuToScene(0.4183052496115103, -0.4564654344156831, -0.03042231812834187)
  )
});

const SOLAR_ORBITER = spacecraftPointMarker({
  id: 'solar-orbiter',
  name: 'Solar Orbiter',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: "ESA / NASA · Heliocentric, observing the Sun's poles",
  externalId: '-144',
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    "Solar Orbiter uses gravity assists from Venus to tilt its orbit and obtain the first direct images of the Sun's polar regions. It carries ten instruments studying the heliosphere and solar wind.",
  facts: [
    { label: 'Launch date', value: 'Feb 10, 2020' },
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
  offsetFn: staticOffset(helioAuToScene(0.4779808407497301, 0.5027429683342834, 0.1544630449989751))
});

const BEPI = spacecraftPointMarker({
  id: 'bepicolombo',
  name: 'BepiColombo',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'ESA / JAXA · En route to Mercury orbit',
  externalId: '-121',
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    'BepiColombo is a joint ESA/JAXA mission carrying two orbiters to Mercury. It uses nine gravity assists (Earth, Venus, and Mercury flybys) to slow down enough to enter Mercury orbit in November 2026.',
  facts: [
    { label: 'Launch date', value: 'Oct 20, 2018' },
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
    helioAuToScene(-0.08783447338247823, -0.4610265301444963, -0.02946197875731247)
  )
});

const LUCY = spacecraftPointMarker({
  id: 'lucy',
  name: 'Lucy',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · En route to the Jupiter Trojans',
  externalId: '-49',
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    "Lucy is the first mission to explore the Jupiter Trojan asteroids, primitive bodies trapped in Jupiter's orbit that are thought to be remnants of the early solar system. Its planned encounters include eleven asteroids over its twelve-year primary mission.",
  facts: [
    { label: 'Launch date', value: 'Oct 16, 2021' },
    { label: 'Agency', value: 'NASA/GSFC' },
    { label: 'Status', value: 'En route' },
    { label: 'Objective', value: 'Fly by Jupiter Trojan asteroids to study solar system origins' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/lucy/' }],
  offsetFn: staticOffset(
    helioAuToScene(-3.711290817432596, -3.443980564669014, -0.2429512862516529)
  )
});

const PSYCHE = spacecraftPointMarker({
  id: 'psyche',
  name: 'Psyche',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · En route to the metal asteroid 16 Psyche',
  externalId: '-255',
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    'The Psyche mission is traveling to asteroid 16 Psyche, a metal-rich body that may be the exposed core of an early planetesimal. It will be the first mission to explore a world made largely of metal.',
  facts: [
    { label: 'Launch date', value: 'Oct 13, 2023' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'En route (arrival Aug 2029)' },
    { label: 'Objective', value: 'Study a metal asteroid to understand planetary cores' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/psyche/' }],
  offsetFn: staticOffset(
    helioAuToScene(-0.06511551191863217, 1.660257337139512, -0.07050799730595604)
  )
});

const JUICE = spacecraftPointMarker({
  id: 'juice',
  name: 'JUICE',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'ESA · Jupiter Icy Moons Explorer, en route',
  externalId: '-28',
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    "JUICE (Jupiter Icy Moons Explorer) will study Jupiter's three large ocean-bearing moons: Ganymede, Callisto, and Europa. It will ultimately enter orbit around Ganymede, the first spacecraft to orbit a moon other than our own.",
  facts: [
    { label: 'Launch date', value: 'Apr 14, 2023' },
    { label: 'Agency', value: 'ESA' },
    { label: 'Status', value: 'En route (arrival Jul 2031)' },
    { label: 'Objective', value: "Characterize Jupiter's icy moons and their oceans" }
  ],
  sources: [
    { name: 'ESA Mission Page', url: 'https://www.esa.int/Science_Exploration/Space_Science/Juice' }
  ],
  offsetFn: staticOffset(
    helioAuToScene(1.002196761785336, 0.07926968245840608, -0.00003515704715183137)
  )
});

const EUROPA_CLIPPER = spacecraftPointMarker({
  id: 'europa-clipper',
  name: 'Europa Clipper',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · En route to Jupiter system, arrival 2030',
  externalId: '-159',
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    "Europa Clipper will perform nearly 50 close flybys of Jupiter's moon Europa to investigate whether its subsurface ocean has conditions suitable for life. It is the largest spacecraft NASA has ever built for a planetary mission.",
  facts: [
    { label: 'Launch date', value: 'Oct 14, 2024' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'En route (arrival Apr 2030)' },
    { label: 'Objective', value: "Assess Europa's habitability and subsurface ocean" }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/europa-clipper/' }],
  offsetFn: staticOffset(
    helioAuToScene(0.8209543689838044, -0.3682013803865812, -0.03199857704109046)
  )
});

// ── Interstellar / outer solar system ───────────────────────────────────
// Real heliocentric positions from JPL HORIZONS. In late 2026 Voyager 1 is ~172 AU out,
// Voyager 2 ~144 AU, and New Horizons ~66 AU.

const VOYAGER_1 = spacecraftPointMarker({
  id: 'voyager-1',
  name: 'Voyager 1',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · Farthest human-made object, in interstellar space since 2012',
  externalId: '-31',
  labelTier: 2,
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    'Voyager 1 is the farthest human-made object from Earth, now traveling through interstellar space beyond the heliopause. Launched in 1977, it flew by Jupiter and Saturn before heading out of the solar system.',
  facts: [
    { label: 'Launch date', value: 'Sep 5, 1977' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (interstellar space)' },
    { label: 'Objective', value: 'Fly by outer planets and explore interstellar space' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/voyager/' }],
  offsetFn: staticOffset(helioAuToScene(-32.15943616939285, -136.8010147936237, 98.97819713714722))
});

const VOYAGER_2 = spacecraftPointMarker({
  id: 'voyager-2',
  name: 'Voyager 2',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · In interstellar space since 2018',
  externalId: '-32',
  labelTier: 2,
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    'Voyager 2 is the only spacecraft to have visited all four giant planets: Jupiter, Saturn, Uranus, and Neptune. It crossed the heliopause in 2018 and continues to return data from interstellar space.',
  facts: [
    { label: 'Launch date', value: 'Aug 20, 1977' },
    { label: 'Agency', value: 'NASA/JPL' },
    { label: 'Status', value: 'Active (interstellar space)' },
    { label: 'Objective', value: 'Grand tour of outer planets, now interstellar exploration' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/voyager/' }],
  offsetFn: staticOffset(helioAuToScene(39.88298923972805, -105.4481649803141, -89.6837046734128))
});

const NEW_HORIZONS = spacecraftPointMarker({
  id: 'new-horizons',
  name: 'New Horizons',
  type: 'spacecraft',
  parent: 'sun',
  subtitle: 'NASA · Past Pluto, into the Kuiper belt, since 2015',
  externalId: '-98',
  labelTier: 3,
  tracking: {
    mode: 'Snapshot',
    source: 'JPL HORIZONS heliocentric ecliptic Cartesian',
    epoch: '2026-09-28T00:00:00.000 TDB'
  },
  description:
    'New Horizons performed the first flyby of Pluto in 2015, revealing a geologically active world with nitrogen glaciers and a thin atmosphere. It later flew by Kuiper Belt object Arrokoth, the most distant object ever visited.',
  facts: [
    { label: 'Launch date', value: 'Jan 19, 2006' },
    { label: 'Agency', value: 'NASA/APL' },
    { label: 'Status', value: 'Active (extended mission, Kuiper Belt)' },
    { label: 'Objective', value: 'Explore Pluto and Kuiper Belt objects' }
  ],
  sources: [{ name: 'NASA Mission Page', url: 'https://science.nasa.gov/mission/new-horizons/' }],
  offsetFn: staticOffset(helioAuToScene(20.83797484758422, -62.25421004213319, 2.289668153333562))
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
