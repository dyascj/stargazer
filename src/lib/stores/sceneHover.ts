import { readable, writable } from 'svelte/store';

export const hoveredBody = writable<string | null>(null);
export const cursorPosition = readable({ x: 0, y: 0 }, (set) => {
  if (typeof document === 'undefined') return;
  const move = (event: PointerEvent) => set({ x: event.clientX, y: event.clientY });
  document.addEventListener('pointermove', move, { passive: true });
  return () => document.removeEventListener('pointermove', move);
});
