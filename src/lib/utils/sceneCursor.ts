import { hoveredBody } from '$lib/stores/sceneHover';

/**
 * Tiny shared helper used by every clickable scene object to set the
 * page cursor to "pointer" while the user is hovering a body, AND
 * to publish the body's name to the global hover store so the
 * floating tooltip can show the right label.
 *
 * The counter pattern handles the case where pointer events from
 * neighbouring meshes can fire over/out in any order — the cursor
 * stays a pointer as long as at least one body is hovered.
 *
 * Browser-only: SSR builds skip the document touch via `typeof`.
 */

let hoverCount = 0;

export function enterBody(name: string): void {
  if (typeof document === 'undefined') return;
  hoverCount += 1;
  document.body.style.cursor = 'pointer';
  hoveredBody.set(name);
}

export function leaveBody(): void {
  if (typeof document === 'undefined') return;
  hoverCount -= 1;
  if (hoverCount < 0) hoverCount = 0;
  if (hoverCount === 0) {
    document.body.style.cursor = '';
    hoveredBody.set(null);
  }
}

export function resetBodyCursor(): void {
  hoverCount = 0;
  hoveredBody.set(null);
  if (typeof document !== 'undefined') document.body.style.cursor = '';
}
