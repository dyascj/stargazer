import { writable } from 'svelte/store';
import { AU_TO_SCENE } from '$lib/scene-config';

/**
 * Active selection — drives the camera target and info panel.
 * Can be any registry body id, the special 'solarSystem' overview mode, or null.
 */

/** A registry body id, 'solarSystem', or null. */
export type SelectionId = string | null;

/** The view-mode id for the Sun-centered overview. */
export const SOLAR_SYSTEM_VIEW = 'solarSystem';

export const selection = writable<SelectionId>(SOLAR_SYSTEM_VIEW);

/** Overview camera distances in scene units: the inner planets, or out past Neptune. */
export const OVERVIEW_INNER = 6.5 * AU_TO_SCENE;
export const OVERVIEW_ALL = 90 * AU_TO_SCENE;

export const overviewDistance = writable(OVERVIEW_ALL);

// ponytail: values from the retired 100-units-per-AU scale, still sent by the
// UI until it switches to the constants above; delete once it does.
const LEGACY_OVERVIEW: Record<number, number> = { 650: OVERVIEW_INNER, 9000: OVERVIEW_ALL };

/** Scene distance for an `overviewDistance` value. */
export function resolveOverviewDistance(value: number): number {
  return LEGACY_OVERVIEW[value] ?? value;
}
