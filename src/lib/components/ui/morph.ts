import { prefersReducedMotion } from 'svelte/motion';

/*
 * Card-to-panel morph. The source (a search result) records its rect just before it
 * disappears; the panel that appears next takes it and grows out of that rect.
 */
let origin: { rect: DOMRect; at: number } | null = null;

export function setMorphOrigin(element: Element): void {
  origin = { rect: element.getBoundingClientRect(), at: performance.now() };
}

/** Morph `panel` out of the pending origin, if any. The origin is consumed either way. */
export function morphFromOrigin(panel: HTMLElement): void {
  // An origin nobody claimed promptly (the phone sheet ignores it) must not replay later.
  const from = origin && performance.now() - origin.at < 500 ? origin.rect : null;
  origin = null;
  if (!from || prefersReducedMotion.current) return;
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
