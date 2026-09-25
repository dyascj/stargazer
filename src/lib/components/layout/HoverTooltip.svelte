<script lang="ts">
  import { hoveredBody, cursorPosition } from '$lib/stores/sceneHover';
</script>

<div
  class="hover-tooltip"
  class:visible={$hoveredBody !== null}
  style:transform="translate3d({$cursorPosition.x + 14}px, {$cursorPosition.y}px, 0)"
  aria-hidden="true"
>
  <span>{$hoveredBody ?? ''}</span>
</div>

<style>
  .hover-tooltip {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 55;
    pointer-events: none;
  }
  span {
    display: block;
    transform: translateY(-50%);
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--glass);
    -webkit-backdrop-filter: var(--glass-blur);
    backdrop-filter: var(--glass-blur);
    color: var(--text-1);
    font: 500 12px/18px var(--font-sans);
    white-space: nowrap;
    opacity: 0;
    transition: opacity var(--dur-fast) var(--ease-out);
  }
  .visible span {
    opacity: 1;
  }
</style>
