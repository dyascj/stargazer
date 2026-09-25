/**
 * Landing motion primitives (Bencho vocabulary) as Svelte actions.
 * CSS does the animating; these only feed it state and pointer coordinates.
 */

import { prefersReducedMotion } from 'svelte/motion';

const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
/** Phones and touch-first devices get lighter WebGL scenes. */
export const compact = () => matchMedia('(max-width: 720px), (pointer: coarse)').matches;

let revealObserver: IntersectionObserver | undefined;

/**
 * Arms the element (`data-armed`) and sets `data-in` once it scrolls into view.
 * Pair with `[data-reveal]` CSS; without JavaScript nothing is ever hidden.
 */
export function reveal(node: HTMLElement) {
  node.dataset.armed = '';
  revealObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.in = '';
        revealObserver!.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  revealObserver.observe(node);
  return { destroy: () => revealObserver?.unobserve(node) };
}

/** Calls back once with true/false as the element enters or leaves the viewport. */
export function inView(node: HTMLElement, callback: (visible: boolean) => void) {
  const observer = new IntersectionObserver(([entry]) => callback(entry.isIntersecting), {
    rootMargin: '10% 0px'
  });
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}

/** Pointer-following CTA: the element drifts up to `strength` px toward the cursor. */
export function magnetic(node: HTMLElement, strength = 6) {
  if (!finePointer() || prefersReducedMotion.current) return;
  const move = (event: PointerEvent) => {
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    node.style.translate = `${x * strength * 2}px ${y * strength * 2}px`;
  };
  const leave = () => (node.style.translate = '');
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', leave);
  return {
    destroy() {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    }
  };
}

/** Tilt card: writes --rx/--ry (deg) and --mx/--my (%) for a moving sheen. */
export function tilt(node: HTMLElement, max = 6) {
  if (!finePointer() || prefersReducedMotion.current) return;
  const move = (event: PointerEvent) => {
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    node.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
    node.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
    node.style.setProperty('--mx', `${x * 100}%`);
    node.style.setProperty('--my', `${y * 100}%`);
  };
  const leave = () => {
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
  };
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', leave);
  return {
    destroy() {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    }
  };
}

/**
 * Scroll progress of a section, written to `--p` and passed to the callback at most
 * once per frame. For sections taller than the viewport: 0 when the top meets the
 * viewport top, 1 when the bottom meets the viewport bottom. Otherwise: 0 to 1 as
 * the section scrolls out of the top.
 */
export function scrollProgress(node: HTMLElement, callback?: (progress: number) => void) {
  let frame = 0;
  const update = () => {
    frame = 0;
    const box = node.getBoundingClientRect();
    const range = box.height > innerHeight ? box.height - innerHeight : box.height;
    const progress = Math.min(1, Math.max(0, -box.top / range));
    node.style.setProperty('--p', progress.toFixed(4));
    callback?.(progress);
  };
  const schedule = () => (frame ||= requestAnimationFrame(update));
  update();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  return {
    destroy() {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
    }
  };
}
