<script lang="ts">
  import type { OrbitalElementsWithRates } from '$utils/helio';
  import { formatLightTime } from './orbits';
  import { inView, reveal, tilt } from './motion';

  type Craft = { id: string; name: string; subtitle: string; au: number };
  let {
    spacecraft,
    planets,
    total,
    builtAt
  }: {
    spacecraft: Craft[];
    planets: { id: string; name: string; elements: OrbitalElementsWithRates }[];
    total: number;
    builtAt: string;
  } = $props();

  // Log-scale distance axis, 0.25 AU to 250 AU.
  const MIN = Math.log10(0.25);
  const MAX = Math.log10(250);
  const x = (au: number) => ((Math.log10(au) - MIN) / (MAX - MIN)) * 100;

  const labelled = new Set(['parker-solar-probe', 'new-horizons', 'voyager-1']);
  // Stack dots that would overlap into columns.
  const dots = $derived(
    spacecraft.map((craft, i) => {
      let stack = 0;
      for (let j = i - 1; j >= 0 && x(craft.au) - x(spacecraft[j].au) < 1.2; j--) stack++;
      return { ...craft, x: x(craft.au), stack };
    })
  );
  const ticks = $derived(
    planets
      .filter((planet) => planet.id !== 'pluto')
      .map((planet) => ({ name: planet.name, x: x(planet.elements.a[0]) }))
  );

  const featured = $derived(
    ['voyager-1', 'jwst', 'parker-solar-probe', 'europa-clipper']
      .map((id) => spacecraft.find((craft) => craft.id === id))
      .filter((craft): craft is Craft => !!craft)
  );
  const date = $derived(
    new Date(builtAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    })
  );

  // Next launch from the explorer's Launch Library proxy, fetched once on view.
  type Launch = { name: string; date: string; provider: string };
  let launch = $state<Launch | null>(null);
  let now = $state(Date.now());
  let requested = false;
  function onView(visible: boolean) {
    if (!visible || requested) return;
    requested = true;
    fetch('/api/launches')
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { launches?: Launch[] } | null) => {
        launch = body?.launches?.[0] ?? null;
      })
      .catch(() => {});
  }
  $effect(() => {
    if (!launch) return;
    const timer = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(timer);
  });
  const countdown = $derived.by(() => {
    if (!launch) return '';
    const s = Math.max(0, Math.floor((Date.parse(launch.date) - now) / 1000));
    const pad = (n: number) => String(n).padStart(2, '0');
    return `T−${Math.floor(s / 86400)}d ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  });
</script>

<section class="missions" aria-labelledby="missions-title" use:inView={onView}>
  <div class="intro container" data-reveal use:reveal>
    <p class="eyebrow-lg">04 · Missions</p>
    <h2 id="missions-title">{total} spacecraft, wherever they are.</h2>
    <p class="body">
      From Parker Solar Probe grazing the Sun to Voyager 1 in interstellar space. Each position
      comes from JPL Horizons and carries its epoch.
    </p>
  </div>

  <figure class="ruler-wrap container" data-reveal use:reveal style:--d="100ms">
    <div class="scroller">
      <div class="ruler">
        <div class="axis"></div>
        {#each ticks as tick (tick.name)}
          <span class="tick" style:left="{tick.x}%"><span>{tick.name}</span></span>
        {/each}
        {#each dots as dot, i (dot.id)}
          <a
            class="dot"
            class:named={labelled.has(dot.id)}
            href="/app?body={dot.id}"
            style:left="{dot.x}%"
            style:--stack={dot.stack}
            style:--d="{300 + i * 40}ms"
            title="{dot.name}, {dot.au.toFixed(2)} AU"
          >
            <span class="label">{dot.name}</span>
          </a>
        {/each}
      </div>
    </div>
    <figcaption>
      Distance from the Sun on {date}, logarithmic scale. Spacecraft orbiting a planet share its
      distance.
    </figcaption>
  </figure>

  <ul class="cards container">
    {#each featured as craft, i (craft.id)}
      <li data-reveal use:reveal style:--d="{i * 80}ms">
        <a class="card" href="/app?body={craft.id}" use:tilt>
          <span class="sheen" aria-hidden="true"></span>
          <span class="name">{craft.name}</span>
          <span class="subtitle">{craft.subtitle}</span>
          <span class="figure"
            >{craft.au < 10 ? craft.au.toFixed(2) : craft.au.toFixed(1)}<small>AU</small></span
          >
          <span class="light">Light from the Sun: {formatLightTime(craft.au)}</span>
        </a>
      </li>
    {/each}
  </ul>

  {#if launch}
    <div class="container" data-reveal use:reveal>
      <a class="launch" href="/app">
        <span class="eyebrow-lg">Next launch</span>
        <span class="launch-name">{launch.name}</span>
        <span class="launch-meta">{launch.provider}</span>
        <span class="countdown">{countdown}</span>
      </a>
      <p class="launch-source">
        Schedule from The Space Devs Launch Library 2. Times are provisional.
      </p>
    </div>
  {/if}
</section>

<style>
  .missions {
    padding-block: clamp(96px, 16vh, 180px);
  }
  h2 {
    max-width: 14ch;
    font-size: clamp(2.25rem, 4.4vw, 4rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }
  .body {
    max-width: 44ch;
    margin-top: 20px;
    font-size: clamp(1rem, 1.2vw, 1.125rem);
    line-height: 1.55;
    color: var(--text-2);
  }

  .ruler-wrap {
    margin-top: clamp(56px, 9vh, 96px);
  }
  .scroller {
    overflow-x: auto;
    scrollbar-width: none;
    margin-inline: calc(var(--gutter) * -1);
    padding-inline: var(--gutter);
  }
  .ruler {
    position: relative;
    min-width: 760px;
    height: 220px;
  }
  .axis {
    position: absolute;
    left: 0;
    right: 0;
    top: 150px;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, #fff4, var(--surface-3) 30%, var(--surface-2));
  }
  .tick {
    position: absolute;
    top: 144px;
    width: 1px;
    height: 14px;
    background: var(--surface-4);
  }
  .tick span {
    position: absolute;
    top: 24px;
    left: 0;
    translate: -50% 0;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-3);
    white-space: nowrap;
  }
  .dot {
    position: absolute;
    top: calc(136px - var(--stack) * 14px);
    width: 10px;
    height: 10px;
    margin-left: -5px;
    border-radius: 50%;
    background: var(--text-1);
    opacity: 0;
    scale: 0.4;
    transition:
      opacity 500ms var(--ease-out) var(--d),
      scale 500ms var(--ease-pop) var(--d);
  }
  :global([data-in]) .dot {
    opacity: 1;
    scale: 1;
  }
  .dot::after {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: rgb(245 245 245 / 0.1);
    opacity: 0;
    scale: 0.6;
    transition:
      opacity 200ms ease,
      scale 260ms var(--ease-overshoot);
  }
  .dot:hover::after,
  .dot:focus-visible::after {
    opacity: 1;
    scale: 1;
  }
  .label {
    position: absolute;
    bottom: 22px;
    left: 50%;
    translate: -50% 0;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    color: var(--text-2);
    opacity: 0;
    transition: opacity 200ms ease;
  }
  .named .label,
  .dot:hover .label,
  .dot:focus-visible .label {
    opacity: 1;
  }
  .dot:hover .label {
    color: var(--text-1);
  }
  figcaption {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-3);
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: clamp(56px, 9vh, 96px);
  }
  .card {
    --rx: 0deg;
    --ry: 0deg;
    --mx: 50%;
    --my: 0%;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 300px;
    padding: 28px;
    overflow: hidden;
    border-radius: var(--radius-2xl);
    background: var(--surface-1);
    transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
    transition:
      transform 500ms cubic-bezier(0.22, 0.9, 0.28, 1),
      background-color 240ms ease,
      translate 380ms var(--spring-bounce);
  }
  .card:hover {
    background: var(--surface-2);
    translate: 0 -6px;
    transition-duration: 120ms, 240ms, 380ms;
  }
  .sheen {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      420px circle at var(--mx) var(--my),
      rgb(255 255 255 / 0.09),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 300ms ease;
    pointer-events: none;
  }
  .card:hover .sheen {
    opacity: 1;
  }
  .name {
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .subtitle {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.45;
    color: var(--text-2);
  }
  .figure {
    margin-top: auto;
    padding-top: 32px;
    font-size: clamp(2.5rem, 3.6vw, 3.5rem);
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .figure small {
    margin-left: 6px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.14em;
    color: var(--text-2);
  }
  .light {
    margin-top: 10px;
    font-size: 13px;
    color: var(--text-3);
  }

  .launch {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 24px;
    margin-top: 12px;
    padding: 22px 28px;
    border-radius: var(--radius-2xl);
    background: var(--surface-1);
    transition: background-color 240ms ease;
  }
  .launch:hover {
    background: var(--surface-2);
  }
  .launch-name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .launch-meta {
    color: var(--text-2);
    font-size: 14px;
  }
  .countdown {
    font-size: 1.25rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }
  .launch-source {
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-3);
  }

  @media (max-width: 1080px) {
    .cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 720px) {
    .missions .cards {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      width: 100%;
      padding-inline: var(--gutter);
    }
    .cards li {
      flex: 0 0 78%;
      scroll-snap-align: center;
    }
    .card {
      min-height: 260px;
      padding: 24px;
    }
    .launch {
      grid-template-columns: 1fr auto;
      gap: 8px 16px;
      padding: 20px;
    }
    .launch .eyebrow-lg {
      grid-column: 1 / -1;
    }
    .launch-meta {
      display: none;
    }
  }
</style>
