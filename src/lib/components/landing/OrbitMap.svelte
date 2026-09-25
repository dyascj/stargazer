<script lang="ts">
  import type { OrbitalElementsWithRates } from '$utils/helio';
  import { orbitPath, planetXY } from './orbits';

  type Planet = { id: string; name: string; elements: OrbitalElementsWithRates };
  let {
    planets,
    date,
    extent,
    labels = true,
    ruler = false
  }: {
    planets: Planet[];
    date: Date;
    /** Half the shorter side of the map, in AU. */
    extent: number;
    labels?: boolean;
    /** Show a map scale bar. */
    ruler?: boolean;
  } = $props();

  const id = $props.id();
  let width = $state(0);
  let height = $state(0);

  // Orbit shapes drift negligibly over the 1800-2050 range; draw them once.
  const paths = $derived(planets.map((planet) => orbitPath(planet.elements, new Date())));
  const scale = $derived(Math.min(width, height) / 2 / extent);
  const bodies = $derived(
    planets.map((planet) => {
      const [x, y] = planetXY(planet.elements, date);
      const radius = planet.elements.a[0] * scale;
      return {
        ...planet,
        x: x * scale,
        y: -y * scale,
        // Fade orbits that collapse toward the Sun or leave the frame.
        visibility: Math.min(1, Math.max(0, (radius - 5) / 24)),
        labelled: labels && radius > 34 && radius < Math.max(width, height) * 0.7,
        // Flip labels that would run off the right edge.
        flip: x * scale > width / 2 - 96
      };
    })
  );
  // Scale bar: the round AU length that draws closest to 120 px.
  const bar = $derived(
    [0.5, 1, 2, 5, 10, 20].reduce((best, au) =>
      Math.abs(au * scale - 120) < Math.abs(best * scale - 120) ? au : best
    )
  );
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width}
    <svg viewBox="{-width / 2} {-height / 2} {width} {height}" aria-hidden="true">
      <defs>
        <radialGradient id="glow-{id}">
          <stop offset="0" stop-color="#fff" />
          <stop offset="0.18" stop-color="#fff4e0" stop-opacity="0.9" />
          <stop offset="1" stop-color="#ffb366" stop-opacity="0" />
        </radialGradient>
      </defs>
      <g transform="scale({scale})">
        {#each paths as d, i (planets[i].id)}
          <path {d} class="orbit" style:opacity={bodies[i].visibility * 0.9} />
        {/each}
      </g>
      <circle r="22" fill="url(#glow-{id})" opacity="0.55" />
      <circle r="3.5" fill="#fff" />
      {#each bodies as body (body.id)}
        <g
          transform="translate({body.x} {body.y})"
          style:opacity={body.visibility}
          class:earth={body.id === 'earth'}
        >
          <circle r={body.id === 'earth' ? 4 : 3} class="dot" />
          {#if body.labelled}
            <text x={body.flip ? -9 : 9} y="4" text-anchor={body.flip ? 'end' : 'start'}
              >{body.name}</text
            >
          {/if}
        </g>
      {/each}
    </svg>
    {#if ruler}
      <div class="ruler" aria-hidden="true">
        <span class="bar" style:width="{bar * scale}px"></span>
        {bar} AU
      </div>
    {/if}
  {/if}
</div>

<style>
  .map {
    position: absolute;
    inset: 0;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .ruler {
    position: absolute;
    right: var(--gutter);
    bottom: clamp(28px, 6vh, 56px);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
  }
  .bar {
    height: 4px;
    border-radius: var(--radius-pill);
    background: var(--surface-4);
  }
  .orbit {
    fill: none;
    stroke: rgb(245 245 245 / 0.16);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .dot {
    fill: var(--text-1);
  }
  .earth .dot {
    fill: var(--accent-strong);
  }
  text {
    fill: var(--text-2);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .earth text {
    fill: var(--accent-strong);
  }
</style>
