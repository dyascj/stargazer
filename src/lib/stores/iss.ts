import { createTleBackedStore, createTleStore } from './satelliteFactory';

export const issTle = createTleStore(25544);
export const iss = createTleBackedStore({ catalogId: 25544, name: 'ISS', tleStore: issTle });
