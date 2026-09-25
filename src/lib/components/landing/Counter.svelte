<script lang="ts">
  import { onMount } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { formatNumber } from '$utils/format';

  /** Ticks up from zero the first time it scrolls into view. Renders the final value on the server. */
  let { value, duration = 1400 }: { value: number; duration?: number } = $props();

  let node: HTMLSpanElement;
  let animated = $state<number | null>(null);

  onMount(() => {
    if (prefersReducedMotion.current) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < innerHeight) return; // Already on screen: never flash to zero.
    animated = 0;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        animated = Math.round(value * (1 - Math.pow(1 - t, 4)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  });
</script>

<span bind:this={node} class="counter">{formatNumber(animated ?? value)}</span>

<style>
  .counter {
    font-variant-numeric: tabular-nums;
  }
</style>
