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

  const title = 'Stargazer · A clearer view of space';
  const description = $derived(
    `Explore ${data.counts.total} planets, moons, spacecraft, satellites and small bodies in a 3D solar system, placed with data from NASA JPL and CelesTrak. Free, in your browser.`
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content="/og-image.png" />
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
