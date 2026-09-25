<script lang="ts">
  import Nav from '$components/landing/Nav.svelte';
  import Hero from '$components/landing/Hero.svelte';
  import ChapterScale from '$components/landing/ChapterScale.svelte';
  import Stats from '$components/landing/Stats.svelte';
  import ChapterWorlds from '$components/landing/ChapterWorlds.svelte';
  import ChapterOverhead from '$components/landing/ChapterOverhead.svelte';
  import ChapterMissions from '$components/landing/ChapterMissions.svelte';
  import ChapterTime from '$components/landing/ChapterTime.svelte';
  import Sources from '$components/landing/Sources.svelte';
  import Closing from '$components/landing/Closing.svelte';

  let { data } = $props();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Stargazer',
    url: 'https://stargazer-lab.vercel.app/',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires WebGL',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    image: 'https://stargazer-lab.vercel.app/og-image.jpg'
  };

  const title = 'Stargazer · A clearer view of space';
  const description = $derived(
    `Explore ${data.counts.total} planets, moons, spacecraft, satellites and small bodies in a 3D solar system, placed with data from NASA JPL and CelesTrak. Free, in your browser.`
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://stargazer-lab.vercel.app/" />
  <meta property="og:url" content="https://stargazer-lab.vercel.app/" />
  {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
</svelte:head>

<div class="landing">
  <Nav />
  <main>
    <Hero total={data.counts.total} />
    <ChapterScale
      planets={data.planets}
      voyagerAU={data.spacecraft.find((craft) => craft.id === 'voyager-1')?.au ?? null}
    />
    <Stats counts={data.counts} />
    <ChapterWorlds worlds={data.worlds} />
    <ChapterOverhead satellites={data.satellites} total={data.counts.satellites} iss={data.iss} />
    <ChapterMissions
      spacecraft={data.spacecraft}
      planets={data.planets}
      total={data.counts.spacecraft}
      builtAt={data.builtAt}
    />
    <ChapterTime planets={data.planets} />
    <Sources />
  </main>
  <Closing />
</div>

<style>
  .landing {
    --gutter: clamp(20px, 5vw, 64px);
    overflow-x: clip;
  }
  .landing :global(.container) {
    width: min(100% - 2 * var(--gutter), 1320px);
    margin-inline: auto;
  }
  .landing :global(.eyebrow-lg) {
    margin-bottom: 20px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* Staggered rise-in, driven by the reveal action. Hidden only once the action arms it. */
  .landing :global([data-reveal]) {
    transition:
      opacity 900ms var(--ease-out) var(--d, 0ms),
      translate 1100ms var(--ease-out) var(--d, 0ms),
      filter 900ms var(--ease-out) var(--d, 0ms);
  }
  .landing :global([data-reveal][data-armed]:not([data-in])) {
    opacity: 0;
    translate: 0 28px;
    filter: blur(6px);
  }
  @media (prefers-reduced-motion: reduce) {
    .landing :global([data-reveal][data-armed]:not([data-in])) {
      opacity: 1;
      translate: none;
      filter: none;
    }
  }
</style>
