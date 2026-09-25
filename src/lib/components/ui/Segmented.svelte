<script lang="ts" generics="T extends string | number">
  import { prefersReducedMotion } from 'svelte/motion';

  let {
    options,
    value,
    onchange,
    label,
    fill = false
  }: {
    options: { value: T; label: string }[];
    /** Null when no option applies (for example, speed while paused). */
    value: T | null;
    onchange: (value: T) => void;
    label: string;
    /** Stretch to the container with equal-width segments. */
    fill?: boolean;
  } = $props();

  let track: HTMLDivElement;
  let indicator: HTMLSpanElement;
  const buttons: HTMLButtonElement[] = $state([]);
  let placed: { left: number; width: number } | null = null;
  const selected = $derived(options.findIndex((option) => option.value === value));

  // Bencho's tab indicator: stretch across both segments, then settle onto the target.
  function place(animate: boolean) {
    const target = buttons[selected];
    if (!target) {
      indicator.style.opacity = '0';
      placed = null;
      return;
    }
    const next = { left: target.offsetLeft, width: target.offsetWidth };
    indicator.style.opacity = '1';
    indicator.style.left = `${next.left}px`;
    indicator.style.width = `${next.width}px`;
    if (animate && placed && placed.left !== next.left && !prefersReducedMotion.current) {
      const left = Math.min(placed.left, next.left);
      const right = Math.max(placed.left + placed.width, next.left + next.width);
      indicator.animate(
        [
          {
            left: `${placed.left}px`,
            width: `${placed.width}px`,
            easing: 'cubic-bezier(.32,.72,.24,1)'
          },
          {
            offset: 190 / 610,
            left: `${left}px`,
            width: `${right - left}px`,
            easing: 'cubic-bezier(.28,1.28,.36,1)'
          },
          { left: `${next.left}px`, width: `${next.width}px` }
        ],
        { duration: 610 }
      );
    }
    placed = next;
  }

  $effect(() => {
    void selected;
    place(true);
  });
  $effect(() => {
    const observer = new ResizeObserver(() => place(false));
    observer.observe(track);
    return () => observer.disconnect();
  });

  function keydown(event: KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = (Math.max(selected, 0) + step + options.length) % options.length;
    onchange(options[index].value);
    buttons[index]?.focus();
  }
</script>

<div
  class="segmented"
  class:fill
  role="radiogroup"
  aria-label={label}
  tabindex="-1"
  bind:this={track}
  onkeydown={keydown}
>
  <span class="indicator" bind:this={indicator} aria-hidden="true"></span>
  {#each options as option, index (option.value)}
    <button
      type="button"
      role="radio"
      aria-checked={index === selected}
      tabindex={index === Math.max(selected, 0) ? 0 : -1}
      bind:this={buttons[index]}
      onclick={() => onchange(option.value)}>{option.label}</button
    >
  {/each}
</div>

<style>
  .segmented {
    position: relative;
    display: inline-flex;
    padding: 3px;
    border-radius: var(--radius-pill);
    background: rgb(245 245 245 / 0.06);
    isolation: isolate;
  }
  .fill {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
  }
  .indicator {
    position: absolute;
    z-index: -1;
    top: 3px;
    bottom: 3px;
    left: 0;
    width: 0;
    opacity: 0;
    border-radius: var(--radius-pill);
    background: rgb(245 245 245 / 0.14);
    box-shadow: var(--shadow-sm);
    transition: opacity var(--dur-fast) ease;
  }
  button {
    height: 30px;
    padding: 0 12px;
    border-radius: var(--radius-pill);
    color: var(--text-2);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    transition: color var(--dur-fast) ease;
  }
  button:hover,
  button[aria-checked='true'] {
    color: var(--text-1);
  }
  .fill button {
    padding: 0 6px;
  }
  @media (pointer: coarse) {
    button {
      height: 38px;
    }
  }
</style>
