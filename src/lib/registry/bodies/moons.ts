import { EARTH_RADIUS_KM, MOON_COMPRESSION } from '$lib/scene-config';
import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import type { TrackedObject } from '../types';

/**
 * Notable moons with dated Keplerian elements from JPL Horizons.
 * Phobos and Deimos use exaggerated display radii for visibility; honest radiusKm is preserved.
 * Constant elements omit perturbations and precession; error grows away from each epoch.
 */

// ── Helpers ────────────────────────────────────────────────────────────

function moon(opts: {
  id: string;
  name: string;
  parentId: string;
  /** Body radius in km (true). */
  radiusKm: number;
  /** Override radius in scene units when true scale is invisible. */
  displayRadius?: number;
  color: string;
  cameraDistance: number;
  subtitle?: string;
  /** Label visibility tier — defaults to 4 for ordinary moons. */
  labelTier?: number;
  /** Full Keplerian elements (parent's ecliptic J2000 frame, km, deg). */
  elements: Omit<MoonOrbitalElements, 'parentId'>;
  /** 1-2 sentence prose description for the info panel. */
  description?: string;
  /** Key-value fact pairs displayed in the info panel grid. */
  facts?: { label: string; value: string }[];
  /** Cited data sources for the info panel. */
  sources?: { name: string; url: string }[];
  /** Position tracking metadata. */
  tracking?: { mode: string; source: string; epoch?: string };
  /** Render a fresnel atmosphere shell (Titan). */
  hasAtmosphere?: boolean;
  atmosphereColor?: readonly [number, number, number];
}): TrackedObject {
  const fullElements: MoonOrbitalElements = {
    ...opts.elements,
    parentId: opts.parentId
  };
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
    offsetFn: (date, target) => {
      const result = computeMoonOffset(fullElements, date, target);
      // Apply per-parent distance compression so all moon systems
      // have visually consistent proportions (see scene-config.ts
      // MOON_COMPRESSION for the rationale and per-system values).
      const scale = MOON_COMPRESSION[opts.parentId];
      if (result && scale !== undefined) result.multiplyScalar(scale);
      return result;
    },
    rendererKind: 'planet-body',
    cameraDistance: opts.cameraDistance,
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
      radius: opts.displayRadius ?? opts.radiusKm / EARTH_RADIUS_KM,
      radiusKm: opts.radiusKm,
      solidColor: opts.color,
      hasAtmosphere: opts.hasAtmosphere,
      atmosphereColor: opts.atmosphereColor,
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
  displayRadius: 0.04,
  color: '#7a6e63',
  cameraDistance: 0.3,
  labelTier: 5,
  subtitle: 'Mars I · Captured asteroid',
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
    epoch_jd: 2461289.5,
    a_km: 9378.89912561616,
    e: 0.01469073725354439,
    i_deg: 25.71600027599114,
    Omega_deg: 81.91544980443776,
    omega_deg: 267.4374235503582,
    M_deg: 136.4021322713487,
    period_days: 0.319174452406469
  }
});

const DEIMOS = moon({
  id: 'deimos',
  name: 'Deimos',
  parentId: 'mars',
  radiusKm: 6.2,
  displayRadius: 0.03,
  color: '#827368',
  cameraDistance: 0.3,
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
    epoch_jd: 2461289.5,
    a_km: 23459.3558928917,
    e: 0.0002984952159634406,
    i_deg: 24.12698054684529,
    Omega_deg: 81.47384426008836,
    omega_deg: 48.2483268754114,
    M_deg: 90.84218576219567,
    period_days: 1.2626252017961066
  }
});

// ── Jupiter (Galilean four) ────────────────────────────────────────────

const IO = moon({
  id: 'io',
  name: 'Io',
  parentId: 'jupiter',
  radiusKm: 1821.6,
  color: '#e6c878',
  cameraDistance: 1.5,
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
      value: 'Over 400 active volcanoes, most volcanically active world known'
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
    epoch_jd: 2461289.5,
    a_km: 422038.5841425343,
    e: 0.004830060054870431,
    i_deg: 2.225600667260259,
    Omega_deg: 338.4274828220395,
    omega_deg: 61.4666373457848,
    M_deg: 356.4380546251287,
    period_days: 1.7714093103465494
  }
});

const EUROPA = moon({
  id: 'europa',
  name: 'Europa',
  parentId: 'jupiter',
  radiusKm: 1560.8,
  color: '#d8c8a8',
  cameraDistance: 1.5,
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
    epoch_jd: 2461289.5,
    a_km: 671249.8734492816,
    e: 0.009600670435108023,
    i_deg: 2.085103405538428,
    Omega_deg: 326.1619915269368,
    omega_deg: 255.551201760002,
    M_deg: 356.9312115627735,
    period_days: 3.5532170543991834
  }
});

const GANYMEDE = moon({
  id: 'ganymede',
  name: 'Ganymede',
  parentId: 'jupiter',
  radiusKm: 2634.1,
  color: '#9c8c78',
  cameraDistance: 2.5,
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
    epoch_jd: 2461289.5,
    a_km: 1070485.883106618,
    e: 0.002239416404214918,
    i_deg: 2.343089772494554,
    Omega_deg: 339.0835006334943,
    omega_deg: 9.241690520887017,
    M_deg: 231.6224276730239,
    period_days: 7.155753494588536
  }
});

const CALLISTO = moon({
  id: 'callisto',
  name: 'Callisto',
  parentId: 'jupiter',
  radiusKm: 2410.3,
  color: '#5c4f44',
  cameraDistance: 2.5,
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
    epoch_jd: 2461289.5,
    a_km: 1882732.154385982,
    e: 0.00726710103927334,
    i_deg: 1.952452955908582,
    Omega_deg: 336.7389987387469,
    omega_deg: 33.72341797482412,
    M_deg: 28.02683863638034,
    period_days: 16.690579149888773
  }
});

// ── Saturn (seven major moons) ─────────────────────────────────────────

const MIMAS = moon({
  id: 'mimas',
  name: 'Mimas',
  parentId: 'saturn',
  radiusKm: 198.2,
  color: '#cfc8c0',
  cameraDistance: 0.5,
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
    epoch_jd: 2461289.5,
    a_km: 186009.2911860427,
    e: 0.01874608259848585,
    i_deg: 27.45402837944426,
    Omega_deg: 172.6526077040611,
    omega_deg: 129.2906538447147,
    M_deg: 251.1511469902562,
    period_days: 0.9472611836937216
  }
});

const ENCELADUS = moon({
  id: 'enceladus',
  name: 'Enceladus',
  parentId: 'saturn',
  radiusKm: 252.1,
  color: '#f4f4f0',
  cameraDistance: 0.6,
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
    epoch_jd: 2461289.5,
    a_km: 238408.0313131351,
    e: 0.003083659040933651,
    i_deg: 28.04365075744224,
    Omega_deg: 169.5261684236131,
    omega_deg: 180.0497704939704,
    M_deg: 192.8618067090841,
    period_days: 1.3745137224898536
  }
});

const TETHYS = moon({
  id: 'tethys',
  name: 'Tethys',
  parentId: 'saturn',
  radiusKm: 531.1,
  color: '#dcd6c8',
  cameraDistance: 1.2,
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
    epoch_jd: 2461289.5,
    a_km: 294974.0738707938,
    e: 0.001117751976484441,
    i_deg: 28.03346653093704,
    Omega_deg: 171.8473046667844,
    omega_deg: 80.91394508513133,
    M_deg: 3.312566538763233,
    period_days: 1.8916610970218966
  }
});

const DIONE = moon({
  id: 'dione',
  name: 'Dione',
  parentId: 'saturn',
  radiusKm: 561.4,
  color: '#d4cec0',
  cameraDistance: 1.2,
  subtitle: 'Saturn IV · Wispy ice cliffs of the trailing hemisphere',
  description:
    'Dione is an icy Saturnian moon known for bright wispy features on its trailing hemisphere, which Cassini revealed to be networks of ice cliffs created by tectonic fractures. Evidence from Cassini gravity data hints at a thin subsurface ocean.',
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
    epoch_jd: 2461289.5,
    a_km: 377644.3181461146,
    e: 0.00284100987830911,
    i_deg: 28.02530513364931,
    Omega_deg: 169.5471186178306,
    omega_deg: 273.6230853093276,
    M_deg: 5.469828010277921,
    period_days: 2.740260261810933
  }
});

const RHEA = moon({
  id: 'rhea',
  name: 'Rhea',
  parentId: 'saturn',
  radiusKm: 763.8,
  color: '#c8c2b4',
  cameraDistance: 1.6,
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
    epoch_jd: 2461289.5,
    a_km: 527253.2505029559,
    e: 0.0007522599317437219,
    i_deg: 28.27055566482314,
    Omega_deg: 169.9768267533645,
    omega_deg: 154.6700190274434,
    M_deg: 236.7906087564724,
    period_days: 4.5205972497928535
  }
});

const TITAN = moon({
  id: 'titan',
  name: 'Titan',
  parentId: 'saturn',
  radiusKm: 2574.7,
  color: '#d99c4a',
  cameraDistance: 2.5,
  labelTier: 3,
  hasAtmosphere: true,
  atmosphereColor: [0.85, 0.55, 0.25],
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
    epoch_jd: 2461289.5,
    a_km: 1221966.509130391,
    e: 0.02865411869725321,
    i_deg: 27.70606400924823,
    Omega_deg: 169.080421351572,
    omega_deg: 178.3164107126822,
    M_deg: 191.0224909683251,
    period_days: 15.947968242674916
  }
});

const IAPETUS = moon({
  id: 'iapetus',
  name: 'Iapetus',
  parentId: 'saturn',
  radiusKm: 734.5,
  color: '#9c8c70',
  cameraDistance: 1.5,
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
    epoch_jd: 2461289.5,
    a_km: 3564930.71030718,
    e: 0.02778664771043206,
    i_deg: 16.98460804402116,
    Omega_deg: 138.8776357611301,
    omega_deg: 233.188687262726,
    M_deg: 145.3913722316556,
    period_days: 79.4774178379793
  }
});

// ── Uranus (five major moons) ──────────────────────────────────────────

const MIRANDA = moon({
  id: 'miranda',
  name: 'Miranda',
  parentId: 'uranus',
  radiusKm: 235.8,
  color: '#bcb8b4',
  cameraDistance: 0.6,
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
    epoch_jd: 2461289.5,
    a_km: 129875.9509457524,
    e: 0.001342300778161011,
    i_deg: 98.15094904836488,
    Omega_deg: 163.1985898818845,
    omega_deg: 60.12642953390689,
    M_deg: 256.1357945399458,
    period_days: 1.4140725385378285
  }
});

const ARIEL = moon({
  id: 'ariel',
  name: 'Ariel',
  parentId: 'uranus',
  radiusKm: 578.9,
  color: '#c4c0bc',
  cameraDistance: 1.3,
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
    epoch_jd: 2461289.5,
    a_km: 190940.5732571687,
    e: 0.0006306271206522962,
    i_deg: 97.71769194662679,
    Omega_deg: 167.6657460036181,
    omega_deg: 248.3431437802797,
    M_deg: 51.70750424111036,
    period_days: 2.5207103106477193
  }
});

const UMBRIEL = moon({
  id: 'umbriel',
  name: 'Umbriel',
  parentId: 'uranus',
  radiusKm: 584.7,
  color: '#5e5854',
  cameraDistance: 1.3,
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
    epoch_jd: 2461289.5,
    a_km: 266023.8051375178,
    e: 0.004466844476349554,
    i_deg: 97.71404879109141,
    Omega_deg: 167.7251789354866,
    omega_deg: 58.51113380217084,
    M_deg: 321.4332338378364,
    period_days: 4.145303017650234
  }
});

const TITANIA = moon({
  id: 'titania',
  name: 'Titania',
  parentId: 'uranus',
  radiusKm: 788.4,
  color: '#a89c8c',
  cameraDistance: 1.6,
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
    epoch_jd: 2461289.5,
    a_km: 436301.0256604007,
    e: 0.001279885183251044,
    i_deg: 97.76230350657451,
    Omega_deg: 167.6435853535671,
    omega_deg: 292.1376055340357,
    M_deg: 93.20580151110609,
    period_days: 8.706622851589373
  }
});

const OBERON = moon({
  id: 'oberon',
  name: 'Oberon',
  parentId: 'uranus',
  radiusKm: 761.4,
  color: '#9c8c80',
  cameraDistance: 1.5,
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
    epoch_jd: 2461289.5,
    a_km: 583522.5396784128,
    e: 0.002446146591797659,
    i_deg: 97.90568413764731,
    Omega_deg: 167.7083821134358,
    omega_deg: 199.2367156182294,
    M_deg: 71.16706677154944,
    period_days: 13.466575108144959
  }
});

// ── Neptune ────────────────────────────────────────────────────────────

const TRITON = moon({
  id: 'triton',
  name: 'Triton',
  parentId: 'neptune',
  radiusKm: 1353.4,
  color: '#d0a890',
  cameraDistance: 2.0,
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
    epoch_jd: 2461289.5,
    a_km: 354765.0670263563,
    e: 0.0001435501557177754,
    i_deg: 129.1293889400561,
    Omega_deg: 222.8414394479514,
    omega_deg: 110.7792448506487,
    M_deg: 10.80947111772445,
    period_days: 5.877052719290411
  }
});

// ── Pluto ──────────────────────────────────────────────────────────────

const CHARON = moon({
  id: 'charon',
  name: 'Charon',
  parentId: 'pluto',
  radiusKm: 606,
  color: '#9c8e7e',
  cameraDistance: 1.3,
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
    epoch_jd: 2461289.5,
    a_km: 19595.75819351555,
    e: 0.0001602864267529117,
    i_deg: 112.887775979736,
    Omega_deg: 227.3930678831988,
    omega_deg: 172.2631608634009,
    M_deg: 13.66701933283844,
    period_days: 6.387218731304196
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
