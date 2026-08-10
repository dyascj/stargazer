import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import type { ObjectType, TrackedObject } from '../types';

/**
 * Small bodies: asteroids, NEOs, KBO dwarf planets, and comets.
 * Real Keplerian elements from JPL HORIZONS at epoch 2026-04-09.
 * All render as point-markers (labeled dots) regardless of true size.
 */

const EPOCH_JD = 2461263; // JD TDB at 2026-08-10 00:00 UTC

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
    a_km: 413747380.70,
    e: 0.079720589,
    i_deg: 10.58781144,
    Omega_deg: 80.24889551,
    omega_deg: 73.25158805,
    M_deg: 287.8576317,
    period_days: 1680.015138
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
    a_km: 414304286.40,
    e: 0.230700868,
    i_deg: 34.93342121,
    Omega_deg: 172.8867570,
    omega_deg: 310.9797818,
    M_deg: 267.6030394,
    period_days: 1683.408240
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
    a_km: 353246450.23,
    e: 0.090221129,
    i_deg: 7.143883615,
    Omega_deg: 103.7003149,
    omega_deg: 151.4533212,
    M_deg: 98.18123089,
    period_days: 1325.339123
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
    a_km: 471386868.12,
    e: 0.106335718,
    i_deg: 3.827534253,
    Omega_deg: 283.1098176,
    omega_deg: 312.4690312,
    M_deg: 262.9687139,
    period_days: 2043.038395
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
    a_km: 437736904.48,
    e: 0.135177334,
    i_deg: 3.099859883,
    Omega_deg: 149.9642293,
    omega_deg: 230.0898757,
    M_deg: 92.00191631,
    period_days: 1828.226722
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
    a_km: 218151443.40,
    e: 0.222857186,
    i_deg: 10.82854327,
    Omega_deg: 304.2680490,
    omega_deg: 178.9206467,
    M_deg: 97.49260180,
    period_days: 643.202087
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
    a_km: 198078624.21,
    e: 0.280158742,
    i_deg: 1.620921239,
    Omega_deg: 69.07464081,
    omega_deg: 162.8385891,
    M_deg: 211.0887319,
    period_days: 556.501994
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
    a_km: 168435155.52,
    e: 0.203678052,
    i_deg: 6.033020865,
    Omega_deg: 1.966610000,
    omega_deg: 66.40261460,
    M_deg: 124.02158972,
    period_days: 436.374558
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
    a_km: 178156508.40,
    e: 0.191049948,
    i_deg: 5.866484991,
    Omega_deg: 251.2891602,
    omega_deg: 211.6064290,
    M_deg: 109.74527133,
    period_days: 474.693022
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
    a_km: 137979606.82,
    e: 0.191176867,
    i_deg: 3.341079021,
    Omega_deg: 203.8926067,
    omega_deg: 126.6831830,
    M_deg: 244.8694608,
    period_days: 323.543488
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
    a_km: 245753682.47,
    e: 0.383110707,
    i_deg: 3.413812471,
    Omega_deg: 72.98556875,
    omega_deg: 319.5762127,
    M_deg: 290.1231731,
    period_days: 769.060242
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
    a_km: 10160311380.8,
    e: 0.438531413,
    i_deg: 43.94120742,
    Omega_deg: 35.99876516,
    omega_deg: 150.8196291,
    M_deg: 211.8571052,
    period_days: 204442.3365
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
    a_km: 6443996064.9,
    e: 0.194118155,
    i_deg: 28.20846226,
    Omega_deg: 121.7873189,
    omega_deg: 240.6182845,
    M_deg: 223.5007634,
    period_days: 103262.6363
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
    a_km: 6819373015.9,
    e: 0.158527919,
    i_deg: 29.02614286,
    Omega_deg: 79.30466633,
    omega_deg: 297.0704247,
    M_deg: 170.1629148,
    period_days: 112415.7025
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
    a_km: 81018369405.2,
    e: 0.859343273,
    i_deg: 11.92517719,
    Omega_deg: 144.5102462,
    omega_deg: 311.1234255,
    M_deg: 358.5909800,
    period_days: 4603472.5319
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
    a_km: 6457208838.4,
    e: 0.035096609,
    i_deg: 7.991639276,
    Omega_deg: 188.9081812,
    omega_deg: 162.8400157,
    M_deg: 293.4254870,
    period_days: 103580.3938
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
    a_km: 2671720409.2,
    e: 0.968019966,
    i_deg: 162.1855573,
    Omega_deg: 59.30807916,
    omega_deg: 112.2082944,
    M_deg: 193.1217073,
    period_days: 27567.4643
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
    a_km: 517455252.05,
    e: 0.649513993,
    i_deg: 3.866233176,
    Omega_deg: 36.29051309,
    omega_deg: 22.23609227,
    M_deg: 266.8448022,
    period_days: 2349.738365
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
    a_km: 494412103.55,
    e: 0.465280815,
    i_deg: 10.47804870,
    Omega_deg: 66.82431514,
    omega_deg: 184.5827463,
    M_deg: 269.7494295,
    period_days: 2194.542267
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
