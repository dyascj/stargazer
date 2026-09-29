import { computeMoonOffset, type MoonOrbitalElements } from '$utils/moons';
import type { ObjectType, TrackedObject } from '../types';

/**
 * Small bodies: asteroids, NEOs, KBO dwarf planets, and comets.
 * Real Keplerian elements from JPL HORIZONS, refreshed weekly (see epoch_jd).
 * All render as point-markers (labeled dots) regardless of true size.
 */

// ── Helper ──────────────────────────────────────────────────────────────

function smallBody(opts: {
  id: string;
  name: string;
  type: ObjectType;
  subtitle?: string;
  externalId?: string;
  /** True body radius in km, for sizing the rendered body. */
  radiusKm: number;
  labelTier?: number;
  /** Full Keplerian elements (heliocentric ecliptic J2000, km, deg). */
  elements: MoonOrbitalElements;
  /** Short prose description for the info panel. */
  description?: string;
  /** Key-value fact pairs rendered as a grid. */
  facts?: { label: string; value: string }[];
  /** Cited data sources. */
  sources?: { name: string; url: string }[];
  /** Position tracking metadata. */
  tracking?: { mode: string; source: string; epoch?: string };
}): TrackedObject {
  return {
    id: opts.id,
    name: opts.name,
    type: opts.type,
    parent: 'sun',
    offsetFn: (date, target) => computeMoonOffset(opts.elements, date, target),
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

// ── Asteroid belt big four + 16 Psyche ──────────────────────────────────

const CERES = smallBody({
  id: 'ceres',
  name: 'Ceres',
  type: 'dwarf-planet',
  subtitle: '1 Ceres · Largest body in the asteroid belt, dwarf planet',
  externalId: '1',
  radiusKm: 469.7,
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
    epoch_jd: 2461311.5,
    a_km: 413786260.0683042,
    e: 0.07976221608784317,
    i_deg: 10.58739796583914,
    Omega_deg: 80.24897215023738,
    omega_deg: 73.19319997759577,
    M_deg: 298.3096603800561,
    period_days: 1680.2519468824923
  }
});

const PALLAS = smallBody({
  id: 'pallas',
  name: 'Pallas',
  type: 'asteroid',
  subtitle: '2 Pallas · Third largest asteroid, 35° orbital inclination',
  externalId: '2',
  radiusKm: 256,
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
    epoch_jd: 2461311.5,
    a_km: 414291340.7007213,
    e: 0.2307088149899303,
    i_deg: 34.933876457835,
    Omega_deg: 172.8870147690954,
    omega_deg: 310.9873849923251,
    M_deg: 277.967339001203,
    period_days: 1683.3293387199099
  }
});

const VESTA = smallBody({
  id: 'vesta',
  name: 'Vesta',
  type: 'asteroid',
  subtitle: '4 Vesta · Second most massive, Dawn mission target',
  externalId: '4',
  radiusKm: 262.7,
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
    epoch_jd: 2461311.5,
    a_km: 353236315.8043034,
    e: 0.0902300289993555,
    i_deg: 7.143878777020593,
    Omega_deg: 103.6997904614181,
    omega_deg: 151.4359552664566,
    M_deg: 111.3735910602007,
    period_days: 1325.28208890937
  }
});

const HYGIEA = smallBody({
  id: 'hygiea',
  name: 'Hygiea',
  type: 'asteroid',
  subtitle: '10 Hygiea · Fourth largest asteroid',
  externalId: '10',
  radiusKm: 215,
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
    epoch_jd: 2461311.5,
    a_km: 471340413.8707932,
    e: 0.1060809054663489,
    i_deg: 3.825947717121401,
    Omega_deg: 283.0973140366921,
    omega_deg: 312.5417677699335,
    M_deg: 271.4235962059728,
    period_days: 2042.7363965584882
  }
});

const PSYCHE_16 = smallBody({
  id: 'asteroid-psyche',
  name: '16 Psyche',
  type: 'asteroid',
  subtitle: '16 Psyche · Metal-rich asteroid, NASA Psyche mission target',
  externalId: '16',
  radiusKm: 113,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "16 Psyche is one of the most massive metallic asteroids, which may be part of the metal-rich core of a protoplanet stripped by ancient collisions. NASA's Psyche spacecraft launched in 2023 and is en route to arrive in 2029.",
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
    epoch_jd: 2461311.5,
    a_km: 437741686.6172718,
    e: 0.1353926680618258,
    i_deg: 3.100823698413702,
    Omega_deg: 149.9583566993619,
    omega_deg: 230.1110596781966,
    M_deg: 101.5110290477578,
    period_days: 1828.256681162918
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
    epoch_jd: 2461311.5,
    a_km: 218153715.0568802,
    e: 0.2228482321308092,
    i_deg: 10.82855292488925,
    Omega_deg: 304.2680056946207,
    omega_deg: 178.9230010858989,
    M_deg: 124.6358200323446,
    period_days: 643.2121339738376
  }
});

const ITOKAWA = smallBody({
  id: 'itokawa',
  name: '25143 Itokawa',
  type: 'asteroid',
  subtitle: '25143 Itokawa · First asteroid sample return (2010)',
  externalId: '25143',
  radiusKm: 0.165,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Itokawa is a tiny rubble-pile asteroid and the first asteroid from which a spacecraft collected and returned surface samples. JAXA's Hayabusa touched down in 2005 and delivered its sample capsule to Earth in 2010.",
  facts: [
    { label: 'Diameter', value: '330 m' },
    { label: 'Type', value: 'S-type (siliceous)' },
    { label: 'Orbital period', value: '1.52 years' },
    { label: 'Discovery', value: '1998' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    {
      name: 'JAXA Hayabusa',
      url: 'https://www.isas.jaxa.jp/en/missions/spacecraft/past/hayabusa.html'
    }
  ],
  elements: {
    epoch_jd: 2461311.5,
    a_km: 198084231.9017301,
    e: 0.2801308526392998,
    i_deg: 1.620919846531967,
    Omega_deg: 69.07469851424803,
    omega_deg: 162.8343802207847,
    M_deg: 242.4668406768544,
    period_days: 556.5256268125755
  }
});

const BENNU = smallBody({
  id: 'bennu',
  name: '101955 Bennu',
  type: 'asteroid',
  subtitle: '101955 Bennu · OSIRIS-REx sample returned 2023',
  externalId: '101955',
  radiusKm: 0.245,
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
    epoch_jd: 2461311.5,
    a_km: 168434544.9367446,
    e: 0.2036774509511627,
    i_deg: 6.033016988214126,
    Omega_deg: 1.966538900325481,
    omega_deg: 66.40065702486206,
    M_deg: 164.0360942920582,
    period_days: 436.3721848904073
  }
});

const RYUGU = smallBody({
  id: 'ryugu',
  name: '162173 Ryugu',
  type: 'asteroid',
  subtitle: '162173 Ryugu · Hayabusa2 sample returned 2020',
  externalId: '162173',
  radiusKm: 0.448,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Ryugu is a diamond-shaped rubble-pile asteroid visited by JAXA's Hayabusa2 mission. The spacecraft collected subsurface samples from two sites and returned them to Earth in December 2020, revealing pristine material from the early solar system.",
  facts: [
    { label: 'Diameter', value: '~900 m' },
    { label: 'Type', value: 'Cb-type (carbonaceous)' },
    { label: 'Orbital period', value: '1.30 years' },
    { label: 'Discovery', value: '1999' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'JAXA Hayabusa2', url: 'https://www.hayabusa2.jaxa.jp/en/' }
  ],
  elements: {
    epoch_jd: 2461311.5,
    a_km: 178157467.4943427,
    e: 0.1910415678534192,
    i_deg: 5.866461261816532,
    Omega_deg: 251.2891883022332,
    omega_deg: 211.6069089267022,
    M_deg: 146.5268600740615,
    period_days: 474.69685529318394
  }
});

const APOPHIS = smallBody({
  id: 'apophis',
  name: '99942 Apophis',
  type: 'asteroid',
  subtitle: '99942 Apophis · Famous close-Earth approach in April 2029',
  externalId: '99942',
  radiusKm: 0.185,
  labelTier: 3,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Apophis is a near-Earth asteroid that will pass about 32,000 km above Earth's surface on April 13, 2029, close enough to be visible to the naked eye. It briefly held the highest impact probability ever recorded before further observations ruled out a collision.",
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
    epoch_jd: 2461311.5,
    a_km: 137979142.1779323,
    e: 0.1911835707808102,
    i_deg: 3.341090462730431,
    Omega_deg: 203.8926326881428,
    omega_deg: 126.6840947388088,
    M_deg: 298.83427944017,
    period_days: 323.5418539088007
  }
});

const DIDYMOS = smallBody({
  id: 'didymos',
  name: '65803 Didymos',
  type: 'asteroid',
  subtitle: '65803 Didymos · DART and Hera binary asteroid',
  externalId: '65803',
  radiusKm: 0.39,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Didymos is a binary near-Earth asteroid whose moonlet Dimorphos was the target of NASA's DART mission, the first planetary-defense test. The 2022 impact shortened Dimorphos's orbit by about 33 minutes, and ESA's Hera is due to arrive in late 2026 to survey the aftermath.",
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
    epoch_jd: 2461311.5,
    a_km: 245755710.1602777,
    e: 0.3831085890081334,
    i_deg: 3.413784564586973,
    Omega_deg: 72.98521746525054,
    omega_deg: 319.5752206169218,
    M_deg: 312.8270989216098,
    period_days: 769.0697598603975
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
    epoch_jd: 2461311.5,
    a_km: 10158554813.72075,
    e: 0.4387547562873431,
    i_deg: 43.9521241437548,
    Omega_deg: 35.99451802975177,
    omega_deg: 150.8345498857566,
    M_deg: 211.9297649853597,
    period_days: 204389.32117867036
  }
});

const HAUMEA = smallBody({
  id: 'haumea',
  name: 'Haumea',
  type: 'dwarf-planet',
  subtitle: '136108 Haumea · Egg-shaped, 4-hour rotation, has rings',
  externalId: '136108',
  radiusKm: 798,
  labelTier: 3,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Haumea is one of the fastest-rotating large objects in the solar system, completing a full turn in under 4 hours, which stretches it into an elongated ellipsoid. In 2017 it became the first trans-Neptunian object confirmed to have a ring system.',
  facts: [
    { label: 'Diameter', value: '~1,600 km mean; over 2,100 km long axis' },
    { label: 'Type', value: 'Kuiper belt object' },
    { label: 'Orbital period', value: '283 years' },
    { label: 'Discovery', value: '2004' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' },
    { name: 'NASA Solar System', url: 'https://science.nasa.gov/solar-system/' }
  ],
  elements: {
    epoch_jd: 2461311.5,
    a_km: 6445585756.405718,
    e: 0.1938778626997695,
    i_deg: 28.20846734035757,
    Omega_deg: 121.7868460515042,
    omega_deg: 240.5726443721866,
    M_deg: 223.714254366231,
    period_days: 103300.85002570093
  }
});

const MAKEMAKE = smallBody({
  id: 'makemake',
  name: 'Makemake',
  type: 'dwarf-planet',
  subtitle: '136472 Makemake · Reddish methane-ice surface',
  externalId: '136472',
  radiusKm: 715,
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
    epoch_jd: 2461311.5,
    a_km: 6820956491.130445,
    e: 0.1582544936720899,
    i_deg: 29.02508100865148,
    Omega_deg: 79.31071851081228,
    omega_deg: 297.0631038976962,
    M_deg: 170.3259721029049,
    period_days: 112454.85961884573
  }
});

const SEDNA = smallBody({
  id: 'sedna',
  name: 'Sedna',
  type: 'trans-neptunian',
  subtitle: '90377 Sedna · Distant trans-Neptunian object, dwarf planet candidate',
  externalId: '90377',
  radiusKm: 498,
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
    epoch_jd: 2461311.5,
    a_km: 80821749521.54585,
    e: 0.8590132999667661,
    i_deg: 11.92508151135419,
    Omega_deg: 144.5141485592597,
    omega_deg: 311.1407550882592,
    M_deg: 358.588745906137,
    period_days: 4586724.758625527
  }
});

const QUAOAR = smallBody({
  id: 'quaoar',
  name: 'Quaoar',
  type: 'trans-neptunian',
  subtitle: '50000 Quaoar · Ringed Kuiper belt object, dwarf planet candidate',
  externalId: '50000',
  radiusKm: 555,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    'Quaoar is a large Kuiper belt object with a surprisingly distant ring system reported in 2023. Both of its known rings orbit well beyond the Roche limit, challenging existing theories of how planetary rings form and persist.',
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
    epoch_jd: 2461311.5,
    a_km: 6457743602.337134,
    e: 0.03500217865805481,
    i_deg: 7.991689640557514,
    Omega_deg: 188.9002096019012,
    omega_deg: 162.6348207827144,
    M_deg: 293.7917688600794,
    period_days: 103593.26127813173
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
    { label: 'Visited by', value: 'Giotto, Vega 1 & 2, Suisei, Sakigake (1986)' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461311.5,
    a_km: 2671741517.505072,
    e: 0.9680265841526426,
    i_deg: 162.1899782472421,
    Omega_deg: 59.27413706455163,
    omega_deg: 112.1746690836307,
    M_deg: 193.7766049027531,
    period_days: 27567.79100295069
  }
});

const COMET_67P = smallBody({
  id: 'comet-67p',
  name: '67P/Churyumov-Gerasimenko',
  type: 'comet',
  subtitle: '67P · Rosetta mission target, first comet landed on (2014)',
  externalId: '67P',
  radiusKm: 2.0,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    '67P is a Jupiter-family comet with a distinctive two-lobed "rubber duck" shape. ESA\'s Rosetta orbiter studied it for over two years and deployed the Philae lander to its surface in November 2014, the first soft landing on a comet.',
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
    epoch_jd: 2461311.5,
    a_km: 517458860.9935397,
    e: 0.6494884018635237,
    i_deg: 3.866105737667479,
    Omega_deg: 36.28814496530406,
    omega_deg: 22.2374552396363,
    M_deg: 274.2735832153482,
    period_days: 2349.7629466638077
  }
});

const TEMPEL_1 = smallBody({
  id: 'comet-tempel-1',
  name: '9P/Tempel 1',
  type: 'comet',
  subtitle: '9P/Tempel 1 · Deep Impact target (2005), Stardust-NExT flyby (2011)',
  externalId: '9P',
  radiusKm: 3.0,
  tracking: {
    mode: 'Approximate orbit',
    source: 'Keplerian propagation from JPL HORIZONS elements'
  },
  description:
    "Tempel 1 was the first comet revisited by a second spacecraft. NASA's Deep Impact deliberately crashed an impactor into it in 2005 to study its interior composition, and Stardust-NExT flew by in 2011 to photograph the resulting crater.",
  facts: [
    { label: 'Orbital period', value: '~6.0 years' },
    { label: 'Nucleus diameter', value: '6 km' },
    { label: 'Last perihelion', value: 'March 4, 2022' },
    { label: 'Visited by', value: 'Deep Impact (2005), Stardust-NExT (2011)' }
  ],
  sources: [
    { name: 'JPL Small-Body Database', url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html' }
  ],
  elements: {
    epoch_jd: 2461311.5,
    a_km: 494507143.8695128,
    e: 0.4648964217135333,
    i_deg: 10.46952864225796,
    Omega_deg: 66.76933684252955,
    omega_deg: 184.6083720735505,
    M_deg: 277.6970542658823,
    period_days: 2195.1750795768844
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
