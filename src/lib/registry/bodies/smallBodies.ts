import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import type { ObjectType, TrackedObject } from '../types';

/**
 * Small bodies: asteroids, NEOs, KBO dwarf planets, and comets.
 * Real Keplerian elements from JPL HORIZONS at epoch 2026-04-09.
 * All render as point-markers (labeled dots) regardless of true size.
 */

// ── Helper ──────────────────────────────────────────────────────────────

function smallBody(opts: {
  id: string;
  name: string;
  type: ObjectType;
  subtitle?: string;
  externalId?: string;
  /** True body radius in km (for the info panel). */
  radiusKm: number;
  color: string;
  cameraDistance: number;
  labelTier?: number;
  /** Full Keplerian elements (heliocentric ecliptic J2000, km, deg). */
  elements: Omit<MoonOrbitalElements, 'parentId'>;
  /** Short prose description for the info panel. */
  description?: string;
  /** Key-value fact pairs rendered as a grid. */
  facts?: { label: string; value: string }[];
  /** Cited data sources. */
  sources?: { name: string; url: string }[];
  /** Position tracking metadata. */
  tracking?: { mode: string; source: string; epoch?: string };
}): TrackedObject {
  const fullElements: MoonOrbitalElements = {
    ...opts.elements,
    parentId: 'sun'
  };
  return {
    id: opts.id,
    name: opts.name,
    type: opts.type,
    parent: 'sun',
    offsetFn: (date, target) => computeMoonOffset(fullElements, date, target),
    rendererKind: 'point-marker',
    cameraDistance: opts.cameraDistance,
    labelTier: opts.labelTier ?? 4,
    metadata: {
      subtitle: opts.subtitle,
      externalId: opts.externalId,
      color: opts.color,
      pixelSize: 11,
      description: opts.description,
      facts: opts.facts,
      sources: opts.sources,
      tracking: opts.tracking
    }
  };
}

// ── Asteroid belt big four + 16 Psyche ──────────────────────────────────

const CERES = smallBody({
  id: 'ceres',
  name: 'Ceres',
  type: 'dwarf-planet',
  subtitle: '1 Ceres · Largest body in the asteroid belt, dwarf planet',
  externalId: '1',
  radiusKm: 469.7,
  color: '#b8a888',
  cameraDistance: 6,
  labelTier: 2,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Ceres is the largest object in the asteroid belt and the only dwarf planet in the inner solar system. NASA's Dawn spacecraft orbited Ceres from 2015 to 2018, revealing bright salt deposits in Occator crater and evidence of a subsurface ocean.",
  facts: [
    { label: 'Diameter', value: '939.4 km' },
    { label: 'Type', value: 'C-type (carbonaceous)' },
    { label: 'Orbital period', value: '4.60 years' },
    { label: 'Discovery', value: '1801' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 413766611.7400687,
    e: 0.07974047348860508,
    i_deg: 10.58761122073682,
    Omega_deg: 80.24898581156054,
    omega_deg: 73.22219702567172,
    M_deg: 293.5662140574058,
    period_days: 1680.1322700600338
  }
});

const PALLAS = smallBody({
  id: 'pallas',
  name: 'Pallas',
  type: 'asteroid',
  subtitle: '2 Pallas · Third largest asteroid, 35° orbital inclination',
  externalId: '2',
  radiusKm: 256,
  color: '#a8a09c',
  cameraDistance: 6,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Pallas is the third-largest asteroid in the belt and has the most steeply tilted orbit of any large asteroid at nearly 35 degrees. Its high inclination makes it one of the most difficult large asteroids to visit with a spacecraft.',
  facts: [
    { label: 'Diameter', value: '512 km' },
    { label: 'Type', value: 'B-type (carbonaceous)' },
    { label: 'Orbital period', value: '4.61 years' },
    { label: 'Discovery', value: '1802' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 414297268.9722172,
    e: 0.2307043782201448,
    i_deg: 34.93366982594812,
    Omega_deg: 172.886879584203,
    omega_deg: 310.9838898810124,
    M_deg: 273.2658332091129,
    period_days: 1683.3654700653756
  }
});

const VESTA = smallBody({
  id: 'vesta',
  name: 'Vesta',
  type: 'asteroid',
  subtitle: '4 Vesta · Second most massive, Dawn mission target',
  externalId: '4',
  radiusKm: 262.7,
  color: '#c4b8a0',
  cameraDistance: 6,
  labelTier: 3,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Vesta is the second-most-massive asteroid and the brightest one visible from Earth. NASA's Dawn spacecraft orbited Vesta from 2011 to 2012, mapping its giant south-pole impact basin Rheasilvia and confirming it as the source of HED meteorites found on Earth.",
  facts: [
    { label: 'Diameter', value: '525.4 km' },
    { label: 'Type', value: 'V-type (basaltic)' },
    { label: 'Orbital period', value: '3.63 years' },
    { label: 'Discovery', value: '1807' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 353241183.9588279,
    e: 0.09022635563957929,
    i_deg: 7.143879191572538,
    Omega_deg: 103.7000209730775,
    omega_deg: 151.4444447469061,
    M_deg: 105.3885759267642,
    period_days: 1325.3094857253423
  }
});

const HYGIEA = smallBody({
  id: 'hygiea',
  name: 'Hygiea',
  type: 'asteroid',
  subtitle: '10 Hygiea · Fourth largest asteroid',
  externalId: '10',
  radiusKm: 215,
  color: '#7c7468',
  cameraDistance: 6,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Hygiea is the fourth-largest asteroid in the main belt and the largest member of its own collisional family. Observations in 2019 revealed its nearly spherical shape, making it a candidate for dwarf planet reclassification.',
  facts: [
    { label: 'Diameter', value: '434 km' },
    { label: 'Type', value: 'C-type (carbonaceous)' },
    { label: 'Orbital period', value: '5.59 years' },
    { label: 'Discovery', value: '1849' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 471366507.4333456,
    e: 0.1061927283531898,
    i_deg: 3.826658906072265,
    Omega_deg: 283.1034609550765,
    omega_deg: 312.5052359762137,
    M_deg: 267.5908001149562,
    period_days: 2042.9060287587229
  }
});

const PSYCHE_16 = smallBody({
  id: 'asteroid-psyche',
  name: '16 Psyche',
  type: 'asteroid',
  subtitle: '16 Psyche · Metal-rich asteroid, NASA Psyche mission target',
  externalId: '16',
  radiusKm: 113,
  color: '#9c7e68',
  cameraDistance: 6,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "16 Psyche is one of the most massive metallic asteroids, thought to be the exposed iron-nickel core of a protoplanet stripped by ancient collisions. NASA's Psyche spacecraft launched in 2023 and is en route to arrive in 2029.",
  facts: [
    { label: 'Diameter', value: '226 km' },
    { label: 'Type', value: 'M-type (metallic)' },
    { label: 'Orbital period', value: '5.00 years' },
    { label: 'Discovery', value: '1852' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 437743939.0342278,
    e: 0.1352924612850179,
    i_deg: 3.100381313106905,
    Omega_deg: 149.9606741831433,
    omega_deg: 230.1041452205843,
    M_deg: 97.19537814848087,
    period_days: 1828.2707922303764
  }
});

// ── Famous near-Earth objects ───────────────────────────────────────────

const EROS = smallBody({
  id: 'eros',
  name: '433 Eros',
  type: 'asteroid',
  subtitle: '433 Eros · First asteroid landed on (NEAR Shoemaker, 2001)',
  externalId: '433',
  radiusKm: 8.42,
  color: '#a89070',
  cameraDistance: 5,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Eros is a peanut-shaped near-Earth asteroid and the first one ever orbited and landed on by a spacecraft. NASA's NEAR Shoemaker studied it for a year before touching down on its surface in February 2001.",
  facts: [
    { label: 'Diameter', value: '16.84 km' },
    { label: 'Type', value: 'S-type (siliceous)' },
    { label: 'Orbital period', value: '1.76 years' },
    { label: 'Discovery', value: '1898' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 218152799.7125347,
    e: 0.2228512411704793,
    i_deg: 10.82854201277933,
    Omega_deg: 304.2680581909694,
    omega_deg: 178.9219999617556,
    M_deg: 112.3235459083997,
    period_days: 643.2080857275901
  }
});

const ITOKAWA = smallBody({
  id: 'itokawa',
  name: '25143 Itokawa',
  type: 'asteroid',
  subtitle: '25143 Itokawa · Hayabusa first sample return (2010)',
  externalId: '25143',
  radiusKm: 0.165,
  color: '#9c8870',
  cameraDistance: 5,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Itokawa is a tiny rubble-pile asteroid and the first body from which a spacecraft collected and returned surface samples. JAXA's Hayabusa touched down in 2005 and delivered its sample capsule to Earth in 2010.",
  facts: [
    { label: 'Diameter', value: '330 m' },
    { label: 'Type', value: 'S-type (siliceous)' },
    { label: 'Orbital period', value: '1.52 years' },
    { label: 'Discovery', value: '1998' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 198081615.3944316,
    e: 0.2801434369012465,
    i_deg: 1.620912399887197,
    Omega_deg: 69.07461015864801,
    omega_deg: 162.8365117624762,
    M_deg: 228.233635603107,
    period_days: 556.5146000750475
  }
});

const BENNU = smallBody({
  id: 'bennu',
  name: '101955 Bennu',
  type: 'asteroid',
  subtitle: '101955 Bennu · OSIRIS-REx sample returned 2023',
  externalId: '101955',
  radiusKm: 0.245,
  color: '#5c5450',
  cameraDistance: 5,
  labelTier: 3,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Bennu is a carbon-rich near-Earth asteroid studied up close by NASA's OSIRIS-REx mission. The spacecraft collected a 121-gram surface sample in 2020 and delivered it to Earth in September 2023, the largest asteroid sample ever returned.",
  facts: [
    { label: 'Diameter', value: '490 m' },
    { label: 'Type', value: 'B-type (carbonaceous)' },
    { label: 'Orbital period', value: '1.20 years' },
    { label: 'Discovery', value: '1999' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 168434608.4833098,
    e: 0.2036779694884828,
    i_deg: 6.033025263268128,
    Omega_deg: 1.966635437165227,
    omega_deg: 66.40112414735383,
    M_deg: 145.8856173049399,
    period_days: 436.37243184054574
  }
});

const RYUGU = smallBody({
  id: 'ryugu',
  name: '162173 Ryugu',
  type: 'asteroid',
  subtitle: '162173 Ryugu · Hayabusa2 sample returned 2020',
  externalId: '162173',
  radiusKm: 0.435,
  color: '#5c544c',
  cameraDistance: 5,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Ryugu is a diamond-shaped rubble-pile asteroid visited by JAXA's Hayabusa2 mission. The spacecraft collected subsurface samples from two sites and returned them to Earth in December 2020, revealing pristine material from the early solar system.",
  facts: [
    { label: 'Diameter', value: '870 m' },
    { label: 'Type', value: 'Cb-type (carbonaceous)' },
    { label: 'Orbital period', value: '1.30 years' },
    { label: 'Discovery', value: '1999' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 178157030.0101766,
    e: 0.1910445161643846,
    i_deg: 5.866469801867495,
    Omega_deg: 251.2891909536997,
    omega_deg: 211.6066058031816,
    M_deg: 129.8426895127007,
    period_days: 474.6951067931069
  }
});

const APOPHIS = smallBody({
  id: 'apophis',
  name: '99942 Apophis',
  type: 'asteroid',
  subtitle: '99942 Apophis · Famous close-Earth approach in April 2029',
  externalId: '99942',
  radiusKm: 0.185,
  color: '#a87858',
  cameraDistance: 5,
  labelTier: 3,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Apophis is a near-Earth asteroid that will pass within 31,000 km of Earth on April 13, 2029, close enough to be visible to the naked eye. It briefly held the highest impact probability ever recorded before further observations ruled out a collision.',
  facts: [
    { label: 'Diameter', value: '370 m' },
    { label: 'Type', value: 'Sq-type (siliceous)' },
    { label: 'Orbital period', value: '0.89 years' },
    { label: 'Discovery', value: '2004' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 137979146.6132146,
    e: 0.1911817152073455,
    i_deg: 3.341088488973348,
    Omega_deg: 203.8926180867418,
    omega_deg: 126.6839537678745,
    M_deg: 274.3551614255642,
    period_days: 323.54186950897923
  }
});

const DIDYMOS = smallBody({
  id: 'didymos',
  name: '65803 Didymos',
  type: 'asteroid',
  subtitle: '65803 Didymos · DART planetary-defense test target (2022)',
  externalId: '65803',
  radiusKm: 0.39,
  color: '#7c6c5c',
  cameraDistance: 5,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Didymos is a binary near-Earth asteroid whose moonlet Dimorphos was the target of NASA's DART mission, the first planetary-defense test. The 2022 impact successfully shortened Dimorphos's orbit by about 33 minutes.",
  facts: [
    { label: 'Diameter', value: '780 m' },
    { label: 'Type', value: 'S-type (siliceous)' },
    { label: 'Orbital period', value: '2.11 years' },
    { label: 'Discovery', value: '1996' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 245755376.5171483,
    e: 0.3831095077914093,
    i_deg: 3.413796298547783,
    Omega_deg: 72.98540384457425,
    omega_deg: 319.5753343869393,
    M_deg: 302.5287768769544,
    period_days: 769.0681937029674
  }
});

// ── Kuiper belt dwarf planets and TNOs ──────────────────────────────────

const ERIS = smallBody({
  id: 'eris',
  name: 'Eris',
  type: 'dwarf-planet',
  subtitle: '136199 Eris · More massive than Pluto, dwarf planet',
  externalId: '136199',
  radiusKm: 1163,
  color: '#dcd8d0',
  cameraDistance: 8,
  labelTier: 2,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Eris is the most massive known dwarf planet, about 27% more massive than Pluto. Its discovery in 2005 directly triggered the IAU\'s reclassification of Pluto and the creation of the "dwarf planet" category.',
  facts: [
    { label: 'Diameter', value: '2,326 km' },
    { label: 'Type', value: 'Scattered-disc dwarf planet' },
    { label: 'Orbital period', value: '560 years' },
    { label: 'Discovery', value: '2005' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 10159345636.79142,
    e: 0.4386523817272147,
    i_deg: 43.94718871408457,
    Omega_deg: 35.9964365100541,
    omega_deg: 150.8281651274269,
    M_deg: 211.8959064087954,
    period_days: 204413.18858982244
  }
});

const HAUMEA = smallBody({
  id: 'haumea',
  name: 'Haumea',
  type: 'dwarf-planet',
  subtitle: '136108 Haumea · Egg-shaped, 4-hour rotation, has rings',
  externalId: '136108',
  radiusKm: 798,
  color: '#e8e0d4',
  cameraDistance: 7,
  labelTier: 3,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Haumea is one of the fastest-rotating large objects in the solar system, completing a full turn in under 4 hours, which stretches it into an elongated ellipsoid. In 2017 it became the first trans-Neptunian object confirmed to have a ring system.',
  facts: [
    { label: 'Diameter', value: '~1,560 km (long axis)' },
    { label: 'Type', value: 'Kuiper belt object' },
    { label: 'Orbital period', value: '283 years' },
    { label: 'Discovery', value: '2004' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 6444871974.551336,
    e: 0.1939874684584446,
    i_deg: 28.20846339804488,
    Omega_deg: 121.787208843744,
    omega_deg: 240.5924907182647,
    M_deg: 223.6184713565287,
    period_days: 103283.69125215126
  }
});

const MAKEMAKE = smallBody({
  id: 'makemake',
  name: 'Makemake',
  type: 'dwarf-planet',
  subtitle: '136472 Makemake · Reddish methane-ice surface',
  externalId: '136472',
  radiusKm: 715,
  color: '#c89878',
  cameraDistance: 7,
  labelTier: 3,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Makemake is the second-brightest Kuiper belt object after Pluto. Its reddish surface is covered in frozen methane and ethane, and it has a small, very dark moon designated S/2015 (136472) 1.',
  facts: [
    { label: 'Diameter', value: '1,430 km' },
    { label: 'Type', value: 'Kuiper belt object' },
    { label: 'Orbital period', value: '306 years' },
    { label: 'Discovery', value: '2005' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 6820227671.413433,
    e: 0.1583798331503156,
    i_deg: 29.02554374583049,
    Omega_deg: 79.30808548265426,
    omega_deg: 297.0653500609325,
    M_deg: 170.2533241241995,
    period_days: 112436.83638492867
  }
});

const SEDNA = smallBody({
  id: 'sedna',
  name: 'Sedna',
  type: 'trans-neptunian',
  subtitle: '90377 Sedna · Distant trans-Neptunian object, dwarf planet candidate',
  externalId: '90377',
  radiusKm: 498,
  color: '#a85838',
  cameraDistance: 8,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Sedna has one of the longest known orbital periods of any solar system object, taking roughly 11,400 years to complete a single orbit. It is currently approaching perihelion (around 2076), the closest it has been to the Sun in thousands of years.',
  facts: [
    { label: 'Diameter', value: '~995 km' },
    { label: 'Type', value: 'Detached trans-Neptunian object' },
    { label: 'Orbital period', value: '~11,400 years' },
    { label: 'Discovery', value: '2003' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 80906490510.43321,
    e: 0.8591553477653286,
    i_deg: 11.92512661154234,
    Omega_deg: 144.5123149260006,
    omega_deg: 311.1329108877421,
    M_deg: 358.5896424915005,
    period_days: 4593940.36814743
  }
});

const QUAOAR = smallBody({
  id: 'quaoar',
  name: 'Quaoar',
  type: 'trans-neptunian',
  subtitle: '50000 Quaoar · Ringed Kuiper belt object, dwarf planet candidate',
  externalId: '50000',
  radiusKm: 555,
  color: '#a89888',
  cameraDistance: 7,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Quaoar is a large Kuiper belt object with a surprisingly distant ring system discovered in 2023. Its ring orbits well beyond the Roche limit, challenging existing theories of how planetary rings form and persist.',
  facts: [
    { label: 'Diameter', value: '1,110 km' },
    { label: 'Type', value: 'Kuiper belt object' },
    { label: 'Orbital period', value: '286 years' },
    { label: 'Discovery', value: '2002' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 6457536880.183469,
    e: 0.03504749059630567,
    i_deg: 7.991666804393612,
    Omega_deg: 188.9037549964656,
    omega_deg: 162.7202361978017,
    M_deg: 293.6334287296687,
    period_days: 103588.28705214523
  }
});

// ── Comets ──────────────────────────────────────────────────────────────

const HALLEY = smallBody({
  id: 'halley',
  name: '1P/Halley',
  type: 'comet',
  subtitle: '1P/Halley · Most famous periodic comet, 75-year retrograde orbit',
  externalId: '1P',
  radiusKm: 5.5,
  color: '#a8d8ff',
  cameraDistance: 8,
  labelTier: 2,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Halley's Comet is the most famous periodic comet and the only short-period comet regularly visible to the naked eye from Earth. It travels a retrograde orbit, looping from just inside Venus's orbit out past Neptune.",
  facts: [
    { label: 'Orbital period', value: '75.3 years' },
    { label: 'Nucleus diameter', value: '11 km' },
    { label: 'Last perihelion', value: 'February 9, 1986' },
    { label: 'Visited by', value: 'Giotto, Vega 1 & 2 (1986)' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 2671732992.506852,
    e: 0.9680227377229059,
    i_deg: 162.1880564207481,
    Omega_deg: 59.28889105634184,
    omega_deg: 112.1892937411407,
    M_deg: 193.4795988644751,
    period_days: 27567.659058011275
  }
});

const COMET_67P = smallBody({
  id: 'comet-67p',
  name: '67P/Churyumov-Gerasimenko',
  type: 'comet',
  subtitle: '67P · Rosetta mission target, first comet landed on (2014)',
  externalId: '67P',
  radiusKm: 2.0,
  color: '#80b8e0',
  cameraDistance: 6,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    '67P is a Jupiter-family comet with a distinctive two-lobed "rubber duck" shape. ESA\'s Rosetta orbiter studied it for over two years and deployed the Philae lander to its surface in November 2014, the first controlled landing on a comet.',
  facts: [
    { label: 'Orbital period', value: '6.44 years' },
    { label: 'Nucleus diameter', value: '4.1 km' },
    { label: 'Last perihelion', value: 'November 2, 2021' },
    { label: 'Visited by', value: 'Rosetta / Philae (2014-2016)' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 517458028.7864535,
    e: 0.6494990399787475,
    i_deg: 3.866165907871229,
    Omega_deg: 36.28929616446203,
    omega_deg: 22.2366494089646,
    M_deg: 270.9039775087082,
    period_days: 2349.757278130318
  }
});

const TEMPEL_1 = smallBody({
  id: 'comet-tempel-1',
  name: '9P/Tempel 1',
  type: 'comet',
  subtitle: '9P/Tempel 1 · Deep Impact target (2005), Stardust-NExT flyby (2011)',
  externalId: '9P',
  radiusKm: 3.0,
  color: '#88c0e8',
  cameraDistance: 6,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Tempel 1 is the only comet visited by two separate missions. NASA's Deep Impact deliberately crashed an impactor into it in 2005 to study its interior composition, and Stardust-NExT flew by in 2011 to photograph the resulting crater.",
  facts: [
    { label: 'Orbital period', value: '5.58 years' },
    { label: 'Nucleus diameter', value: '6 km' },
    { label: 'Last perihelion', value: 'November 18, 2022' },
    { label: 'Visited by', value: 'Deep Impact (2005), Stardust-NExT (2011)' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461289.5,
    a_km: 494468929.5022107,
    e: 0.465062494625976,
    i_deg: 10.47311741029394,
    Omega_deg: 66.79375032920788,
    omega_deg: 184.5966018551935,
    M_deg: 274.092745927101,
    period_days: 2194.9206274203793
  }
});

// ── Aggregate export ────────────────────────────────────────────────────

export const SMALL_BODIES: TrackedObject[] = [
  // Asteroid belt giants
  CERES,
  PALLAS,
  VESTA,
  HYGIEA,
  PSYCHE_16,
  // Famous spacecraft-target NEOs
  EROS,
  ITOKAWA,
  BENNU,
  RYUGU,
  APOPHIS,
  DIDYMOS,
  // Kuiper belt dwarf planets / TNOs
  ERIS,
  HAUMEA,
  MAKEMAKE,
  SEDNA,
  QUAOAR,
  // Periodic comets
  HALLEY,
  COMET_67P,
  TEMPEL_1
];
