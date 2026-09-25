<script lang="ts">
  import OrbitalPreview from '$components/landing/OrbitalPreview.svelte';
</script>

<svelte:head>
  <title>Stargazer · A clearer view of space</title>
  <meta
    name="description"
    content="An interactive window into our solar system. Explore planets, moons, spacecraft, and satellite predictions. Free, in your browser, no sign-up."
  />
  <meta
    name="keywords"
    content="solar system, 3D solar system, live ISS tracker, NASA, JPL, ESA, planets, moons, spacecraft, satellites, real-time space data, interactive space map"
  />
  <meta property="og:title" content="Stargazer · A clearer view of space" />
  <meta
    property="og:description"
    content="An interactive window into our solar system. Planets, moons, missions, and a little perspective. Free, in your browser."
  />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="/og-image.png" />
  <meta name="twitter:title" content="Stargazer · A clearer view of space" />
  <meta
    name="twitter:description"
    content="An interactive window into our solar system. Planets, moons, missions, and a little perspective. Free, in your browser."
  />
</svelte:head>

<div class="relative min-h-screen bg-[#F5F0E8] text-[#141414] antialiased">
  <!-- NAV -->
  <nav class="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 md:px-10 lg:px-16">
    <a href="/" class="group flex items-center gap-2.5">
      <img src="/stargazer-mark.svg" alt="" width="32" height="32" class="h-8 w-8" />
      <span class="mono text-[12px] uppercase tracking-[0.22em]">Stargazer</span>
    </a>
    <div class="mono flex items-center gap-6 text-[11px] tracking-[0.18em] text-[#8A8A85]">
      <a href="/app" class="transition-colors duration-150 hover:text-[#141414]">App</a>
      <a
        href="https://github.com/The-Lab-by-Ordinary-Company/stargazer"
        target="_blank"
        rel="noreferrer"
        class="transition-colors duration-150 hover:text-[#141414]">GitHub</a
      >
    </div>
  </nav>

  <main>
    <!-- HERO -->
    <section class="relative overflow-hidden px-6 pb-0 pt-6 md:px-10 lg:px-16 lg:pb-0 lg:pt-6">
      <div class="relative z-10 mx-auto max-w-[1200px]">
        <div class="landing-hero-grid">
          <div class="hero-copy">
            <h1 class="font-display">A clearer<br />view of<br /><span>space.</span></h1>
            <p>
              Eight planets. Countless stories. One extraordinary neighborhood. Go somewhere that
              changes your perspective.
            </p>
            <div class="hero-actions">
              <a href="/app" class="hero-primary">Explore the solar system <span>↗</span></a><a
                href="#tracked"
                class="hero-secondary">Take a look around ↓</a
              >
            </div>
          </div>
          <div class="hero-preview"><OrbitalPreview /></div>
        </div>
        <!-- DATA SOURCES MARQUEE -->
        <div class="border-b border-t border-[#141414]/15">
          <div class="flex items-center gap-5 py-6 sm:py-7">
            <span
              class="mono hidden flex-shrink-0 text-[10px] tracking-[0.22em] text-[#8A8A85] sm:inline"
              >Missions from</span
            >
            <div class="marquee relative flex-1 overflow-hidden">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F5F0E8] to-transparent sm:w-28"
              ></div>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F5F0E8] to-transparent sm:w-28"
              ></div>
              <div class="marquee-track">
                {#each Array(2) as _, copyIdx}
                  <ul class="marquee-list" aria-hidden={copyIdx === 1 ? 'true' : undefined}>
                    {#each ['NASA', 'JPL', 'ESA', 'JAXA', 'SpaceX'] as name}
                      <li class="marquee-name">{name}</li>
                    {/each}
                  </ul>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- REGISTRY -->
    <section
      id="tracked"
      class="relative overflow-hidden border-t border-[#141414]/15 px-6 py-20 md:px-10 lg:px-16 lg:py-28"
    >
      <!-- Background wireframe illustration (faded orange) -->
      <div
        class="pointer-events-none absolute right-[-20%] top-1/2 w-[95%] max-w-[600px] -translate-y-1/2 select-none md:right-[-5%] md:w-[55%]"
        aria-hidden="true"
        style="filter: sepia(1) saturate(5) hue-rotate(-15deg) brightness(1.5); opacity: 0.08;"
      >
        <img src="/mir-wireframe.svg" alt="" class="h-auto w-full" />
      </div>
      <div
        class="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20"
      >
        <div>
          <h2
            class="mb-5 font-display text-[1.8rem] uppercase leading-[1.02] tracking-[-0.02em] sm:text-[2.4rem] lg:text-[3rem]"
          >
            From Mercury to Voyager&nbsp;1
          </h2>
          <p class="max-w-[38ch] text-[0.95rem] leading-[1.75] text-[#5A5A55]">
            Start with a familiar world. Follow its moons, find a spacecraft, or watch a satellite
            circle home. Every destination comes with its story, source, and position model.
          </p>
        </div>
        <div class="border-t border-[#141414]/15">
          {#each [['01', 'Planets', 'earth'], ['02', 'Dwarf planets', 'pluto'], ['03', 'Moons', 'moon'], ['04', 'Spacecraft + rovers', 'voyager-1'], ['05', 'Earth satellites', 'iss'], ['06', 'Asteroids + comets', 'ceres']] as [num, name, body]}
            <a
              href="/app?body={body}"
              class="registry-link flex items-baseline gap-3 border-b border-[#141414]/15 py-4 sm:gap-6 sm:py-5"
            >
              <span class="mono w-6 text-[11px] text-[#8A8A85] sm:w-8">{num}</span>
              <span class="flex-1 text-[13px] tracking-[0.04em] sm:text-[15px]">{name}</span>
              <span class="text-[#E8441E]">↗</span>
            </a>
          {/each}
        </div>
      </div>
    </section>

    <!-- PIPELINE -->
    <section class="border-t border-[#141414]/15 bg-white px-6 py-20 md:px-10 lg:px-16 lg:py-28">
      <div class="mx-auto max-w-[1200px]">
        <h2
          class="mb-12 font-display text-[1.8rem] uppercase leading-[1.02] tracking-[-0.02em] sm:text-[2.4rem] lg:text-[3rem]"
        >
          Space, at your pace
        </h2>
        <div
          class="grid grid-cols-1 gap-0 border-t border-[#141414]/15 md:grid-cols-2 lg:grid-cols-4"
        >
          {#each [['01', 'Choose a world', 'Find a destination, or follow your curiosity. A smooth camera flight brings you right into its neighborhood.'], ['02', 'Take your time', 'Pause a moment. Watch a year unfold in seconds. Step through dates and see the solar system change.'], ['03', 'Get closer', 'Circle Saturn’s rings, explore Jupiter’s moons, or find a satellite above Earth. The view is yours to move.'], ['04', 'Follow the story', 'Open an object’s field notes for physical facts and sources. Check upcoming launches, including missions from SpaceX.']] as [num, title, desc]}
            <div
              class="border-b border-[#141414]/15 py-8 last:border-r-0 lg:border-b-0 lg:border-r lg:pr-8 [&:not(:first-child)]:lg:pl-8"
            >
              <span class="mono mb-4 block text-[11px] text-[#E8441E]">{num}</span>
              <h3 class="mb-3 text-[15px] tracking-[0.04em]">{title}</h3>
              <p class="text-[13px] leading-[1.7] text-[#5A5A55]">{desc}</p>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- ORANGE BLOCK CTA -->
    <section
      class="relative overflow-hidden bg-[#E8441E] px-6 py-20 text-white md:px-10 lg:px-16 lg:py-28"
    >
      <div class="cta-stars pointer-events-none absolute inset-0" aria-hidden="true"></div>
      <div
        class="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-end gap-12 lg:grid-cols-[1.2fr_1fr]"
      >
        <div>
          <h2
            class="max-w-[16ch] font-display text-[2rem] uppercase leading-[1] tracking-[-0.02em] sm:text-[2.8rem] lg:text-[3.5rem]"
          >
            Click anything in space
          </h2>
        </div>
        <div>
          <p class="mb-8 max-w-[44ch] text-[0.95rem] leading-[1.75] text-white/75">
            Fly to Voyager 1 in interstellar space, watch the Galilean moons orbit Jupiter, visit
            Curiosity’s landing site in Gale crater. Free, open source, and runs in any modern
            browser.
          </p>
          <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="/app"
              class="inline-flex h-12 items-center bg-white px-8 text-[13px] tracking-[0.18em] text-[#E8441E] transition-transform duration-150 ease-out active:scale-[0.96]"
              >Open Stargazer</a
            >
            <a
              href="https://github.com/The-Lab-by-Ordinary-Company/stargazer"
              target="_blank"
              rel="noreferrer"
              class="inline-flex h-12 items-center border border-white/40 px-8 text-[13px] tracking-[0.18em] text-white transition-[background-color,transform] duration-150 ease-out hover:bg-white/10 active:scale-[0.96]"
              >GitHub</a
            >
          </div>
        </div>
      </div>
    </section>

    <!-- SOURCES -->
    <section
      class="relative overflow-hidden border-t border-[#141414]/15 bg-white px-6 py-20 md:px-10 lg:px-16 lg:py-28"
    >
      <!-- Background technical drawing in faded orange -->
      <div
        class="pointer-events-none absolute right-[-20%] top-1/2 w-[90%] max-w-[550px] -translate-y-1/2 select-none md:right-[-10%] md:w-[50%]"
        aria-hidden="true"
        style="filter: sepia(1) saturate(5) hue-rotate(-15deg) brightness(1.5); opacity: 0.06;"
      >
        <img src="/mir-wireframe.svg" alt="" class="h-auto w-full" />
      </div>
      <div class="relative z-10 mx-auto max-w-[1200px]">
        <h2
          class="mb-12 font-display text-[1.8rem] uppercase leading-[1.02] tracking-[-0.02em] sm:text-[2.4rem]"
        >
          Where we get the data
        </h2>
        <div class="border-t border-[#141414]/15">
          {#each [['Positions', 'JPL approximate planetary models, Horizons snapshots and orbital elements'], ['Updated feeds', 'CelesTrak satellite elements; The Space Devs launch schedules'], ['Textures', 'NASA Visible Earth, Solar System Scope (CC BY 4.0)'], ['Reference', 'NASA Planetary Fact Sheets, JPL Small-Body Database'], ['Propagation', 'satellite.js (SGP4, MIT license)']] as [label, value]}
            <div
              class="flex flex-col gap-1 border-b border-[#141414]/15 py-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <span class="mono flex-shrink-0 text-[10px] text-[#8A8A85] sm:w-32 sm:text-[11px]"
                >{label}</span
              >
              <span class="text-[13px] sm:text-[14px]">{value}</span>
            </div>
          {/each}
        </div>
        <p class="mt-6 text-[12px] leading-relaxed text-[#5A5A55]">
          Planetary positions are approximate; spacecraft may use dated snapshots or illustrated
          positions. Sizes are exaggerated for visibility. SpaceX satellite elements come via
          CelesTrak, and launch schedules via The Space Devs.
        </p>
        <p class="mono mt-6 text-[11px] tracking-[0.16em] text-[#8A8A85]">
          Not affiliated with NASA, ESA, JAXA, or SpaceX. We are fans building on public data.
        </p>
      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="border-t border-[#141414]/15 bg-[#F5F0E8] px-6 py-16 md:px-10 lg:px-16 lg:py-24">
    <div
      class="mx-auto flex max-w-[1200px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <div class="flex items-center gap-4 sm:gap-5 lg:gap-7">
          <img
            src="/stargazer-mark.svg"
            alt=""
            width="96"
            height="96"
            class="h-12 w-12 flex-shrink-0 sm:h-16 sm:w-16 lg:h-24 lg:w-24"
          />
          <div
            class="font-display text-[3rem] uppercase leading-[0.85] tracking-[-0.03em] sm:text-[4rem] lg:text-[6rem]"
          >
            STARGAZER
          </div>
        </div>
        <p class="mono mt-6 text-[11px] tracking-[0.18em] text-[#8A8A85]">
          Powered by <a
            href="https://lab.ordinarycompany.design/"
            target="_blank"
            rel="noreferrer"
            class="transition-colors duration-150 hover:text-[#141414]">The Lab</a
          >
        </p>
      </div>
      <div class="mono flex items-center gap-6 text-[11px] tracking-[0.18em] text-[#8A8A85]">
        <a href="/app" class="transition-colors duration-150 hover:text-[#141414]">App</a>
        <a
          href="https://github.com/The-Lab-by-Ordinary-Company/stargazer"
          target="_blank"
          rel="noreferrer"
          class="transition-colors duration-150 hover:text-[#141414]">GitHub</a
        >
        <span>2026</span>
      </div>
    </div>
  </footer>
</div>

<style>
  .landing-hero-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: center;
    padding-bottom: 52px;
  }
  .hero-copy h1 {
    font-size: clamp(60px, 6.8vw, 100px);
    text-transform: uppercase;
    line-height: 0.91;
    letter-spacing: -0.04em;
    margin-bottom: 26px;
  }
  .hero-copy h1 span {
    color: #e8441e;
  }
  .hero-copy p {
    max-width: 35ch;
    font-family: 'Geist Variable', sans-serif;
    font-size: 15px;
    line-height: 1.8;
    color: #66655e;
    margin-bottom: 30px;
  }
  .hero-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .hero-primary {
    min-height: 50px;
    padding: 0 22px;
    display: flex;
    align-items: center;
    gap: 28px;
    background: #e8441e;
    color: white;
    font-size: 13px;

    transition:
      background 160ms,
      transform 160ms;
  }
  .hero-primary:hover {
    background: #ca3716;
    transform: translateY(-2px);
  }
  .hero-primary:active {
    transform: scale(0.98);
  }
  .hero-primary span {
    font-size: 18px;
  }
  .hero-secondary {
    min-height: 42px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #73726c;
  }
  .hero-secondary:hover {
    color: #e8441e;
  }
  .hero-preview {
    min-width: 0;
  }
  .registry-link {
    transition:
      color 180ms,
      padding 180ms;
  }
  .registry-link:hover {
    color: #e8441e;
    padding-left: 8px;
  }
  .cta-stars {
    background-image: radial-gradient(#ffffff30 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: linear-gradient(90deg, transparent, #000);
  }
  @media (max-width: 767px) {
    .landing-hero-grid {
      grid-template-columns: 1fr;
      padding-bottom: 28px;
      gap: 12px;
    }
    .hero-copy {
      padding-top: 20px;
    }
    .hero-copy h1 {
      font-size: clamp(68px, 14vw, 100px);
    }
    .hero-copy p {
      max-width: 42ch;
    }
    .hero-actions {
      flex-direction: row;
      gap: 20px;
      align-items: center;
    }
    .hero-preview {
      max-width: 550px;
      width: 100%;
      margin: 0 auto;
    }
  }
  @media (max-width: 400px) {
    .hero-actions {
      flex-direction: column;
      gap: 0;
      align-items: flex-start;
    }
  }

  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee 32s linear infinite;
  }
  .marquee-list {
    display: flex;
    align-items: center;
    gap: 5.5rem;
    padding: 0 2.75rem;
    margin: 0;
    list-style: none;
    flex-shrink: 0;
  }
  .marquee-name {
    font-family: 'Geist Mono Variable', ui-monospace, monospace;
    font-size: 28px;
    font-weight: 500;
    line-height: 44px;
    color: #686660;
    white-space: nowrap;
  }
  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-track {
      animation: none;
    }
  }
</style>
