import { derived, get, writable } from 'svelte/store';
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
export const cameraCommand = writable<'zoom-in' | 'zoom-out' | 'reset' | 'top' | null>(null);
// Remember the dismissed selection, not a global close flag that strands the panel.
const dismissedSelection = writable<string | null>(null);
export const infoPanelOpen = derived(
  [selection, dismissedSelection, immersive],
  ([id, closed, hidden]) => !!id && id !== SOLAR_SYSTEM_VIEW && id !== closed && !hidden
);
export function closeInfoPanel(): void {
  dismissedSelection.set(get(selection));
}
export function openInfoPanel(): void {
  dismissedSelection.set(null);
}
export function selectBody(id: string): void {
  dismissedSelection.set(null);
  immersive.set(false);
  selection.set(id);
  cameraCommand.set('reset');
}
