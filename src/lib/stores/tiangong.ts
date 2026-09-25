import { createTleBackedStore, createTleStore } from './satelliteFactory';

/** Tiangong (Chinese Space Station, Tianhe core module), NORAD 48274. */
export const tiangongTle = createTleStore(48274);
export const tiangong = createTleBackedStore({
  catalogId: 48274,
  name: 'Tiangong',
  tleStore: tiangongTle
});
