<script lang="ts">
  import { reveal } from './motion';

  // Logos identify data sources only; see THIRD_PARTY_NOTICES.md.
  const sources = [
    {
      name: 'NASA',
      href: 'https://www.nasa.gov/',
      logo: '/logos/nasa-worm-logo.svg',
      w: 79,
      h: 22
    },
    {
      name: 'NASA Jet Propulsion Laboratory',
      href: 'https://ssd.jpl.nasa.gov/',
      logo: '/logos/jpl-logo.svg',
      w: 73,
      h: 33
    },
    {
      name: 'European Space Agency',
      href: 'https://www.esa.int/',
      logo: '/logos/esa-logo.svg',
      w: 40,
      h: 40
    },
    { name: 'JAXA', href: 'https://global.jaxa.jp/', logo: '/logos/jaxa-logo.svg', w: 55, h: 34 },
    { name: 'CelesTrak', href: 'https://celestrak.org/', wordmark: 'CelesTrak' },
    { name: 'The Space Devs', href: 'https://thespacedevs.com/', wordmark: 'The Space Devs' }
  ];

  const details = [
    {
      label: 'Planets',
      text: 'JPL approximate planetary elements, valid 1800 to 2050',
      href: 'https://ssd.jpl.nasa.gov/planets/approx_pos.html'
    },
    {
      label: 'Moons, small bodies, spacecraft',
      text: 'Dated JPL Horizons elements and position snapshots',
      href: 'https://ssd.jpl.nasa.gov/horizons/'
    },
    {
      label: 'Earth satellites',
      text: 'CelesTrak orbital elements, propagated with SGP4',
      href: 'https://celestrak.org/'
    },
    {
      label: 'Launches',
      text: 'The Space Devs Launch Library 2, including SpaceX',
      href: 'https://thespacedevs.com/llapi'
    },
    {
      label: 'Physical facts',
      text: 'NASA planetary fact sheets',
      href: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
    },
    {
      label: 'Textures',
      text: 'Solar System Scope, CC BY 4.0, based on NASA imagery',
      href: 'https://www.solarsystemscope.com/textures/'
    }
  ];
</script>

<section class="sources container" aria-labelledby="sources-title">
  <div class="intro" data-reveal use:reveal>
    <p class="eyebrow-lg">06 · Sources</p>
    <h2 id="sources-title">Built on public data.</h2>
    <p class="body">
      Positions, orbits and schedules come from the agencies and catalogs that publish them. Every
      object in the explorer cites its source and the date of its data.
    </p>
  </div>

  <div class="strip" data-reveal use:reveal style:--d="100ms">
    <p class="strip-label">Data from</p>
    <ul>
      {#each sources as source, i (source.name)}
        <li style:--d="{200 + i * 60}ms">
          <a href={source.href} target="_blank" rel="noreferrer" aria-label={source.name}>
            {#if source.logo}
              <img
                src={source.logo}
                alt=""
                width={source.w}
                height={source.h}
                loading="lazy"
                decoding="async"
              />
            {:else}
              <span class="wordmark">{source.wordmark}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div class="strip provider" data-reveal use:reveal style:--d="160ms">
    <p class="strip-label">In the launch feed</p>
    <a href="https://www.spacex.com/" target="_blank" rel="noreferrer" aria-label="SpaceX">
      <img
        src="/logos/spacex-logo.svg"
        alt=""
        width="112"
        height="14"
        loading="lazy"
        decoding="async"
      />
    </a>
    <p class="note">SpaceX launches appear via The Space Devs Launch Library 2.</p>
  </div>

  <ul class="details">
    {#each details as item, i (item.label)}
      <li data-reveal use:reveal style:--d="{i * 50}ms">
        <a href={item.href} target="_blank" rel="noreferrer">
          <span class="label">{item.label}</span>
          <span class="text">{item.text}</span>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .sources {
    padding-block: clamp(96px, 16vh, 180px);
  }
  h2 {
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

  .strip {
    display: flex;
    align-items: center;
    gap: clamp(24px, 4vw, 56px);
    margin-top: clamp(56px, 9vh, 96px);
    padding: 28px clamp(24px, 3vw, 40px);
    border-radius: var(--radius-2xl);
    background: var(--surface-1);
  }
  .strip.provider {
    margin-top: 12px;
    padding-block: 22px;
  }
  .strip-label {
    flex: none;
    width: 11rem;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .strip ul {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 28px 40px;
  }
  .strip a {
    display: grid;
    place-items: center;
    min-height: 44px;
    opacity: 0.55;
    transition:
      opacity 240ms ease,
      scale 320ms var(--ease-overshoot);
  }
  .strip a:hover,
  .strip a:focus-visible {
    opacity: 1;
    scale: 1.04;
  }
  img {
    /* Monochrome: every logo renders as a white silhouette. */
    filter: brightness(0) invert(1);
    height: auto;
  }
  .wordmark {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  li:last-child .wordmark {
    font-size: 13px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .note {
    margin-left: auto;
    font-size: 14px;
    color: var(--text-2);
  }

  .details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 12px;
  }
  .details a {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    padding: 22px 24px;
    border-radius: var(--radius-xl);
    background: var(--surface-1);
    transition: background-color 240ms ease;
  }
  .details a:hover {
    background: var(--surface-2);
  }
  .label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .text {
    font-size: 15px;
    line-height: 1.45;
  }

  @media (max-width: 900px) {
    .strip {
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
    }
    .strip ul {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      width: 100%;
      gap: 24px 16px;
    }
    .note {
      margin-left: 0;
    }
    .details {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
  @media (max-width: 420px) {
    .strip ul {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
