import {
  createTleBackedStore,
  createTleStore,
  type SatelliteStore
} from '$stores/satelliteFactory';
import { ecfKmToInertialOffset } from '$utils/earth';
import type { SatelliteCategory, TrackedObject } from '../types';

/**
 * Curated Earth-orbit satellites driven by real NORAD TLEs from Celestrak,
 * propagated client-side with SGP4. Each renders as a point-marker.
 * ISS and Tiangong use separate dedicated stores and remain outside this list.
 */

// ── Internal store registry ─────────────────────────────────────────────

const _satelliteStores: Record<string, SatelliteStore> = {};

/** Look up a curated satellite's live data store by registry id. */
export function getCuratedSatelliteStore(id: string): SatelliteStore | undefined {
  return _satelliteStores[id];
}

/** Start polling all curated satellite stores. Safe to call multiple times (idempotent). */
export function startAllCuratedSatellites(): void {
  for (const store of Object.values(_satelliteStores)) {
    store.start();
  }
}

/** Stop polling all curated satellite stores. Call from onDestroy. */
export function stopAllCuratedSatellites(): void {
  for (const store of Object.values(_satelliteStores)) {
    store.stop();
  }
}

// ── Factory ─────────────────────────────────────────────────────────────

interface CuratedSatelliteOpts {
  id: string;
  noradId: number;
  name: string;
  subtitle: string;
  /** Sub-category used by the LeftPanel tree to group satellites. */
  category: SatelliteCategory;
  /** Label visibility tier. Defaults to 5 (close zoom only). */
  labelTier?: number;
  /** Short prose description for the info panel. */
  description?: string;
  /** Key-value fact pairs rendered as a grid. */
  facts?: { label: string; value: string }[];
  /** Cited data sources. */
  sources?: { name: string; url: string }[];
  /** Position tracking metadata. */
  tracking?: { mode: string; source: string; epoch?: string };
}

function curatedSatellite(opts: CuratedSatelliteOpts): TrackedObject {
  const tleStore = createTleStore(opts.noradId);
  const dataStore = createTleBackedStore({
    catalogId: opts.noradId,
    name: opts.name,
    tleStore
  });

  // Register the data store in the lookup map so getCuratedSatelliteStore
  // can find it after the modules finish loading.
  _satelliteStores[opts.id] = dataStore;

  return {
    id: opts.id,
    name: opts.name,
    type: 'earth-satellite',
    parent: 'earth',
    offsetFn: (date, target) => {
      const data = dataStore.at(date);
      return data ? ecfKmToInertialOffset(data.ecfKm, target, date) : null;
    },
    rendererKind: 'point-marker',
    labelTier: opts.labelTier ?? 5,
    metadata: {
      subtitle: opts.subtitle,
      externalId: opts.noradId.toString(),
      satelliteCategory: opts.category,
      description: opts.description,
      facts: opts.facts,
      sources: opts.sources,
      tracking: opts.tracking
    }
  };
}

// ── Science telescopes ──────────────────────────────────────────────────

const HUBBLE = curatedSatellite({
  id: 'hubble',
  noradId: 20580,
  name: 'Hubble Space Telescope',
  subtitle: 'NASA · Optical / UV / IR observatory, in orbit since 1990',
  category: 'science',
  labelTier: 4,
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'Hubble is one of the most productive scientific instruments ever built, responsible for groundbreaking discoveries including the accelerating expansion of the universe. It has been serviced five times by Space Shuttle crews, most recently in 2009.',
  facts: [
    { label: 'Launch date', value: 'April 24, 1990' },
    { label: 'Operator', value: 'NASA / ESA' },
    { label: 'Orbit type', value: 'LEO (540 km)' },
    { label: 'Key instrument', value: '2.4 m primary mirror, UV/optical/NIR imaging' }
  ],
  sources: [{ name: 'NASA Space Science', url: 'https://science.nasa.gov/' }]
});

const CHANDRA = curatedSatellite({
  id: 'chandra',
  noradId: 25867,
  name: 'Chandra X-ray Observatory',
  subtitle: 'NASA · X-ray observatory, since 1999',
  category: 'science',
  labelTier: 4,
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    "Chandra is NASA's flagship X-ray telescope, capable of detecting X-ray sources 100 times fainter than any previous X-ray observatory. Its highly elliptical orbit takes it a third of the way to the Moon, allowing long uninterrupted observations.",
  facts: [
    { label: 'Launch date', value: 'July 23, 1999' },
    { label: 'Operator', value: 'NASA / SAO' },
    { label: 'Orbit type', value: 'HEO (16,000 x 133,000 km)' },
    { label: 'Key instrument', value: 'Grazing-incidence X-ray mirrors, 0.5 arcsec resolution' }
  ],
  sources: [{ name: 'NASA Space Science', url: 'https://science.nasa.gov/' }]
});

const FERMI = curatedSatellite({
  id: 'fermi',
  noradId: 33053,
  name: 'Fermi Gamma-ray Space Telescope',
  subtitle: 'NASA / DOE · Gamma-ray sky survey, since 2008',
  category: 'science',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'Fermi surveys the entire sky in gamma rays every three hours, detecting everything from solar flares to distant gamma-ray bursts and pulsars. It has cataloged thousands of high-energy sources and tested fundamental physics at cosmic scales.',
  facts: [
    { label: 'Launch date', value: 'June 11, 2008' },
    { label: 'Operator', value: 'NASA / DOE' },
    { label: 'Orbit type', value: 'Low Earth orbit' },
    { label: 'Key instrument', value: 'Large Area Telescope (LAT), 20 MeV to 300+ GeV' }
  ],
  sources: [{ name: 'NASA Space Science', url: 'https://science.nasa.gov/' }]
});

// ── Weather satellites ──────────────────────────────────────────────────

const NOAA_20 = curatedSatellite({
  id: 'noaa-20',
  noradId: 43013,
  name: 'NOAA-20 (JPSS-1)',
  subtitle: 'NOAA · Polar-orbiting weather satellite, since 2017',
  category: 'weather',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'NOAA-20 is the first satellite in the Joint Polar Satellite System, circling the Earth 14 times a day in a sun-synchronous orbit. It collects data on atmospheric temperature, moisture, ozone, and sea surface temperature used in weather forecasting worldwide.',
  facts: [
    { label: 'Launch date', value: 'November 18, 2017' },
    { label: 'Operator', value: 'NOAA / NASA' },
    { label: 'Orbit type', value: 'SSO (824 km)' },
    { label: 'Key instrument', value: 'VIIRS imager, CrIS sounder, ATMS' }
  ],
  sources: [{ name: 'NASA Space Science', url: 'https://science.nasa.gov/' }]
});

const GOES_18 = curatedSatellite({
  id: 'goes-18',
  noradId: 51850,
  name: 'GOES-18',
  subtitle: 'NOAA · Geostationary weather satellite over the Pacific',
  category: 'weather',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'GOES-18 (also known as GOES-West) provides continuous weather imagery of the western United States and the Pacific Ocean from geostationary orbit. It produces full-disk Earth images every 10 minutes and can scan severe storm regions every 30 seconds.',
  facts: [
    { label: 'Launch date', value: 'March 1, 2022' },
    { label: 'Operator', value: 'NOAA / NASA' },
    { label: 'Orbit type', value: 'GEO (35,786 km)' },
    { label: 'Key instrument', value: 'Advanced Baseline Imager (ABI), 16-band imaging' }
  ],
  sources: [{ name: 'NASA Space Science', url: 'https://science.nasa.gov/' }]
});

// ── Earth observation ───────────────────────────────────────────────────

const SENTINEL_1A = curatedSatellite({
  id: 'sentinel-1a',
  noradId: 39634,
  name: 'Sentinel-1A',
  subtitle: 'ESA · C-band synthetic aperture radar, since 2014',
  category: 'earth-observation',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    "Sentinel-1A is part of ESA's Copernicus Earth observation program, providing all-weather, day-and-night radar imagery. Its C-band SAR can detect ground deformation at millimeter scale, making it essential for monitoring earthquakes, volcanoes, and ice sheets.",
  facts: [
    { label: 'Launch date', value: 'April 3, 2014' },
    { label: 'Operator', value: 'ESA / Copernicus' },
    { label: 'Orbit type', value: 'SSO (693 km)' },
    { label: 'Key instrument', value: 'C-band SAR, 12.5 m resolution in IW mode' }
  ],
  sources: [{ name: 'Celestrak', url: 'https://celestrak.org/' }]
});

const LANDSAT_9 = curatedSatellite({
  id: 'landsat-9',
  noradId: 49260,
  name: 'Landsat 9',
  subtitle: 'NASA / USGS · Land imaging satellite, since 2021',
  category: 'earth-observation',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'Landsat 9 continues a 50-year record of Earth surface observation, the longest continuous satellite imagery program in history. Together with Landsat 8, it captures every point on Earth every 8 days, providing free data for agriculture, forestry, and land-use research.',
  facts: [
    { label: 'Launch date', value: 'September 27, 2021' },
    { label: 'Operator', value: 'NASA / USGS' },
    { label: 'Orbit type', value: 'SSO (705 km)' },
    { label: 'Key instrument', value: 'OLI-2 multispectral imager, 30 m resolution' }
  ],
  sources: [{ name: 'NASA Space Science', url: 'https://science.nasa.gov/' }]
});

const AQUA = curatedSatellite({
  id: 'aqua',
  noradId: 27424,
  name: 'Aqua',
  subtitle: 'NASA · EOS Earth observing satellite, since 2002',
  category: 'earth-observation',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    "Aqua is a key satellite in NASA's Earth Observing System, focused on the water cycle including evaporation, clouds, precipitation, soil moisture, sea ice, and snow cover. Its MODIS instrument produces some of the most widely used Earth science data products.",
  facts: [
    { label: 'Launch date', value: 'May 4, 2002' },
    { label: 'Operator', value: 'NASA' },
    { label: 'Orbit type', value: 'SSO (705 km)' },
    { label: 'Key instrument', value: 'MODIS, AIRS, AMSR-E (water cycle suite)' }
  ],
  sources: [{ name: 'NASA Space Science', url: 'https://science.nasa.gov/' }]
});

// ── Navigation ──────────────────────────────────────────────────────────

const GPS_NAVSTAR_66 = curatedSatellite({
  id: 'gps-navstar-66',
  noradId: 37753,
  name: 'GPS BIIF-2 (NAVSTAR 66)',
  subtitle: 'U.S. Space Force · GPS Block IIF navigation satellite',
  category: 'navigation',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'NAVSTAR 66 is a GPS Block IIF navigation satellite, broadcasting L1, L2, and L5 navigation signals. The GPS constellation provides positioning accuracy within a few meters for billions of receivers worldwide.',
  facts: [
    { label: 'Launch date', value: 'July 16, 2011' },
    { label: 'Operator', value: 'U.S. Space Force' },
    { label: 'Orbit type', value: 'MEO (20,200 km)' },
    { label: 'Key instrument', value: 'L-band navigation payload, atomic clocks' }
  ],
  sources: [{ name: 'Celestrak', url: 'https://celestrak.org/' }]
});

// ── Communication ───────────────────────────────────────────────────────

const IRIDIUM_158 = curatedSatellite({
  id: 'iridium-158',
  noradId: 43571,
  name: 'Iridium 158',
  subtitle: 'Iridium · Voice/data relay (sample of 66 in the constellation)',
  category: 'communication',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'Iridium 158 is part of the Iridium NEXT constellation, a network of 66 cross-linked satellites providing global voice and data coverage including the polar regions. The constellation was fully replaced between 2017 and 2019 with second-generation spacecraft.',
  facts: [
    { label: 'Launch date', value: 'July 25, 2018' },
    { label: 'Operator', value: 'Iridium Communications' },
    { label: 'Orbit type', value: 'LEO (780 km)' },
    { label: 'Key instrument', value: 'L-band voice/data relay, inter-satellite links' }
  ],
  sources: [{ name: 'Celestrak', url: 'https://celestrak.org/' }]
});

// ── Internet constellations ─────────────────────────────────────────────

const STARLINK_5447 = curatedSatellite({
  id: 'starlink-5447',
  noradId: 54779,
  name: 'Starlink 5447',
  subtitle: 'SpaceX · A satellite in the Starlink broadband constellation',
  category: 'internet',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    "Starlink 5447 is a satellite in SpaceX's low-Earth-orbit broadband constellation. Each flat-panel v1.5 spacecraft uses a krypton ion thruster for orbit-raising and station-keeping, and communicates with ground terminals via Ku/Ka-band phased arrays.",
  facts: [
    { label: 'Launch date', value: 'December 17, 2022' },
    { label: 'Operator', value: 'SpaceX' },
    { label: 'Orbit type', value: 'Low Earth orbit' },
    { label: 'Purpose', value: 'Broadband internet, Ku/Ka-band phased array' }
  ],
  sources: [{ name: 'Celestrak', url: 'https://celestrak.org/' }]
});

const ONEWEB_0011 = curatedSatellite({
  id: 'oneweb-0011',
  noradId: 44062,
  name: 'OneWeb 0011',
  subtitle: 'OneWeb · Sample broadband internet satellite',
  category: 'internet',
  tracking: { mode: 'TLE prediction', source: 'NORAD TLE via Celestrak + SGP4 propagation' },
  description:
    'OneWeb 0011 is one of the first-generation satellites in the OneWeb broadband constellation, which provides internet connectivity to remote and underserved areas. The full constellation of 648 satellites orbits in polar planes at 1,200 km altitude.',
  facts: [
    { label: 'Launch date', value: 'February 27, 2019' },
    { label: 'Operator', value: 'Eutelsat OneWeb' },
    { label: 'Orbit type', value: 'LEO (1,200 km)' },
    { label: 'Purpose', value: 'Broadband internet, Ku-band user links' }
  ],
  sources: [{ name: 'Celestrak', url: 'https://celestrak.org/' }]
});

// ── Aggregate export ────────────────────────────────────────────────────

export const CURATED_SATELLITES: TrackedObject[] = [
  // Science telescopes
  HUBBLE,
  CHANDRA,
  FERMI,
  // Weather
  NOAA_20,
  GOES_18,
  // Earth observation
  SENTINEL_1A,
  LANDSAT_9,
  AQUA,
  // Navigation
  GPS_NAVSTAR_66,
  // Communication
  IRIDIUM_158,
  // Internet constellations
  STARLINK_5447,
  ONEWEB_0011
];
