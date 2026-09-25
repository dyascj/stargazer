import { createTleStore, createTleBackedStore } from './satelliteFactory';

/**
 * Tiangong (Chinese Space Station, Tianhe core module), NORAD ID 48274.
 *
 * Unlike the ISS, wheretheiss.at does not expose Tiangong, so we drive
 * everything from a Celestrak TLE + client-side SGP4. Same canonical
 * SatelliteState shape, so the same scene components and panels work.
 */
export const TIANGONG_CATALOG_ID = 48274;

export const tiangongTle = createTleStore(TIANGONG_CATALOG_ID);

export const tiangong = createTleBackedStore({
  catalogId: TIANGONG_CATALOG_ID,
  name: 'Tiangong',
  tleStore: tiangongTle
});
