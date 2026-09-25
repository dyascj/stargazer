import { writable } from 'svelte/store';
import { AU_TO_SCENE } from '$lib/scene-config';

/**
 * Active selection: drives the camera target and info panel.
 * Can be any registry body id, the special 'solarSystem' overview mode, or null.
 */

/** A registry body id, 'solarSystem', or null. */
export type SelectionId = string | null;

/** The view-mode id for the Sun-centered overview. */
export const SOLAR_SYSTEM_VIEW = 'solarSystem';

export const selection = writable<SelectionId>(SOLAR_SYSTEM_VIEW);

/** Overview camera distances in scene units: the inner planets, or out past Neptune. */
export const OVERVIEW_INNER = 6.5 * AU_TO_SCENE;
export const OVERVIEW_ALL = 100 * AU_TO_SCENE;

export const overviewDistance = writable(OVERVIEW_ALL);
