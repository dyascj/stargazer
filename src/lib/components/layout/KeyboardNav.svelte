<script lang="ts">
  import { get } from 'svelte/store';
  import { selection, SOLAR_SYSTEM_VIEW } from '$stores/selection';
  import { togglePause, stepSimRate, resyncSimTimeToNow } from '$stores/simTime';
  import { TRACKED_OBJECTS } from '$lib/registry/registry';
  import { timeExpanded, paletteOpen, immersive, selectBody, cameraCommand } from '$stores/ui';

  const bodyIds = TRACKED_OBJECTS.filter((body) => body.type === 'planet').map((body) => body.id);
  function handleKeydown(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      get(paletteOpen)
    )
      return;
    const target = event.target as HTMLElement;
    if (
      target.closest('input, textarea, select, button, a, [contenteditable="true"], dialog[open]')
    )
      return;
    switch (event.key.toLowerCase()) {
      case 'arrowright':
      case 'arrowleft': {
        event.preventDefault();
        const index = bodyIds.indexOf(get(selection) ?? '');
        selectBody(
          bodyIds[(index + (event.key === 'ArrowRight' ? 1 : -1) + bodyIds.length) % bodyIds.length]
        );
        break;
      }
      case ' ':
        event.preventDefault();
        togglePause();
        break;
      case '+':
      case '=':
        event.preventDefault();
        stepSimRate(1);
        break;
      case '-':
      case '_':
        event.preventDefault();
        stepSimRate(-1);
        break;
      case 'n':
        resyncSimTimeToNow();
        break;
      case 'h':
        selectBody(SOLAR_SYSTEM_VIEW);
        break;
      case 'f':
        immersive.update((value) => !value);
        break;
      case 'r':
        cameraCommand.set('reset');
        break;
      case 'escape':
        if (get(immersive)) immersive.set(false);
        else if (get(timeExpanded)) timeExpanded.set(false);
        else selectBody(SOLAR_SYSTEM_VIEW);
        break;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />
