<script lang="ts">
  import { onDestroy } from 'svelte';
  import { hoveredBody } from '$stores/sceneHover';
  import { resetBodyCursor } from '$utils/sceneCursor';
  onDestroy(resetBodyCursor);
  import { Canvas } from '@threlte/core';
  import { WebGLRenderer } from 'three';
  let failed = $state(false);
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 1.5);
  import World from './World.svelte';

  /** Logarithmic depth accommodates local satellites and distant spacecraft in one scene. */
  function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
    canvas.addEventListener('webglcontextlost', () => (failed = true), { once: true });
    return new WebGLRenderer({
      canvas,
      logarithmicDepthBuffer: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  }
</script>

<div
  class="absolute inset-0 active:cursor-grabbing"
  style:cursor={$hoveredBody ? 'pointer' : 'grab'}
>
  <svelte:boundary>
    <Canvas {createRenderer} {dpr}><World /></Canvas>
    {#snippet failed()}
      <div class="scene-error">
        <h2>The 3D view could not start.</h2>
        <p>Try reloading with WebGL enabled. You can still browse every destination.</p>
        <button type="button" onclick={() => window.location.reload()}>Reload scene</button>
      </div>
    {/snippet}
  </svelte:boundary>
  {#if failed}<div class="scene-error" role="alert">
      <p>The graphics connection was interrupted.</p>
      <button type="button" onclick={() => window.location.reload()}>Reload scene</button>
    </div>{/if}
</div>

<style>
  .scene-error {
    position: absolute;
    top: 40%;
    left: 25%;
    right: 15%;
    color: var(--space-text);
    padding: 24px;
    background: var(--space-surface);
    border: 1px solid var(--space-line);
    font: 14px system-ui;
    line-height: 1.7;
  }
  .scene-error button {
    margin-top: 16px;
    padding: 12px;
    background: var(--space-accent);
    color: white;
  }
</style>
