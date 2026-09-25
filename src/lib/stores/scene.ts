import { writable } from 'svelte/store';

/**
 * Scene lifecycle for the interface. `sceneReady` turns true once the first
 * view's textures have loaded and the canvas starts fading in; `introComplete`
 * turns true when the opening camera move settles or the user interrupts it,
 * which is the moment to bring in interface chrome.
 */
export const sceneReady = writable(false);
export const introComplete = writable(false);

/**
 * Pixels that interface panels cover at the right and bottom of the canvas.
 * The camera eases its optical center into the remaining space instead of the
 * canvas resizing, so opening, closing, or dragging a panel glides.
 */
export const viewInset = writable({ right: 0, bottom: 0 });
