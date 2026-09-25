<script lang="ts">
  import { Canvas } from '@threlte/core';
  import { ACESFilmicToneMapping, WebGLRenderer } from 'three';
  import { showLabels } from '$stores/ui';
  import { sceneReady } from '$stores/scene';
  import World from './World.svelte';
  import BodyLabels from './BodyLabels.svelte';

  let contextLost = $state(false);
  // Sharp on high-density screens without paying for 3x fill rate on phones.
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 2);

  /** A logarithmic depth buffer resolves metres at the ISS and AU at Neptune in one frame. */
  function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
    canvas.addEventListener('webglcontextlost', () => (contextLost = true), { once: true });
    return new WebGLRenderer({
      canvas,
      logarithmicDepthBuffer: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  }
</script>

<div class="scene" class:ready={$sceneReady}>
  <svelte:boundary>
    <Canvas {createRenderer} {dpr} toneMapping={ACESFilmicToneMapping}><World /></Canvas>
    {#snippet failed()}
      <div class="scene-error">
        <h2>The 3D view could not start.</h2>
        <p>Try reloading with WebGL enabled. You can still browse every destination.</p>
        <button type="button" onclick={() => window.location.reload()}>Reload scene</button>
      </div>
    {/snippet}
  </svelte:boundary>
  {#if $showLabels}<BodyLabels />{/if}
  {#if contextLost}<div class="scene-error" role="alert">
      <p>The graphics connection was interrupted.</p>
      <button type="button" onclick={() => window.location.reload()}>Reload scene</button>
    </div>{/if}
</div>

<style>
  .scene {
    position: absolute;
    inset: 0;
    cursor: grab;
    background: var(--bg);
    opacity: 0;
    transition: opacity 1.4s var(--ease-out);
  }
  .scene.ready {
    opacity: 1;
  }
  .scene:active {
    cursor: grabbing;
  }
  .scene-error {
    position: absolute;
    top: 40%;
    left: 50%;
    width: min(420px, calc(100% - 32px));
    transform: translate(-50%, -50%);
    padding: 24px;
    border-radius: var(--radius-lg);
    background: var(--surface-1);
    color: var(--text-1);
    font: 14px/1.6 var(--font-sans);
  }
  .scene-error p {
    color: var(--text-2);
  }
  .scene-error button {
    margin-top: 16px;
    padding: 10px 16px;
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--text-inverse);
    font-weight: 550;
  }
</style>
