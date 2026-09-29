import { derived, get, writable } from 'svelte/store';
import type { Launch } from '$lib/launches';
import { selection, SOLAR_SYSTEM_VIEW } from './selection';

/** Search dialog visibility. */
export const paletteOpen = writable(false);
export const compareOpen = writable(false);
export const immersive = writable(false);
export const showOrbits = writable(true);
export const showLabels = writable(true);
export const showStars = writable(true);
export const showGrid = writable(false);
export const showStarLabels = writable(false);
export const showTrails = writable(true);
export const brightLighting = writable(false);
/** The launch whose card is open; the camera frames its pad and the scene marks it. */
export const activeLaunch = writable<Launch | null>(null);
export const cameraCommand = writable<'zoom-in' | 'zoom-out' | 'reset' | 'top' | null>(null);
// Remember the dismissed selection, not a global close flag that strands the panel.
const dismissedSelection = writable<string | null>(null);
export const infoPanelOpen = derived(
  [selection, dismissedSelection, immersive],
  ([id, closed, hidden]) => !!id && id !== SOLAR_SYSTEM_VIEW && id !== closed && !hidden
);
export function closeInfoPanel(): void {
  activeLaunch.set(null);
  dismissedSelection.set(get(selection));
}
export function openInfoPanel(): void {
  dismissedSelection.set(null);
}
export function selectBody(id: string): void {
  activeLaunch.set(null);
  dismissedSelection.set(null);
  immersive.set(false);
  selection.set(id);
  cameraCommand.set('reset');
}
/** Fly to Earth over the launch pad and open the launch's card. */
export function showLaunch(launch: Launch): void {
  selectBody('earth');
  activeLaunch.set(launch);
}
