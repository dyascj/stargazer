import { writable } from 'svelte/store';

/**
 * Active selection — drives the camera target and info panel.
 * Can be any registry body id, the special 'solarSystem' overview mode, or null.
 */

/** A registry body id, 'solarSystem', or null. */
export type SelectionId = string | null;

/** The view-mode id for the Sun-centered overview. */
export const SOLAR_SYSTEM_VIEW = 'solarSystem';

/** Camera distance used by the special `'solarSystem'` overview view. */
export const SOLAR_SYSTEM_CAMERA_DISTANCE = 9000;

export const selection = writable<SelectionId>(SOLAR_SYSTEM_VIEW);

export const overviewDistance = writable(SOLAR_SYSTEM_CAMERA_DISTANCE);
