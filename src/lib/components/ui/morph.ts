import { get } from 'svelte/store';
import { reducedMotion } from '$stores/reducedMotion';

/*
 * Card-to-panel morph. The source (a search result) records its rect just before it
 * disappears; the panel that appears next takes it and grows out of that rect.
 */
let origin: DOMRect | null = null;

export function setMorphOrigin(element: Element): void {
  origin = element.getBoundingClientRect();
}

/** Morph `panel` out of the pending origin, if any. The origin is consumed either way. */
export function morphFromOrigin(panel: HTMLElement): void {
  const from = origin;
  origin = null;
  if (!from || get(reducedMotion)) return;
  const to = panel.getBoundingClientRect();
  const style = getComputedStyle(panel);
  const easing = style.getPropertyValue('--ease-morph').trim() || 'ease-out';
  const rect = (r: DOMRect) => ({
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    overflow: 'hidden'
  });
  panel.animate(
    [
      { ...rect(from), borderRadius: '12px' },
      { ...rect(to), borderRadius: style.borderRadius }
    ],
    { duration: 380, easing }
  );
  // Contents wait until the surface is 40% of the way there.
  for (const child of panel.children)
    child.animate([{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }], {
      duration: 380
    });
}
