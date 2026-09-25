import { createTleBackedStore } from './satelliteFactory';
import { issTle } from './issTle';
export const iss = createTleBackedStore({ catalogId: 25544, name: 'ISS', tleStore: issTle });
