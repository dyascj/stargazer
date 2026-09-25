<script lang="ts">
  import { onMount } from 'svelte';
  import { magnetic, reducedMotion, scrollProgress } from './motion';

  let { total }: { total: number } = $props();

  const headline = 'A clearer view of space.';
  // Per-letter spans with a running index for the stagger; words stay unbreakable.
  const words = headline.split(' ').reduce<{ chars: string[]; start: number }[]>((list, word) => {
    const previous = list.at(-1);
    list.push({ chars: [...word], start: previous ? previous.start + previous.chars.length : 0 });
    return list;
  }, []);

  let canvas: HTMLCanvasElement;
  let section: HTMLElement;
  let state = $state<'idle' | 'live' | 'poster'>('idle');
  let hero: Awaited<ReturnType<typeof import('./gl').mountHero>> | undefined;

  onMount(() => {
    if (reducedMotion()) {
      state = 'poster';
      return;
    }
    let cancelled = false;
    // Wait for first paint, then fetch three.js and the scene.
    const handle = requestAnimationFrame(() =>
      setTimeout(async () => {
        try {
          const { mountHero } = await import('./gl');
          if (cancelled) return;
          const mobile = matchMedia('(max-width: 720px), (pointer: coarse)').matches;
          const mounted = await mountHero(canvas, { mobile });
          if (cancelled) return mounted.destroy();
          hero = mounted;
          state = 'live';
        } catch {
          state = 'poster';
        }
      })
    );
    const visibility = new IntersectionObserver(([entry]) => hero?.setActive(entry.isIntersecting));
    visibility.observe(section);
    return () => {
      cancelled = true;
      cancelAnimationFrame(handle);
      visibility.disconnect();
      hero?.destroy();
    };
  });

  function pointer(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    hero?.setPointer((event.clientX / innerWidth) * 2 - 1, (event.clientY / innerHeight) * 2 - 1);
  }
</script>

<svelte:window onpointermove={pointer} />

<section
  class="hero"
  data-state={state}
  bind:this={section}
  use:scrollProgress={(p) => hero?.setScroll(p)}
>
  <div class="stage" aria-hidden="true">
    <div class="poster"></div>
    <canvas bind:this={canvas}></canvas>
  </div>
  <div class="scrim" aria-hidden="true"></div>

  <div class="content container">
    <h1 aria-label={headline}>
      {#each words as word, w (w)}
        <span class="word" aria-hidden="true"
          >{#each word.chars as char, c (c)}<span class="char" style:--i={word.start + c}
              >{char}</span
            >{/each}</span
        >{' '}
      {/each}
    </h1>
    <p class="lede">
      Explore {total} planets, moons, spacecraft and satellites, placed with data from NASA JPL and CelesTrak.
      Free, in your browser.
    </p>
    <div class="actions">
      <a class="btn btn-primary cta" href="/app" use:magnetic>
        Launch explorer
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"
          ><path
            d="M3 8h9m-4-4 4 4-4 4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg
        >
      </a>
      <a
        class="btn ghost"
        href="https://github.com/dyascj/stargazer"
        target="_blank"
        rel="noreferrer"
        use:magnetic={4}
      >
        View on GitHub
      </a>
    </div>
  </div>

  <p class="caption" aria-hidden="true">Sunrise over Earth, rendered live in your browser</p>
</section>

<style>
  .hero {
    position: relative;
    height: 100svh;
    min-height: 620px;
    max-height: 1100px;
    overflow: clip;
    isolation: isolate;
  }

  .stage {
    position: absolute;
    inset: 0;
    z-index: -1;
    /* Gentle parallax as the hero leaves. */
    translate: 0 calc(var(--p, 0) * 12%);
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 1.8s var(--ease-out);
  }
  [data-state='live'] canvas {
    opacity: 1;
  }

  /* Pre-dawn glow shown before the scene arrives; the rendered poster replaces it
     for reduced motion and when WebGL is unavailable. */
  .poster {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 30% at 64% 44%, rgb(255 190 140 / 0.1), transparent 70%),
      radial-gradient(140% 70% at 50% 110%, #000 58%, rgb(60 120 255 / 0.1) 62%, transparent 72%);
    transition: opacity 1.8s var(--ease-out);
  }
  [data-state='live'] .poster {
    opacity: 0;
  }
  [data-state='poster'] .poster {
    background: #000 url('/landing/hero-poster.webp') center / cover no-repeat;
  }
  @media (max-aspect-ratio: 9/10) {
    [data-state='poster'] .poster {
      background-image: url('/landing/hero-poster-portrait.webp');
    }
  }

  .scrim {
    position: absolute;
    inset: auto 0 0;
    height: 55%;
    background: linear-gradient(to top, rgb(0 0 0 / 0.7), transparent);
    pointer-events: none;
  }

  .content {
    position: absolute;
    inset: auto 0 clamp(40px, 9vh, 104px);
  }

  h1 {
    max-width: 11ch;
    font-size: clamp(3.25rem, 8.4vw, 8.5rem);
    font-weight: 600;
    line-height: 0.94;
    letter-spacing: -0.045em;
  }
  .word {
    display: inline-block;
    white-space: nowrap;
  }
  .char {
    display: inline-block;
    animation: blur-in 380ms var(--spring-bounce) both;
    animation-delay: calc(200ms + var(--i) * 18ms);
  }
  @keyframes blur-in {
    from {
      opacity: 0;
      filter: blur(5px);
      translate: 0 -0.5em;
    }
  }

  .lede {
    max-width: 34ch;
    margin-top: clamp(20px, 3vh, 32px);
    font-size: clamp(1rem, 1.3vw, 1.1875rem);
    line-height: 1.5;
    color: var(--text-2);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: clamp(24px, 4vh, 40px);
  }
  .lede,
  .actions {
    animation: rise 900ms var(--ease-out) both;
    animation-delay: 700ms;
  }
  .actions {
    animation-delay: 820ms;
  }
  @keyframes rise {
    from {
      opacity: 0;
      translate: 0 16px;
      filter: blur(4px);
    }
  }

  .btn {
    height: 52px;
    padding: 0 26px;
    font-size: 15px;
    transition:
      background-color var(--dur-fast) ease,
      scale 260ms var(--ease-overshoot),
      translate 420ms cubic-bezier(0.22, 0.9, 0.28, 1);
  }
  .cta svg {
    transition: translate 260ms var(--ease-overshoot);
  }
  .cta:hover svg {
    translate: 3px 0;
  }
  .ghost {
    background: rgb(245 245 245 / 0.08);
    -webkit-backdrop-filter: var(--glass-blur);
    backdrop-filter: var(--glass-blur);
  }
  .ghost:hover {
    background: rgb(245 245 245 / 0.14);
  }

  .caption {
    position: absolute;
    right: var(--gutter);
    bottom: clamp(40px, 9vh, 104px);
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-3);
    animation: rise 900ms var(--ease-out) 1.4s both;
  }

  @media (prefers-reduced-motion: reduce) {
    .char,
    .lede,
    .actions,
    .caption {
      animation: none;
    }
  }

  @media (max-width: 720px) {
    .content {
      bottom: max(28px, env(safe-area-inset-bottom));
    }
    .actions {
      flex-wrap: nowrap;
    }
    .actions .btn {
      flex: 1;
      padding: 0 16px;
    }
    .caption {
      display: none;
    }
  }
</style>
