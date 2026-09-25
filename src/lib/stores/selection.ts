import { writable } from 'svelte/store';
import { AU_TO_SCENE } from '$lib/scene-config';

/** The view-mode id for the Sun-centered overview. */
export const SOLAR_SYSTEM_VIEW = 'solarSystem';

/** What the camera and inspector follow: a registry body id, SOLAR_SYSTEM_VIEW, or null. */
export const selection = writable<string | null>(SOLAR_SYSTEM_VIEW);

/** Overview camera distances in scene units: the inner planets, or out past Neptune. */
export const OVERVIEW_INNER = 6.5 * AU_TO_SCENE;
export const OVERVIEW_ALL = 100 * AU_TO_SCENE;

export const overviewDistance = writable(OVERVIEW_ALL);
