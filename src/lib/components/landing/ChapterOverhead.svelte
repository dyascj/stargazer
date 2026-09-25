<script lang="ts">
  import { onMount } from 'svelte';
  import { reveal } from './motion';

  let {
    satellites,
    total,
    iss
  }: {
    total: number;
    satellites: { id: string; name: string; altitudeKm: number }[];
    iss: { altitude: string; speed: string; period: string; speedKmh: number };
  } = $props();

  const EARTH_KM = 6371;
  const MU = 398600.4418; // km^3/s^2
  const SPEEDUP = 460; // ISS laps in about 12 s
  const labelled: Record<string, string> = {
    iss: 'ISS',
    'gps-navstar-66': 'GPS',
    'goes-18': 'Geostationary'
  };

  const maxRadius = $derived(Math.max(...satellites.map((sat) => EARTH_KM + sat.altitudeKm)));
  const orbits = $derived(
    satellites
      .map((sat, i) => {
        const r = EARTH_KM + sat.altitudeKm;
        return {
          ...sat,
          r: (r / maxRadius) * 100,
          seconds: (2 * Math.PI * Math.sqrt(r ** 3 / MU)) / SPEEDUP,
          phase: (i * 137.5) % 360,
          label: labelled[sat.id]
        };
      })
      .sort((a, b) => a.r - b.r)
  );
  const earth = $derived((EARTH_KM / maxRadius) * 100);

  // Distance the ISS covers while the visitor is on the page.
  let traveled = $state(0);
  onMount(() => {
    if (!iss.speedKmh) return;
    const start = performance.now();
    const timer = setInterval(() => {
      traveled = ((performance.now() - start) / 3_600_000) * iss.speedKmh;
    }, 100);
    return () => clearInterval(timer);
  });
</script>

<section class="overhead container" aria-labelledby="overhead-title">
  <div class="copy">
    <div data-reveal use:reveal>
      <p class="eyebrow-lg">03 · Overhead</p>
      <h2 id="overhead-title">Satellites, right above you.</h2>
      <p class="body">
        The ISS, Tiangong and {total - 2} more satellites move on fresh CelesTrak elements, propagated
        with SGP4 in your browser. See where they are and when they pass over you.
      </p>
    </div>
    <dl data-reveal use:reveal style:--d="80ms">
      <div>
        <dt>ISS altitude</dt>
        <dd>{iss.altitude}</dd>
      </div>
      <div>
        <dt>Speed</dt>
        <dd>{iss.speed}</dd>
      </div>
      <div>
        <dt>One orbit</dt>
        <dd>{iss.period}</dd>
      </div>
    </dl>
    {#if iss.speedKmh}
      <p class="ticker" data-reveal use:reveal style:--d="160ms">
        Since you opened this page, the ISS has traveled
        <strong>{Math.floor(traveled).toLocaleString('en-US')} km</strong>.
      </p>
    {/if}
    <a class="visit" href="/app?body=iss" data-reveal use:reveal style:--d="220ms"
      >Track the ISS
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"
        ><path
          d="M3 8h9m-4-4 4 4-4 4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        /></svg
      ></a
    >
  </div>

  <figure class="diagram">
    <svg viewBox="-104 -104 208 208" role="img" aria-labelledby="overhead-caption">
      <defs>
        <radialGradient id="overhead-earth" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stop-color="#1d3350" />
          <stop offset="0.7" stop-color="#0a1422" />
          <stop offset="1" stop-color="#05080d" />
        </radialGradient>
      </defs>
      {#each orbits as orbit (orbit.id)}
        <circle r={orbit.r} class="ring" />
      {/each}
      <circle r={earth} fill="url(#overhead-earth)" />
      <circle r={earth + 0.6} class="limb" />
      {#each orbits as orbit (orbit.id)}
        <g
          class="orbiter"
          class:station={orbit.id === 'iss'}
          style:animation-duration="{orbit.seconds}s"
          style:animation-delay="-{(orbit.phase / 360) * orbit.seconds}s"
        >
          <circle cx={orbit.r} r={orbit.id === 'iss' ? 1.6 : 1.1} />
        </g>
      {/each}
      {#each orbits.filter((orbit) => orbit.label) as orbit (orbit.id)}
        <text x="0" y={-orbit.r - 2.2} text-anchor="middle">{orbit.label}</text>
      {/each}
    </svg>
    <figcaption id="overhead-caption">
      Orbital altitudes of the tracked satellites, to scale. Motion sped up {SPEEDUP} times.
    </figcaption>
  </figure>
</section>

<style>
  .overhead {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    column-gap: 24px;
    align-items: center;
    padding-block: clamp(96px, 16vh, 180px);
  }
  .copy {
    grid-column: 1 / span 5;
  }
  .diagram {
    grid-column: 7 / -1;
    margin: 0;
  }
  h2 {
    font-size: clamp(2.25rem, 4.4vw, 4rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }
  .body {
    max-width: 38ch;
    margin-top: 20px;
    font-size: clamp(1rem, 1.2vw, 1.125rem);
    line-height: 1.55;
    color: var(--text-2);
  }
  dl {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 40px;
  }
  dl div {
    padding: 16px 18px;
    border-radius: var(--radius-lg);
    background: var(--surface-1);
  }
  dt {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  dd {
    margin: 8px 0 0;
    font-size: clamp(1.0625rem, 1.4vw, 1.3125rem);
    white-space: nowrap;
    font-weight: 500;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .ticker {
    margin-top: 28px;
    color: var(--text-2);
    line-height: 1.5;
  }
  .ticker strong {
    color: var(--text-1);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .visit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    font-weight: 500;
  }
  .visit svg {
    transition: translate 260ms var(--ease-overshoot);
  }
  .visit:hover svg {
    translate: 3px 0;
  }

  svg[role='img'] {
    width: 100%;
    overflow: visible;
  }
  .ring {
    fill: none;
    stroke: rgb(245 245 245 / 0.12);
    stroke-width: 0.3;
  }
  .limb {
    fill: none;
    stroke: rgb(92 213 255 / 0.5);
    stroke-width: 0.5;
  }
  .orbiter {
    fill: var(--text-1);
    animation: orbit linear infinite;
  }
  .orbiter.station {
    fill: var(--accent-strong);
  }
  @keyframes orbit {
    to {
      rotate: -360deg;
    }
  }
  text {
    fill: var(--text-2);
    font-size: 3.4px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  figcaption {
    margin-top: 24px;
    text-align: center;
    font-size: 12px;
    color: var(--text-3);
  }

  @media (max-width: 900px) {
    .overhead {
      display: flex;
      flex-direction: column-reverse;
      align-items: stretch;
      gap: 48px;
    }
    dl {
      margin-top: 32px;
    }
    dl div {
      padding: 14px;
    }
  }
</style>
