<script lang="ts">
  import type { OrbitalElementsWithRates } from '$utils/helio';
  import { prefersReducedMotion } from 'svelte/motion';
  import { easeInOutCubic } from '$utils/easing';
  import OrbitMap from './OrbitMap.svelte';
  import { inView, reveal } from './motion';

  let { planets }: { planets: { id: string; name: string; elements: OrbitalElementsWithRates }[] } =
    $props();

  const FIRST = 1800;
  const LAST = 2050;
  const today = new Date();
  const thisYear = today.getUTCFullYear() + today.getUTCMonth() / 12;
  const moments = [
    { year: 1846.73, text: 'Neptune is discovered, found by prediction.' },
    { year: 1930.13, text: 'Pluto is discovered at Lowell Observatory.' },
    { year: 1977.67, text: 'Voyager 1 and 2 launch toward the outer planets.' },
    { year: thisYear, text: 'Today.' }
  ];

  let year = $state(thisYear);
  const date = $derived(new Date(Date.UTC(FIRST, 0, 1) + (year - FIRST) * 365.25 * 86_400_000));
  const moment = $derived(moments.find((item) => Math.abs(item.year - year) < 2.5));

  // First view: sweep from 1800 to today once. Any input takes over.
  let played = false;
  let frame = 0;
  function onView(visible: boolean) {
    if (!visible || played) return;
    played = true;
    if (prefersReducedMotion.current) return;
    const start = performance.now();
    const duration = 5200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      year = FIRST + (thisYear - FIRST) * easeInOutCubic(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(frame);
  }
  $effect(() => stop);
</script>

<section class="time container" aria-labelledby="time-title" use:inView={onView}>
  <div class="copy" data-reveal use:reveal>
    <p class="eyebrow-lg">05 · Time</p>
    <h2 id="time-title">Move through {LAST - FIRST} years.</h2>
    <p class="body">
      Scrub from {FIRST} to {LAST} and watch the planets move along their real orbits. Pause, rewind,
      or run a year in seconds.
    </p>

    <div class="readout" aria-hidden="true">
      <span class="year">{Math.floor(year)}</span>
      <span class="moment">{moment?.text ?? ''}</span>
    </div>

    <div class="slider">
      <input
        type="range"
        min={FIRST}
        max={LAST}
        step="0.05"
        bind:value={year}
        onpointerdown={stop}
        onkeydown={stop}
        aria-label="Year"
        aria-valuetext={String(Math.floor(year))}
        style:--fill="{((year - FIRST) / (LAST - FIRST)) * 100}%"
      />
      <div class="marks" aria-hidden="true">
        {#each moments as item (item.year)}
          <span style:left="{((item.year - FIRST) / (LAST - FIRST)) * 100}%"></span>
        {/each}
      </div>
      <div class="bounds" aria-hidden="true"><span>{FIRST}</span><span>{LAST}</span></div>
    </div>
  </div>

  <div class="map-frame">
    <OrbitMap {planets} {date} extent={40} />
  </div>
</section>

<style>
  .time {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    column-gap: 24px;
    align-items: center;
    padding-block: clamp(96px, 16vh, 180px);
  }
  .copy {
    grid-column: 1 / span 5;
  }
  .map-frame {
    position: relative;
    grid-column: 6 / -1;
    aspect-ratio: 1;
    overflow: clip;
    mask-image: radial-gradient(closest-side, #000 82%, transparent);
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
  .readout {
    display: flex;
    flex-direction: column;
    margin-top: 48px;
  }
  .year {
    font-size: clamp(4.5rem, 9vw, 8.5rem);
    font-weight: 500;
    line-height: 0.9;
    letter-spacing: -0.05em;
    font-variant-numeric: tabular-nums;
  }
  .moment {
    min-height: 1.5em;
    margin-top: 12px;
    color: var(--text-2);
  }

  .slider {
    position: relative;
    margin-top: 28px;
  }
  input {
    -webkit-appearance: none;
    appearance: none;
    display: block;
    width: 100%;
    height: 28px;
    background: transparent;
    cursor: pointer;
  }
  input::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: var(--radius-pill);
    background: linear-gradient(90deg, var(--text-1) var(--fill), var(--surface-3) var(--fill));
  }
  input::-moz-range-track {
    height: 4px;
    border-radius: var(--radius-pill);
    background: linear-gradient(90deg, var(--text-1) var(--fill), var(--surface-3) var(--fill));
  }
  input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    margin-top: -8px;
    border-radius: 50%;
    background: var(--text-1);
    box-shadow: 0 0 0 6px rgb(245 245 245 / 0.1);
    transition: box-shadow 200ms ease;
  }
  input::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border: 0;
    border-radius: 50%;
    background: var(--text-1);
    box-shadow: 0 0 0 6px rgb(245 245 245 / 0.1);
  }
  input:hover::-webkit-slider-thumb,
  input:active::-webkit-slider-thumb {
    box-shadow: 0 0 0 10px rgb(245 245 245 / 0.12);
  }
  input:focus-visible {
    outline-offset: 6px;
    border-radius: var(--radius-sm);
  }
  .marks {
    position: absolute;
    inset: 22px 10px auto;
    height: 0;
    pointer-events: none;
  }
  .marks span {
    position: absolute;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    border-radius: 50%;
    background: var(--text-3);
  }
  .bounds {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 900px) {
    .time {
      display: flex;
      flex-direction: column;
    }
    .map-frame {
      order: -1;
      width: 100%;
      margin-bottom: 24px;
    }
    .readout {
      margin-top: 36px;
    }
  }
</style>
