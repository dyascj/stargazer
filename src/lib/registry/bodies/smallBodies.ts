import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import type { ObjectType, TrackedObject } from '../types';

/**
 * Small bodies: asteroids, NEOs, KBO dwarf planets, and comets.
 * Real Keplerian elements from JPL HORIZONS at epoch 2026-04-09.
 * All render as point-markers (labeled dots) regardless of true size.
 */

const EPOCH_JD = 2461291; // JD TDB at 2026-09-07 00:00 UTC

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
  elements: Omit<MoonOrbitalElements, 'parentId' | 'epoch_jd'>;
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
    parentId: 'sun',
    epoch_jd: EPOCH_JD
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Ceres is the largest object in the asteroid belt and the only dwarf planet in the inner solar system. NASA\'s Dawn spacecraft orbited Ceres from 2015 to 2018, revealing bright salt deposits in Occator crater and evidence of a subsurface ocean.',
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
    a_km: 413767842.62,
    e: 0.079741772,
    i_deg: 10.58759810,
    Omega_deg: 80.24898797,
    omega_deg: 73.22034486,
    M_deg: 293.8895144,
    period_days: 1680.139767
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
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
    a_km: 414296877.84,
    e: 0.230704621,
    i_deg: 34.93368310,
    Omega_deg: 172.8868873,
    omega_deg: 310.9841189,
    M_deg: 273.5863873,
    period_days: 1683.363086
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Vesta is the second-most-massive asteroid and the brightest one visible from Earth. NASA\'s Dawn spacecraft orbited Vesta from 2011 to 2012, mapping its giant south-pole impact basin Rheasilvia and confirming it as the source of HED meteorites found on Earth.',
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
    a_km: 353240877.84,
    e: 0.090226617,
    i_deg: 7.143879069,
    Omega_deg: 103.7000041,
    omega_deg: 151.4439226,
    M_deg: 105.79657527,
    period_days: 1325.307763
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
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
    a_km: 471364956.36,
    e: 0.106184904,
    i_deg: 3.826609748,
    Omega_deg: 283.1030656,
    omega_deg: 312.5075782,
    M_deg: 267.8522115,
    period_days: 2042.895945
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    '16 Psyche is one of the most massive metallic asteroids, thought to be the exposed iron-nickel core of a protoplanet stripped by ancient collisions. NASA\'s Psyche spacecraft launched in 2023 and is en route to arrive in 2029.',
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
    a_km: 437744002.33,
    e: 0.135299190,
    i_deg: 3.100411440,
    Omega_deg: 149.9604967,
    omega_deg: 230.1047444,
    M_deg: 97.48951781,
    period_days: 1828.271189
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Eros is a peanut-shaped near-Earth asteroid and the first one ever orbited and landed on by a spacecraft. NASA\'s NEAR Shoemaker studied it for a year before touching down on its surface in February 2001.',
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
    a_km: 218152869.48,
    e: 0.222850966,
    i_deg: 10.82854223,
    Omega_deg: 304.2680569,
    omega_deg: 178.9220687,
    M_deg: 113.16302884,
    period_days: 643.208394
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Itokawa is a tiny rubble-pile asteroid and the first body from which a spacecraft collected and returned surface samples. JAXA\'s Hayabusa touched down in 2005 and delivered its sample capsule to Earth in 2010.',
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
    a_km: 198081797.57,
    e: 0.280142540,
    i_deg: 1.620912374,
    Omega_deg: 69.07460996,
    omega_deg: 162.8363761,
    M_deg: 229.2040955,
    period_days: 556.515368
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Bennu is a carbon-rich near-Earth asteroid studied up close by NASA\'s OSIRIS-REx mission. The spacecraft collected a 121-gram surface sample in 2020 and delivered it to Earth in September 2023, the largest asteroid sample ever returned.',
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
    a_km: 168434593.14,
    e: 0.203677954,
    i_deg: 6.033025041,
    Omega_deg: 1.966633429,
    omega_deg: 66.40106641,
    M_deg: 147.12317829,
    period_days: 436.372372
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Ryugu is a diamond-shaped rubble-pile asteroid visited by JAXA\'s Hayabusa2 mission. The spacecraft collected subsurface samples from two sites and returned them to Earth in December 2020, revealing pristine material from the early solar system.',
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
    a_km: 178157061.28,
    e: 0.191044262,
    i_deg: 5.866469102,
    Omega_deg: 251.2891914,
    omega_deg: 211.6066187,
    M_deg: 130.98026527,
    period_days: 474.695232
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
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
    a_km: 137979137.19,
    e: 0.191181900,
    i_deg: 3.341088836,
    Omega_deg: 203.8926203,
    omega_deg: 126.6839770,
    M_deg: 276.0241830,
    period_days: 323.541836
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Didymos is a binary near-Earth asteroid whose moonlet Dimorphos was the target of NASA\'s DART mission, the first planetary-defense test. The 2022 impact successfully shortened Dimorphos\'s orbit by about 33 minutes.',
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
    a_km: 245755443.55,
    e: 0.383109470,
    i_deg: 3.413795427,
    Omega_deg: 72.98539243,
    omega_deg: 319.5753038,
    M_deg: 303.2309596,
    period_days: 769.068508
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
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
    a_km: 10159292383.7,
    e: 0.438659140,
    i_deg: 43.94752069,
    Omega_deg: 35.99630738,
    omega_deg: 150.8286201,
    M_deg: 211.8981556,
    period_days: 204411.5814
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Haumea is one of the fastest-rotating large objects in the solar system, completing a full turn in under 4 hours, which stretches it into an elongated ellipsoid. In 2017 it became the first trans-Neptunian object confirmed to have a ring system.',
  facts: [
    { label: 'Diameter', value: '~1,560 km (long axis)' },
    { label: 'Type', value: 'Kuiper belt dwarf planet' },
    { label: 'Orbital period', value: '283 years' },
    { label: 'Discovery', value: '2004' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    a_km: 6444920263.7,
    e: 0.193980182,
    i_deg: 28.20846353,
    Omega_deg: 121.7871965,
    omega_deg: 240.5910986,
    M_deg: 223.6250556,
    period_days: 103284.8521
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Makemake is the second-brightest Kuiper belt object after Pluto. Its reddish surface is covered in frozen methane and ethane, and it has a small, very dark moon designated S/2015 (136472) 1.',
  facts: [
    { label: 'Diameter', value: '1,430 km' },
    { label: 'Type', value: 'Kuiper belt dwarf planet' },
    { label: 'Orbital period', value: '306 years' },
    { label: 'Discovery', value: '2005' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    a_km: 6820275631.7,
    e: 0.158371549,
    i_deg: 29.02551121,
    Omega_deg: 79.30827082,
    omega_deg: 297.0651194,
    M_deg: 170.2583717,
    period_days: 112438.0224
  }
});

const SEDNA = smallBody({
  id: 'sedna',
  name: 'Sedna',
  type: 'dwarf-planet',
  subtitle: '90377 Sedna · 12700-year extreme orbit, near perihelion now',
  externalId: '90377',
  radiusKm: 498,
  color: '#a85838',
  cameraDistance: 8,
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
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
    a_km: 80900496714.4,
    e: 0.859145282,
    i_deg: 11.92512377,
    Omega_deg: 144.5124307,
    omega_deg: 311.1334392,
    M_deg: 358.5895761,
    period_days: 4593429.8782
  }
});

const QUAOAR = smallBody({
  id: 'quaoar',
  name: 'Quaoar',
  type: 'dwarf-planet',
  subtitle: '50000 Quaoar · Kuiper belt object with a small ring system',
  externalId: '50000',
  radiusKm: 555,
  color: '#a89888',
  cameraDistance: 7,
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Quaoar is a large Kuiper belt object with a surprisingly distant ring system discovered in 2023. Its ring orbits well beyond the Roche limit, challenging existing theories of how planetary rings form and persist.',
  facts: [
    { label: 'Diameter', value: '1,110 km' },
    { label: 'Type', value: 'Kuiper belt dwarf planet' },
    { label: 'Orbital period', value: '286 years' },
    { label: 'Discovery', value: '2002' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    a_km: 6457553359.9,
    e: 0.035044647,
    i_deg: 7.991668324,
    Omega_deg: 188.9035157,
    omega_deg: 162.7139492,
    M_deg: 293.6447002,
    period_days: 103588.6836
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Halley\'s Comet is the most famous periodic comet and the only short-period comet regularly visible to the naked eye from Earth. It travels a retrograde orbit, looping from just inside Venus\'s orbit out past Neptune.',
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
    a_km: 2671733646.8,
    e: 0.968022932,
    i_deg: 162.1881904,
    Omega_deg: 59.28786277,
    omega_deg: 112.1882748,
    M_deg: 193.4998422,
    period_days: 27567.6692
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
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
    a_km: 517458143.20,
    e: 0.649498272,
    i_deg: 3.866161981,
    Omega_deg: 36.28922289,
    omega_deg: 22.23669112,
    M_deg: 271.1337370,
    period_days: 2349.758057
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
  tracking: { mode: 'Live', source: 'Keplerian propagation from JPL HORIZONS elements' },
  description:
    'Tempel 1 is the only comet visited by two separate missions. NASA\'s Deep Impact deliberately crashed an impactor into it in 2005 to study its interior composition, and Stardust-NExT flew by in 2011 to photograph the resulting crater.',
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
    a_km: 494471774.27,
    e: 0.465050743,
    i_deg: 10.47285825,
    Omega_deg: 66.79205577,
    omega_deg: 184.5974025,
    M_deg: 274.3385278,
    period_days: 2194.939569
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
