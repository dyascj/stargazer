import { writable } from 'svelte/store';

/**
 * Scene lifecycle for the interface. `sceneReady` turns true once the first
 * view's textures have loaded and the canvas starts fading in; `introComplete`
 * turns true when the opening camera move settles or the user interrupts it,
 * which is the moment to bring in interface chrome.
 */
export const sceneReady = writable(false);
export const introComplete = writable(false);
