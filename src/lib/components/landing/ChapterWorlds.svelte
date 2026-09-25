<script lang="ts">
  import { onMount } from 'svelte';
  import type { WorldSpec } from './gl';
  import { inView, reducedMotion, reveal } from './motion';

  type World = {
    id: string;
    name: string;
    subtitle: string;
    radiusKm: number;
    texture: string;
    day: string;
    year: string;
    gravity: string;
    rings: { inner: number; outer: number; texture: string } | null;
  };
  let { worlds }: { worlds: World[] } = $props();

  // Rendering-only extras: IAU obliquities (deg), illustrative spin, atmosphere tint.
  const look: Record<string, Omit<WorldSpec, 'id' | 'texture' | 'rings'>> = {
    earth: {
      tiltDeg: 23.44,
      spin: 0.08,
      rim: [0.35, 0.6, 1],
      clouds: '/textures/earth_clouds_2k.webp'
    },
    moon: { tiltDeg: 6.68, spin: 0.05 },
    mars: { tiltDeg: 25.19, spin: 0.08, rim: [1, 0.62, 0.45] },
    jupiter: { tiltDeg: 3.13, spin: 0.14 },
    saturn: { tiltDeg: 26.73, spin: 0.12 }
  };

  let index = $state(0);
  const world = $derived(worlds[index]);
  let viewer: ReturnType<typeof import('./gl').mountWorld> | undefined;
  let canvas: HTMLCanvasElement;
  let failed = $state(false);
  let ready = $state(false);

  // Segmented control: the indicator's leading edge moves first, the trailing edge
  // follows, so it stretches toward the target and then settles.
  let track: HTMLDivElement;
  let buttons: HTMLButtonElement[] = [];
  let edges = $state({ left: 0, right: 0, leadLeft: false });
  function measure(leadLeft = edges.leadLeft) {
    const button = buttons[index];
    if (!button || !track) return;
    edges = {
      left: button.offsetLeft,
      right: track.clientWidth - button.offsetLeft - button.offsetWidth,
      leadLeft
    };
  }
  function select(next: number) {
    if (next === index) return;
    const leadLeft = next < index;
    index = next;
    measure(leadLeft);
    viewer?.show(spec(worlds[next]));
  }
  function keys(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + worlds.length) % worlds.length;
    select(next);
    buttons[next].focus();
  }

  const mobile = () => matchMedia('(max-width: 720px), (pointer: coarse)').matches;
  const spec = (w: World): WorldSpec => {
    const extra = { ...look[w.id] };
    if (reducedMotion()) extra.spin = 0;
    return { id: w.id, texture: w.texture, rings: w.rings, ...extra };
  };

  let visible = false;
  async function onView(isVisible: boolean) {
    visible = isVisible;
    if (viewer || !isVisible || failed) return viewer?.setActive(isVisible);
    try {
      const { mountWorld } = await import('./gl');
      viewer = mountWorld(canvas, { mobile: mobile() });
      viewer.show(spec(world));
      viewer.setActive(visible);
      ready = true;
    } catch {
      failed = true;
    }
  }

  function pointer(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || reducedMotion()) return;
    const box = canvas.getBoundingClientRect();
    viewer?.setPointer(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      ((event.clientY - box.top) / box.height) * 2 - 1
    );
  }

  onMount(() => {
    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(track);
    return () => {
      observer.disconnect();
      viewer?.destroy();
    };
  });
</script>

<section class="worlds container" aria-labelledby="worlds-title">
  <header data-reveal use:reveal>
    <p class="eyebrow-lg">02 · Worlds</p>
    <h2 id="worlds-title">Every world, up close.</h2>
  </header>

  <div class="stage" use:inView={onView} onpointermove={pointer} role="presentation">
    <canvas bind:this={canvas} class:ready aria-hidden="true"></canvas>
    {#if failed}
      <div class="fallback" style:background-image="url({world.texture})" aria-hidden="true"></div>
    {/if}
  </div>

  <div class="panel" data-reveal use:reveal>
    <div
      class="segmented"
      bind:this={track}
      role="toolbar"
      aria-label="Featured world"
      tabindex="-1"
      onkeydown={keys}
    >
      <span
        class="indicator"
        class:lead-left={edges.leadLeft}
        style:left="{edges.left}px"
        style:right="{edges.right}px"
        aria-hidden="true"
      ></span>
      {#each worlds as item, i (item.id)}
        <button
          bind:this={buttons[i]}
          aria-pressed={i === index}
          tabindex={i === index ? 0 : -1}
          onclick={() => select(i)}>{item.name}</button
        >
      {/each}
    </div>

    {#key world.id}
      <div class="details">
        <h3>{world.name}</h3>
        <p class="subtitle">{world.subtitle}</p>
        <dl>
          <div>
            <dt>Radius</dt>
            <dd>{world.radiusKm.toLocaleString('en-US')} km</dd>
          </div>
          <div>
            <dt>Day</dt>
            <dd>{world.day}</dd>
          </div>
          <div>
            <dt>{world.id === 'moon' ? 'Orbit' : 'Year'}</dt>
            <dd>{world.year}</dd>
          </div>
          <div>
            <dt>Gravity</dt>
            <dd>{world.gravity}</dd>
          </div>
        </dl>
        <a class="visit" href="/app?body={world.id}">
          Visit {world.name}
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"
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
      </div>
    {/key}
  </div>
</section>

<style>
  .worlds {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: auto 1fr;
    column-gap: 24px;
    padding-block: clamp(96px, 16vh, 180px);
  }
  header {
    grid-column: 1 / span 5;
    grid-row: 1;
  }
  h2 {
    font-size: clamp(2.25rem, 4.4vw, 4rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }
  .stage {
    position: relative;
    grid-column: 6 / -1;
    grid-row: 1 / span 2;
    aspect-ratio: 1;
    max-height: 760px;
    justify-self: end;
    width: 100%;
  }
  canvas {
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 1.2s var(--ease-out);
  }
  canvas.ready {
    opacity: 1;
  }
  .fallback {
    position: absolute;
    inset: 12%;
    border-radius: 50%;
    background-size: 200% 100%;
    box-shadow: inset -40px -20px 80px #000;
  }
  .panel {
    grid-column: 1 / span 5;
    grid-row: 2;
    align-self: end;
  }

  .segmented {
    position: relative;
    display: inline-flex;
    padding: 4px;
    border-radius: var(--radius-pill);
    background: var(--surface-1);
    max-width: 100%;
  }
  .indicator {
    position: absolute;
    top: 4px;
    bottom: 4px;
    border-radius: var(--radius-pill);
    background: var(--surface-4);
    /* Moving right: the right edge leads and the left edge follows. */
    transition:
      left 420ms var(--spring-bounce) 70ms,
      right 380ms var(--spring-bounce);
  }
  .indicator.lead-left {
    transition:
      left 380ms var(--spring-bounce),
      right 420ms var(--spring-bounce) 70ms;
  }
  .segmented button {
    position: relative;
    padding: 10px 16px;
    border-radius: var(--radius-pill);
    font-size: 14px;
    font-weight: 500;
    color: var(--text-2);
    cursor: pointer;
    transition:
      color 200ms ease,
      scale 260ms var(--ease-overshoot);
  }
  .segmented button:hover,
  .segmented button[aria-pressed='true'] {
    color: var(--text-1);
  }
  .segmented button:active {
    scale: 0.95;
  }

  .details {
    margin-top: 40px;
    animation: swap 520ms var(--ease-out) both;
  }
  @keyframes swap {
    from {
      opacity: 0;
      translate: 0 10px;
      filter: blur(4px);
    }
  }
  h3 {
    font-size: clamp(3rem, 6vw, 5.5rem);
    line-height: 0.95;
    letter-spacing: -0.045em;
  }
  .subtitle {
    margin-top: 12px;
    color: var(--text-2);
    font-size: 1.0625rem;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 32px;
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
    margin: 6px 0 0;
    font-size: 15px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .visit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 28px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-1);
  }
  .visit svg {
    transition: translate 260ms var(--ease-overshoot);
  }
  .visit:hover svg {
    translate: 3px 0;
  }

  @media (max-width: 900px) {
    .worlds {
      display: flex;
      flex-direction: column;
    }
    header {
      order: -2;
    }
    .stage {
      width: min(100%, 520px);
      align-self: center;
      margin-block: 8px;
    }
    .panel {
      display: contents;
    }
    .segmented {
      order: -1;
      align-self: center;
      margin-top: 32px;
    }
    .details {
      margin-top: 8px;
    }
  }
  @media (max-width: 400px) {
    .segmented button {
      padding: 9px 11px;
      font-size: 13px;
    }
  }
</style>
