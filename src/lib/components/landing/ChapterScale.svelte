<script lang="ts">
  import type { OrbitalElementsWithRates } from '$utils/helio';
  import OrbitMap from './OrbitMap.svelte';
  import { formatLightTime } from './orbits';
  import { scrollProgress } from './motion';

  type Planet = { id: string; name: string; elements: OrbitalElementsWithRates };
  let { planets, voyagerAU }: { planets: Planet[]; voyagerAU: number | null } = $props();

  const a = (id: string) => planets.find((planet) => planet.id === id)!.elements.a[0];
  const neptune = $derived(a('neptune'));
  const steps = $derived([
    {
      title: 'The solar system, to scale.',
      body: 'Every orbit is drawn from JPL planetary elements, and every planet sits where it is right now. Nothing is placed by hand.'
    },
    {
      title: `${(a('jupiter') - a('mars')).toFixed(1)} AU of open space.`,
      body: `Past Mars, the asteroid belt thins out long before Jupiter, ${a('jupiter').toFixed(1)} times farther from the Sun than Earth.`
    },
    {
      title: `Sunlight takes ${formatLightTime(neptune)} to reach Neptune.`,
      body: voyagerAU
        ? `Neptune orbits ${neptune.toFixed(0)} AU out. Voyager 1 is ${(voyagerAU / neptune).toFixed(1)} times farther still.`
        : `Neptune orbits ${neptune.toFixed(0)} AU out, at the edge of the planets.`
    }
  ]);

  let progress = $state(0);
  const now = new Date();
  const zoom = $derived(Math.min(1, Math.max(0, (progress - 0.06) / 0.86)));
  const eased = $derived(zoom * zoom * (3 - 2 * zoom));
  const extent = $derived(Math.exp(Math.log(1.7) + (Math.log(38) - Math.log(1.7)) * eased));
  const step = $derived(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
</script>

<section class="scale" aria-labelledby="scale-title" use:scrollProgress={(p) => (progress = p)}>
  <div class="sticky">
    <div class="map-frame">
      <OrbitMap {planets} date={now} {extent} ruler />
    </div>
    <div class="layout container">
      <div class="captions">
        <p class="eyebrow-lg">01 · Scale</p>
        <div class="stack">
          {#each steps as item, i (i)}
            <div class="caption" class:active={i === step} aria-hidden={i !== step}>
              <h2 id={i === 0 ? 'scale-title' : undefined}>{item.title}</h2>
              <p>{item.body}</p>
            </div>
          {/each}
        </div>
        <div class="progress" aria-hidden="true">
          {#each steps as _, i (i)}<span class:on={i <= step}></span>{/each}
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .scale {
    height: 340vh;
  }
  .sticky {
    position: sticky;
    top: 0;
    height: 100svh;
    overflow: clip;
  }
  .map-frame {
    position: absolute;
    inset: 0 0 0 38%;
  }
  .layout {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    align-items: center;
    pointer-events: none;
  }
  .captions {
    grid-column: 1 / span 5;
  }
  .stack {
    display: grid;
  }
  .caption {
    grid-area: 1 / 1;
    opacity: 0;
    translate: 0 18px;
    filter: blur(6px);
    transition:
      opacity 500ms var(--ease-out),
      translate 700ms var(--ease-out),
      filter 500ms var(--ease-out);
  }
  .caption.active {
    opacity: 1;
    translate: 0 0;
    filter: none;
  }
  h2 {
    font-size: clamp(2.25rem, 4.4vw, 4rem);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 600;
  }
  .caption p {
    max-width: 36ch;
    margin-top: 20px;
    font-size: clamp(1rem, 1.2vw, 1.125rem);
    line-height: 1.55;
    color: var(--text-2);
  }
  .progress {
    display: flex;
    gap: 6px;
    margin-top: 36px;
  }
  .progress span {
    width: 28px;
    height: 3px;
    border-radius: var(--radius-pill);
    background: var(--surface-3);
    transition: background-color 400ms ease;
  }
  .progress .on {
    background: var(--text-1);
  }
  @media (max-width: 900px) {
    .scale {
      height: 300vh;
    }
    .map-frame {
      inset: 0 0 34% 0;
    }
    .layout {
      align-items: end;
      padding-bottom: clamp(72px, 12vh, 112px);
    }
    .captions {
      grid-column: 1 / -1;
    }
    .caption p {
      margin-top: 12px;
    }
    .progress {
      margin-top: 24px;
    }
  }
</style>
