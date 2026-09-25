<script lang="ts">
  import { hoveredBody, cursorPosition } from '$lib/stores/sceneHover';

  let visible = $derived($hoveredBody !== null);
</script>

<div
  class="hover-tooltip pointer-events-none fixed z-[55] text-[12px]"
  class:visible
  style="left: {$cursorPosition.x}px; top: {$cursorPosition.y}px"
  aria-hidden="true"
>
  <div class="space-panel ml-3 -translate-y-1/2 px-3 py-1">
    {$hoveredBody ?? ''}
  </div>
</div>

<style>
  .hover-tooltip {
    opacity: 0;
    transform: translateY(2px);
    transition-property: opacity, transform;
    transition-duration: 140ms;
    transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
  }
  .hover-tooltip.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>
