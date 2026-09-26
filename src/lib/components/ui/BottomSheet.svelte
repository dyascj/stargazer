<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  type Snap = 'peek' | 'half' | 'full';
  let {
    label,
    onclose,
    children,
    offset = $bindable(0),
    expanded = $bindable(false)
  }: {
    label: string;
    onclose: () => void;
    children: Snippet;
    /** Visible height, capped at the peek height, so docked controls can sit above it. */
    offset?: number;
    /** True when the sheet is above its peek height. */
    expanded?: boolean;
  } = $props();

  const TOP_GAP = 64;
  let sheet: HTMLElement;
  let body: HTMLElement;
  let viewport = $state(0);
  let peek = $state(200);
  let snap = $state<Snap>('peek');
  let dragHeight = $state<number | null>(null);
  const heights = $derived({
    peek,
    half: Math.max(peek, Math.round(viewport * 0.52)),
    full: Math.max(peek, viewport - TOP_GAP)
  });
  const height = $derived(dragHeight ?? heights[snap]);

  $effect(() => {
    offset = Math.min(height, peek);
    expanded = height > peek + 8;
  });

  // Peek shows everything up to and including the element marked [data-sheet-peek].
  $effect(() => {
    const measure = () => {
      const marker = body.querySelector('[data-sheet-peek]');
      if (!marker) return;
      const top = sheet.getBoundingClientRect().top;
      const safeArea = parseFloat(getComputedStyle(body).paddingBottom) || 0;
      // Stop just short of the next row so the peek edge reads as a deliberate cut.
      peek = Math.ceil(marker.getBoundingClientRect().bottom - top + body.scrollTop + 6 + safeArea);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    measure();
    return () => observer.disconnect();
  });

  // Drag physics from Bencho: start after 6px, dismiss past 108px or a fast 34px flick.
  let gesture: {
    x: number;
    y: number;
    height: number;
    lastY: number;
    lastT: number;
    velocity: number;
    active: boolean;
  } | null = null;

  function pointerdown(event: PointerEvent) {
    if (event.button !== 0 || (event.target as Element).closest('input, select, textarea')) return;
    // At full height the content scrolls; only the header grip drags.
    if (snap === 'full' && !(event.target as Element).closest('[data-sheet-grip]')) return;
    gesture = {
      x: event.clientX,
      y: event.clientY,
      height,
      lastY: event.clientY,
      lastT: event.timeStamp,
      velocity: 0,
      active: false
    };
  }

  function pointermove(event: PointerEvent) {
    if (!gesture) return;
    const dy = event.clientY - gesture.y;
    if (!gesture.active) {
      if (Math.abs(dy) < 6) return;
      // A sideways swipe belongs to the row under the finger, not the sheet.
      if (Math.abs(event.clientX - gesture.x) > Math.abs(dy)) {
        gesture = null;
        return;
      }
      gesture.active = true;
      sheet.setPointerCapture(event.pointerId);
    }
    const dt = Math.max(1, event.timeStamp - gesture.lastT);
    gesture.velocity = 0.7 * ((event.clientY - gesture.lastY) / dt) + 0.3 * gesture.velocity;
    gesture.lastY = event.clientY;
    gesture.lastT = event.timeStamp;
    dragHeight = Math.max(0, Math.min(heights.full, gesture.height - dy));
  }

  function pointerup() {
    const current = gesture;
    gesture = null;
    if (!current?.active || dragHeight === null) return;
    // A drag is not a tap: swallow the click that follows the release.
    const swallow = (event: Event) => event.stopPropagation();
    window.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallow, true));
    const pulled = heights.peek - dragHeight;
    const flick = Math.abs(current.velocity) > 0.55;
    if (pulled > 108 || (pulled > 34 && flick && current.velocity > 0)) {
      dragHeight = null;
      onclose();
      return;
    }
    const order: Snap[] = ['peek', 'half', 'full'];
    const at = dragHeight;
    let next: Snap;
    if (flick) {
      const candidates = current.velocity < 0 ? order : [...order].reverse();
      next =
        candidates.find((s) => (current.velocity < 0 ? heights[s] > at : heights[s] < at)) ??
        candidates.at(-1)!;
    } else
      next = order.reduce((a, b) =>
        Math.abs(heights[b] - at) < Math.abs(heights[a] - at) ? b : a
      );
    dragHeight = null;
    snap = next;
    if (next !== 'full') body.scrollTop = 0;
  }

  function cycle() {
    snap = snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'peek';
    if (snap === 'peek') body.scrollTop = 0;
  }
</script>

<svelte:window bind:innerHeight={viewport} />

<section
  class="sheet glass"
  class:dragging={dragHeight !== null}
  class:scrolls={snap === 'full'}
  aria-label={label}
  bind:this={sheet}
  style:height="{heights.full}px"
  style:transform="translateY({heights.full - height}px)"
  onpointerdown={pointerdown}
  onpointermove={pointermove}
  onpointerup={pointerup}
  onpointercancel={pointerup}
  out:fly|global={{ y: 240, opacity: 0, duration: 300, easing: quintOut }}
>
  <button
    class="grip"
    type="button"
    data-sheet-grip
    aria-label={snap === 'full' ? 'Collapse details' : 'Expand details'}
    aria-expanded={snap !== 'peek'}
    onclick={cycle}
  ></button>
  <div class="body" bind:this={body}>{@render children()}</div>
</section>

<style>
  .sheet {
    position: fixed;
    inset: auto 0 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    box-shadow: var(--shadow-xl);
    touch-action: none;
    transition: transform 420ms cubic-bezier(0.22, 0.9, 0.28, 1);
  }
  @starting-style {
    .sheet {
      transform: translateY(100%) !important;
    }
  }
  .dragging {
    transition: none;
  }
  /* The handle reads as a small bar but takes a finger-sized band at the top. */
  .grip {
    flex: none;
    height: 22px;
    display: grid;
    place-items: center;
    position: relative;
  }
  .grip::after {
    content: '';
    position: absolute;
    inset: 0 0 -10px;
  }
  .grip::before {
    content: '';
    width: 36px;
    height: 5px;
    border-radius: var(--radius-pill);
    background: rgb(245 245 245 / 0.22);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom);
    overscroll-behavior: contain;
  }
  .scrolls .body {
    overflow-y: auto;
    touch-action: pan-y;
  }
</style>
