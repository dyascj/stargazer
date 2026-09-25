<script lang="ts">
  import Counter from './Counter.svelte';
  import { reveal } from './motion';

  let {
    counts
  }: {
    counts: {
      planets: number;
      dwarfPlanets: number;
      moons: number;
      spacecraft: number;
      satellites: number;
      smallBodies: number;
    };
  } = $props();

  const items = $derived([
    { value: counts.planets, label: 'Planets', href: '/app?body=solarSystem' },
    { value: counts.moons, label: 'Moons', href: '/app?body=titan' },
    { value: counts.dwarfPlanets, label: 'Dwarf planets', href: '/app?body=pluto' },
    {
      value: counts.smallBodies,
      label: 'Asteroids, comets and distant worlds',
      href: '/app?body=halley'
    },
    { value: counts.spacecraft, label: 'Spacecraft and rovers', href: '/app?body=voyager-1' },
    { value: counts.satellites, label: 'Earth satellites', href: '/app?body=iss' }
  ]);
</script>

<section class="stats container" aria-label="What you can explore">
  <ul>
    {#each items as item, i (item.label)}
      <li data-reveal use:reveal style:--d="{i * 70}ms">
        <a href={item.href}>
          <span class="value"><Counter value={item.value} /></span>
          <span class="label">{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .stats {
    padding-block: clamp(96px, 16vh, 180px);
  }
  ul {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
  }
  a {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 40px;
    height: 100%;
    padding: 24px;
    border-radius: var(--radius-2xl);
    background: var(--surface-1);
    transition:
      background-color 240ms ease,
      translate 380ms var(--spring-bounce);
  }
  a:hover {
    background: var(--surface-2);
    translate: 0 -4px;
  }
  .value {
    font-size: clamp(2.75rem, 4.6vw, 4.5rem);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.04em;
  }
  .label {
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-2);
  }
  @media (max-width: 1080px) {
    ul {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (max-width: 560px) {
    ul {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    a {
      gap: 28px;
      padding: 20px;
      border-radius: var(--radius-xl);
    }
  }
</style>
