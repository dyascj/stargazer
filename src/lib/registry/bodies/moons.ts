import { KM_TO_SCENE } from '$lib/scene-config';
import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import type { TrackedObject } from '../types';

/**
 * Notable moons with dated Keplerian elements from JPL Horizons.
 * Constant elements omit perturbations and precession; error grows away from each epoch.
 */

// ── Helpers ────────────────────────────────────────────────────────────

function moon(opts: {
  id: string;
  name: string;
  parentId: string;
  /** Body radius in km (true). */
  radiusKm: number;
  color: string;
  subtitle?: string;
  /** Label priority; defaults to 4 for ordinary moons. */
  labelTier?: number;
  /** Full Keplerian elements (parent's ecliptic J2000 frame, km, deg). */
  elements: MoonOrbitalElements;
  /** 1-2 sentence prose description for the info panel. */
  description?: string;
  /** Key-value fact pairs displayed in the info panel grid. */
  facts?: { label: string; value: string }[];
  /** Cited data sources for the info panel. */
  sources?: { name: string; url: string }[];
  /** Position tracking metadata. */
  tracking?: { mode: string; source: string; epoch?: string };
  /** Render an atmosphere shell (Titan). */
  atmosphere?: { color: readonly [number, number, number]; heightKm: number; density: number };
}): TrackedObject {
  const periodDays = opts.elements.period_days;
  const periodStr =
    periodDays < 1
      ? `${(periodDays * 24).toFixed(2)} hours`
      : `${periodDays.toFixed(periodDays < 10 ? 3 : 2)} Earth days`;
  return {
    id: opts.id,
    name: opts.name,
    type: 'moon',
    parent: opts.parentId,
    offsetFn: (date, target) => computeMoonOffset(opts.elements, date, target),
    rendererKind: 'planet-body',
    labelTier: opts.labelTier ?? 4,
    metadata: {
      subtitle: opts.subtitle,
      description: opts.description,
      facts: opts.facts,
      sources: opts.sources,
      tracking: {
        mode: 'Approximate orbit',
        source: 'JPL Horizons elements; two-body propagation',
        epoch: new Date((opts.elements.epoch_jd - 2440587.5) * 86400000)
          .toISOString()
          .replace('Z', ' TDB')
      },
      radius: opts.radiusKm * KM_TO_SCENE,
      radiusKm: opts.radiusKm,
      solidColor: opts.color,
      atmosphere: opts.atmosphere,
      rotationModel: 'tidal-lock',
      dayLength: `${periodStr} (tidal lock)`,
      yearLength: periodStr,
      orbitalPeriodDays: periodDays
    }
  };
}

// ── Mars ───────────────────────────────────────────────────────────────

const PHOBOS = moon({
  id: 'phobos',
  name: 'Phobos',
  parentId: 'mars',
  radiusKm: 11.2,
  color: '#7a6e63',
  labelTier: 5,
  subtitle: 'Mars I · Doomed inner moon',
  description:
    "Phobos is the larger and closer of Mars's two moons, orbiting so near the surface that it completes three orbits per Martian day. It is slowly spiraling inward and will either crash into Mars or break apart into a ring in roughly 50 million years.",
  facts: [
    { label: 'Diameter', value: '22.4 km (mean)' },
    { label: 'Orbital period', value: '0.319 days (7 h 39 m)' },
    { label: 'Discovery', value: '1877, Asaph Hall' },
    { label: 'Notable feature', value: 'Stickney crater (9 km wide, nearly shattered the moon)' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 9378.579773591533,
    e: 0.01479291333322433,
    i_deg: 25.66057160942287,
    Omega_deg: 82.31204241572479,
    omega_deg: 276.8498871876311,
    M_deg: 121.2204580253225,
    period_days: 0.31891023
  }
});

const DEIMOS = moon({
  id: 'deimos',
  name: 'Deimos',
  parentId: 'mars',
  radiusKm: 6.2,
  color: '#827368',
  labelTier: 5,
  subtitle: 'Mars II · Smaller of Mars\u2019s two moons',
  description:
    "Deimos is the smaller and more distant of Mars's two moons, with an almost circular orbit. Its smooth, dust-blanketed surface and small size suggest it may be a captured D-type asteroid.",
  facts: [
    { label: 'Diameter', value: '12.4 km (mean)' },
    { label: 'Orbital period', value: '1.263 days (30 h 18 m)' },
    { label: 'Discovery', value: '1877, Asaph Hall' },
    {
      label: 'Notable feature',
      value: 'Unusually smooth surface covered by a thick regolith blanket'
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 23459.35394633187,
    e: 0.0002663002297163116,
    i_deg: 24.12409776979017,
    Omega_deg: 81.51616245944041,
    omega_deg: 30.11799826660484,
    M_deg: 262.4889693563825,
    period_days: 1.26244
  }
});

// ── Jupiter (Galilean four) ────────────────────────────────────────────

const IO = moon({
  id: 'io',
  name: 'Io',
  parentId: 'jupiter',
  radiusKm: 1821.6,
  color: '#e6c878',
  labelTier: 3,
  subtitle: 'Jupiter I · The most volcanically active world',
  description:
    'Io is the most volcanically active body in the solar system, driven by intense tidal heating from Jupiter and the Laplace resonance with Europa and Ganymede. Its surface is continuously reshaped by hundreds of active volcanoes erupting sulfur and silicate lava.',
  facts: [
    { label: 'Diameter', value: '3,643.2 km' },
    { label: 'Orbital period', value: '1.769 days' },
    { label: 'Discovery', value: '1610, Galileo Galilei' },
    {
      label: 'Notable feature',
      value: 'About 400 active volcanoes, most volcanically active world known'
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 422018.9309132326,
    e: 0.003591329411785144,
    i_deg: 2.226989717098735,
    Omega_deg: 338.4133580863925,
    omega_deg: 48.00923761947212,
    M_deg: 166.6686879069993,
    period_days: 1.769137786
  }
});

const EUROPA = moon({
  id: 'europa',
  name: 'Europa',
  parentId: 'jupiter',
  radiusKm: 1560.8,
  color: '#d8c8a8',
  labelTier: 3,
  subtitle: 'Jupiter II · Subsurface ocean candidate',
  description:
    'Europa harbors a global saltwater ocean beneath its icy crust, making it one of the most promising places to search for extraterrestrial life. Its young, fractured surface shows almost no impact craters, indicating constant resurfacing from below.',
  facts: [
    { label: 'Diameter', value: '3,121.6 km' },
    { label: 'Orbital period', value: '3.551 days' },
    { label: 'Discovery', value: '1610, Galileo Galilei' },
    {
      label: 'Notable feature',
      value: "Subsurface ocean with more water than all of Earth's oceans combined"
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 671243.8212977661,
    e: 0.009362988444012916,
    i_deg: 2.080053780322797,
    Omega_deg: 326.1903299988488,
    omega_deg: 240.4816543629724,
    M_deg: 82.20704237426038,
    period_days: 3.551181041
  }
});

const GANYMEDE = moon({
  id: 'ganymede',
  name: 'Ganymede',
  parentId: 'jupiter',
  radiusKm: 2634.1,
  color: '#9c8c78',
  labelTier: 3,
  subtitle: 'Jupiter III · Largest moon in the solar system',
  description:
    'Ganymede is the largest moon in the solar system, bigger than the planet Mercury. It is the only moon known to generate its own magnetic field, and it likely has a subsurface saltwater ocean sandwiched between layers of ice.',
  facts: [
    { label: 'Diameter', value: '5,268.2 km' },
    { label: 'Orbital period', value: '7.155 days' },
    { label: 'Discovery', value: '1610, Galileo Galilei' },
    { label: 'Notable feature', value: 'Only moon with its own intrinsic magnetic field' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 1070798.483314025,
    e: 0.002546921654525755,
    i_deg: 2.3433206620367,
    Omega_deg: 339.0715021194428,
    omega_deg: 6.610721751955112,
    M_deg: 261.2467431885268,
    period_days: 7.15455296
  }
});

const CALLISTO = moon({
  id: 'callisto',
  name: 'Callisto',
  parentId: 'jupiter',
  radiusKm: 2410.3,
  color: '#5c4f44',
  labelTier: 3,
  subtitle: 'Jupiter IV · Most heavily cratered body in the solar system',
  description:
    'Callisto is the most heavily cratered object in the solar system, with a surface that has changed little in four billion years. Despite its ancient exterior, magnetic field measurements suggest it too may harbor a subsurface ocean.',
  facts: [
    { label: 'Diameter', value: '4,820.6 km' },
    { label: 'Orbital period', value: '16.689 days' },
    { label: 'Discovery', value: '1610, Galileo Galilei' },
    { label: 'Notable feature', value: 'Most heavily cratered surface in the solar system' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 1883346.970909839,
    e: 0.006828255530907951,
    i_deg: 1.952476532902736,
    Omega_deg: 336.7440893707893,
    omega_deg: 34.18535529861217,
    M_deg: 142.14418170663,
    period_days: 16.6890184
  }
});

// ── Saturn (seven major moons) ─────────────────────────────────────────

const MIMAS = moon({
  id: 'mimas',
  name: 'Mimas',
  parentId: 'saturn',
  radiusKm: 198.2,
  color: '#cfc8c0',
  subtitle: 'Saturn I · The "Death Star" moon',
  description:
    "Mimas is dominated by the giant Herschel crater, which spans nearly a third of the moon's diameter and gives it a resemblance to the Death Star. Recent Cassini data suggest Mimas may hide a young internal ocean beneath its icy crust.",
  facts: [
    { label: 'Diameter', value: '396.4 km' },
    { label: 'Orbital period', value: '0.942 days (22 h 37 m)' },
    { label: 'Discovery', value: '1789, William Herschel' },
    {
      label: 'Notable feature',
      value: "Herschel crater (130 km wide, nearly one-third the moon's diameter)"
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 186037.541455204,
    e: 0.02237425070216675,
    i_deg: 28.04399018141093,
    Omega_deg: 172.8755583060512,
    omega_deg: 156.1126065624316,
    M_deg: 348.1428196587116,
    period_days: 0.942421959
  }
});

const ENCELADUS = moon({
  id: 'enceladus',
  name: 'Enceladus',
  parentId: 'saturn',
  radiusKm: 252.1,
  color: '#f4f4f0',
  subtitle: 'Saturn II · Cryovolcanic ocean world',
  description:
    'Enceladus shoots towering geysers of water vapor and ice particles from fractures near its south pole, fed by a global subsurface ocean. Cassini detected molecular hydrogen and organic molecules in the plumes, making it a top astrobiology target.',
  facts: [
    { label: 'Diameter', value: '504.2 km' },
    { label: 'Orbital period', value: '1.370 days (32 h 53 m)' },
    { label: 'Discovery', value: '1789, William Herschel' },
    { label: 'Notable feature', value: 'Active cryovolcanic plumes from a subsurface ocean' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 238406.5119998481,
    e: 0.003235642896884829,
    i_deg: 28.04353702391079,
    Omega_deg: 169.5288970209286,
    omega_deg: 181.2984588823076,
    M_deg: 211.7048390281775,
    period_days: 1.370218
  }
});

const TETHYS = moon({
  id: 'tethys',
  name: 'Tethys',
  parentId: 'saturn',
  radiusKm: 531.1,
  color: '#dcd6c8',
  subtitle: 'Saturn III · Heavily cratered icy moon',
  description:
    'Tethys is composed almost entirely of water ice and features Odysseus, one of the largest impact craters in the solar system relative to its host body. A massive canyon called Ithaca Chasma stretches nearly three-quarters of the way around the moon.',
  facts: [
    { label: 'Diameter', value: '1,062.2 km' },
    { label: 'Orbital period', value: '1.888 days' },
    { label: 'Discovery', value: '1684, Giovanni Cassini' },
    { label: 'Notable feature', value: 'Ithaca Chasma, a 2,000 km long rift valley' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 294977.7077448426,
    e: 0.001069528554604608,
    i_deg: 28.11566688762798,
    Omega_deg: 171.838860416343,
    omega_deg: 328.6774873705682,
    M_deg: 350.9032716774074,
    period_days: 1.887802
  }
});

const DIONE = moon({
  id: 'dione',
  name: 'Dione',
  parentId: 'saturn',
  radiusKm: 561.4,
  color: '#d4cec0',
  subtitle: 'Saturn IV · Wispy ice cliffs of the trailing hemisphere',
  description:
    'Dione is an icy Saturnian moon known for bright wispy features on its trailing hemisphere, which Cassini revealed to be networks of ice cliffs created by tectonic fractures. Cassini gravity data suggest it may hide an ocean beneath roughly 100 km of ice.',
  facts: [
    { label: 'Diameter', value: '1,122.8 km' },
    { label: 'Orbital period', value: '2.737 days' },
    { label: 'Discovery', value: '1684, Giovanni Cassini' },
    { label: 'Notable feature', value: 'Bright ice-cliff networks on the trailing hemisphere' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 377652.3203350744,
    e: 0.002809086329093434,
    i_deg: 28.02547609938538,
    Omega_deg: 169.5486913786816,
    omega_deg: 277.6675538621681,
    M_deg: 15.19721981306249,
    period_days: 2.736915
  }
});

const RHEA = moon({
  id: 'rhea',
  name: 'Rhea',
  parentId: 'saturn',
  radiusKm: 763.8,
  color: '#c8c2b4',
  subtitle: 'Saturn V · Second-largest Saturnian moon',
  description:
    "Rhea is Saturn's second-largest moon and is composed mostly of water ice with a small rocky core. It was briefly hypothesized to have a tenuous ring system of its own, which would have made it the only moon known to possess rings.",
  facts: [
    { label: 'Diameter', value: '1,527.6 km' },
    { label: 'Orbital period', value: '4.518 days' },
    { label: 'Discovery', value: '1672, Giovanni Cassini' },
    { label: 'Notable feature', value: 'Heavily cratered ice surface with bright wispy streaks' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 527247.5433609901,
    e: 0.0005960158139316987,
    i_deg: 28.2727791799793,
    Omega_deg: 169.971109496123,
    omega_deg: 182.7492324278999,
    M_deg: 161.9016752681866,
    period_days: 4.518212
  }
});

const TITAN = moon({
  id: 'titan',
  name: 'Titan',
  parentId: 'saturn',
  radiusKm: 2574.7,
  color: '#d99c4a',
  labelTier: 3,
  atmosphere: { color: [0.95, 0.62, 0.28], heightKm: 600, density: 1.4 },
  subtitle: 'Saturn VI · Thick nitrogen atmosphere, methane lakes',
  description:
    'Titan is the only moon in the solar system with a dense atmosphere, primarily nitrogen with methane and ethane clouds. Its surface hosts lakes and seas of liquid methane, making it the only world besides Earth known to have stable surface liquids.',
  facts: [
    { label: 'Diameter', value: '5,149.4 km' },
    { label: 'Orbital period', value: '15.945 days' },
    { label: 'Discovery', value: '1655, Christiaan Huygens' },
    {
      label: 'Notable feature',
      value: 'Thick nitrogen atmosphere with methane rain and hydrocarbon lakes'
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 1221915.411538468,
    e: 0.02877215264896823,
    i_deg: 27.70576248168161,
    Omega_deg: 169.0806172053271,
    omega_deg: 178.3460896984261,
    M_deg: 327.685652872853,
    period_days: 15.945421
  }
});

const IAPETUS = moon({
  id: 'iapetus',
  name: 'Iapetus',
  parentId: 'saturn',
  radiusKm: 734.5,
  color: '#9c8c70',
  subtitle: 'Saturn VIII · Two-toned hemisphere, equatorial ridge',
  description:
    'Iapetus has a striking two-toned appearance: one hemisphere is dark as coal, the other bright as snow, caused by thermal migration of dark material swept up in its orbit. A mysterious equatorial ridge up to 20 km high runs along much of its circumference.',
  facts: [
    { label: 'Diameter', value: '1,469.0 km' },
    { label: 'Orbital period', value: '79.322 days' },
    { label: 'Discovery', value: '1671, Giovanni Cassini' },
    { label: 'Notable feature', value: 'Two-toned coloring and a 20 km high equatorial ridge' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 3563365.2475886,
    e: 0.02873782373174227,
    i_deg: 16.97994780099544,
    Omega_deg: 138.8580152141804,
    omega_deg: 231.0324299348277,
    M_deg: 247.4088163942278,
    period_days: 79.3215
  }
});

// ── Uranus (five major moons) ──────────────────────────────────────────

const MIRANDA = moon({
  id: 'miranda',
  name: 'Miranda',
  parentId: 'uranus',
  radiusKm: 235.8,
  color: '#bcb8b4',
  subtitle: 'Uranus V · Patchwork terrain, 20 km cliffs',
  description:
    'Miranda has one of the most bizarre and jumbled landscapes in the solar system, with giant fault canyons, terraced layers, and Verona Rupes, a cliff face roughly 20 km high. Its patchwork geology may result from tidal heating during a past orbital resonance.',
  facts: [
    { label: 'Diameter', value: '471.6 km' },
    { label: 'Orbital period', value: '1.413 days' },
    { label: 'Discovery', value: '1948, Gerard Kuiper' },
    {
      label: 'Notable feature',
      value: 'Verona Rupes, the tallest known cliff in the solar system (~20 km)'
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 129871.8218274381,
    e: 0.001456493832641022,
    i_deg: 98.05747007598181,
    Omega_deg: 163.1913291904702,
    omega_deg: 71.2419584905108,
    M_deg: 88.28198725373066,
    period_days: 1.413479
  }
});

const ARIEL = moon({
  id: 'ariel',
  name: 'Ariel',
  parentId: 'uranus',
  radiusKm: 578.9,
  color: '#c4c0bc',
  subtitle: 'Uranus I · Brightest of the Uranian moons',
  description:
    'Ariel is the brightest and possibly the most geologically active of the Uranian moons, with extensive systems of fault canyons and smooth plains that suggest relatively recent resurfacing. Its high reflectivity comes from a fresh water-ice surface.',
  facts: [
    { label: 'Diameter', value: '1,157.8 km' },
    { label: 'Orbital period', value: '2.520 days' },
    { label: 'Discovery', value: '1851, William Lassell' },
    {
      label: 'Notable feature',
      value: 'Youngest surface of any Uranian moon, with extensive rift valleys'
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 190943.6460780186,
    e: 0.0006363421408480925,
    i_deg: 97.7178866632639,
    Omega_deg: 167.6658198541007,
    omega_deg: 248.1752223790396,
    M_deg: 314.2429026972135,
    period_days: 2.520379
  }
});

const UMBRIEL = moon({
  id: 'umbriel',
  name: 'Umbriel',
  parentId: 'uranus',
  radiusKm: 584.7,
  color: '#5e5854',
  subtitle: 'Uranus II · Darkest large Uranian moon',
  description:
    'Umbriel is the darkest of the large Uranian moons, with a uniformly dark surface broken by a single bright ring-shaped feature called Wunda crater near its equator. Its ancient, heavily cratered terrain suggests little geological activity.',
  facts: [
    { label: 'Diameter', value: '1,169.4 km' },
    { label: 'Orbital period', value: '4.144 days' },
    { label: 'Discovery', value: '1851, William Lassell' },
    { label: 'Notable feature', value: 'Wunda crater with a bright annular floor deposit' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 266007.3637095038,
    e: 0.003645694846130827,
    i_deg: 97.71429194434451,
    Omega_deg: 167.7252404067563,
    omega_deg: 59.46345078002463,
    M_deg: 71.61166330816145,
    period_days: 4.144177
  }
});

const TITANIA = moon({
  id: 'titania',
  name: 'Titania',
  parentId: 'uranus',
  radiusKm: 788.4,
  color: '#a89c8c',
  subtitle: 'Uranus III · Largest Uranian moon',
  description:
    'Titania is the largest moon of Uranus and the eighth-largest moon in the solar system. Its surface shows huge fault systems and canyons, indicating past tectonic activity, possibly driven by the freezing and expansion of an interior water layer.',
  facts: [
    { label: 'Diameter', value: '1,576.8 km' },
    { label: 'Orbital period', value: '8.706 days' },
    { label: 'Discovery', value: '1787, William Herschel' },
    { label: 'Notable feature', value: 'Messina Chasmata, a 1,500 km long fault system' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 436291.2050734216,
    e: 0.002056329080580829,
    i_deg: 97.76216523657304,
    Omega_deg: 167.643649292692,
    omega_deg: 276.2868307840185,
    M_deg: 298.7792448333789,
    period_days: 8.705872
  }
});

const OBERON = moon({
  id: 'oberon',
  name: 'Oberon',
  parentId: 'uranus',
  radiusKm: 761.4,
  color: '#9c8c80',
  subtitle: 'Uranus IV · Outermost large Uranian moon',
  description:
    'Oberon is the outermost of the five major Uranian moons and the second largest. Its heavily cratered surface includes several large impact basins with dark material on their floors, likely a mixture of ice and carbonaceous compounds.',
  facts: [
    { label: 'Diameter', value: '1,522.8 km' },
    { label: 'Orbital period', value: '13.463 days' },
    { label: 'Discovery', value: '1787, William Herschel' },
    { label: 'Notable feature', value: 'Dark-floored craters and a possible 6 km high mountain' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 583630.7496930036,
    e: 0.002607731059587504,
    i_deg: 97.90572725759105,
    Omega_deg: 167.7083142517463,
    omega_deg: 173.7108003464355,
    M_deg: 324.9671994518985,
    period_days: 13.463239
  }
});

// ── Neptune ────────────────────────────────────────────────────────────

const TRITON = moon({
  id: 'triton',
  name: 'Triton',
  parentId: 'neptune',
  radiusKm: 1353.4,
  color: '#d0a890',
  labelTier: 3,
  subtitle: 'Neptune I · Largest Neptunian moon, retrograde, captured KBO',
  description:
    'Triton orbits Neptune in the retrograde direction, strongly suggesting it was captured from the Kuiper Belt. It has active nitrogen geysers, a thin nitrogen atmosphere, and one of the coldest measured surfaces in the solar system at about 38 K.',
  facts: [
    { label: 'Diameter', value: '2,706.8 km' },
    { label: 'Orbital period', value: '5.877 days (retrograde)' },
    { label: 'Discovery', value: '1846, William Lassell' },
    { label: 'Notable feature', value: 'Active nitrogen geysers and a captured retrograde orbit' }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 354767.6546690613,
    e: 0.0001338529644910187,
    i_deg: 129.1274271823768,
    Omega_deg: 222.8567592501579,
    omega_deg: 99.64670253982638,
    M_deg: 289.6142092202101,
    period_days: 5.876854
  }
});

// ── Pluto ──────────────────────────────────────────────────────────────

const CHARON = moon({
  id: 'charon',
  name: 'Charon',
  parentId: 'pluto',
  radiusKm: 606,
  color: '#9c8e7e',
  labelTier: 3,
  subtitle: 'Pluto I · Half Pluto\u2019s diameter, mutually tidally locked',
  description:
    'Charon is so large relative to Pluto that the two orbit a common center of gravity between them, making them effectively a double dwarf planet system. New Horizons revealed a diverse surface with canyons, cliffs, and a dark reddish polar cap called Mordor Macula.',
  facts: [
    { label: 'Diameter', value: '1,212 km' },
    { label: 'Orbital period', value: '6.387 days' },
    { label: 'Discovery', value: '1978, James Christy' },
    {
      label: 'Notable feature',
      value: 'Mutually tidally locked with Pluto, forming a binary system'
    }
  ],
  sources: [
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/moons/' },
    { name: 'JPL Solar System Dynamics', url: 'https://ssd.jpl.nasa.gov/' }
  ],
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  elements: {
    epoch_jd: 2461311.5,
    a_km: 19595.76023685194,
    e: 0.0001612190092335902,
    i_deg: 112.8877734807453,
    Omega_deg: 227.3930728888496,
    omega_deg: 172.6706973980328,
    M_deg: 173.2351813221505,
    period_days: 6.3872304
  }
});

// ── Aggregate export ───────────────────────────────────────────────────

export const NOTABLE_MOONS: TrackedObject[] = [
  PHOBOS,
  DEIMOS,
  IO,
  EUROPA,
  GANYMEDE,
  CALLISTO,
  MIMAS,
  ENCELADUS,
  TETHYS,
  DIONE,
  RHEA,
  TITAN,
  IAPETUS,
  MIRANDA,
  ARIEL,
  UMBRIEL,
  TITANIA,
  OBERON,
  TRITON,
  CHARON
];
