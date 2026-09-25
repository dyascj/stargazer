<script lang="ts" module>
  import type { TrackedObject } from '$lib/registry/types';

  // Textured worlds have no flat color in the registry; these are their average albedo tones.
  const TONES: Record<string, string> = {
    sun: '#ffc766',
    mercury: '#9c9690',
    venus: '#dcc394',
    earth: '#5b9bd5',
    moon: '#bcb9b3',
    mars: '#d0704a',
    jupiter: '#d8b48e',
    saturn: '#e3cf9c',
    uranus: '#a4d8e0',
    neptune: '#5b80d6'
  };
  const CRAFT = new Set(['spacecraft', 'lander', 'earth-satellite']);

  export function glyphColor(body: TrackedObject): string {
    const metadata = body.metadata as { solidColor?: string; color?: string };
    return TONES[body.id] ?? metadata.solidColor ?? metadata.color ?? '#8a8a8a';
  }
</script>

<script lang="ts">
  let { body, size = 12 }: { body: TrackedObject; size?: number } = $props();
</script>

<span
  class="glyph"
  class:craft={CRAFT.has(body.type)}
  class:ringed={body.id === 'saturn'}
  class:star={body.type === 'star'}
  style:--tone={glyphColor(body)}
  style:--size="{size}px"
  aria-hidden="true"
></span>

<style>
  .glyph {
    position: relative;
    flex: none;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: radial-gradient(
      circle at 34% 30%,
      color-mix(in oklab, var(--tone), white 30%),
      var(--tone) 45%,
      color-mix(in oklab, var(--tone), black 55%)
    );
  }
  .star {
    box-shadow: 0 0 calc(var(--size) * 0.8) color-mix(in oklab, var(--tone), transparent 40%);
  }
  .ringed::after {
    content: '';
    position: absolute;
    inset: 38% -32%;
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--tone), transparent 35%);
    transform: rotate(-20deg);
  }
  /* Spacecraft read as a small neutral diamond, not a world. */
  .craft {
    background: var(--text-2);
    border-radius: 2px;
    scale: 0.62;
    rotate: 45deg;
  }
</style>
