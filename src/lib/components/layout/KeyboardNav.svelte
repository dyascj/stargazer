<script lang="ts">
  import { get } from 'svelte/store';
  import { selection, SOLAR_SYSTEM_VIEW } from '$stores/selection';
  import { togglePause, stepSimRate, resyncSimTimeToNow } from '$stores/simTime';
  import { TRACKED_OBJECTS, getById } from '$lib/registry/registry';
  import { closeInfoPanel, infoPanelOpen, immersive, selectBody, cameraCommand } from '$stores/ui';

  const planetIds = TRACKED_OBJECTS.filter((body) => body.type === 'planet').map((body) => body.id);

  // Escape peels back one layer: immersive mode, then the details panel, then one level up.
  function escape() {
    if (get(immersive)) return immersive.set(false);
    if (get(infoPanelOpen)) return closeInfoPanel();
    const id = get(selection);
    if (id && id !== SOLAR_SYSTEM_VIEW) {
      const parent = getById(id)?.parent;
      selectBody(parent && parent !== 'sun' ? parent : SOLAR_SYSTEM_VIEW);
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    // Dialogs and popovers handle their own Escape and keys.
    if (
      target.closest('input, textarea, select, [contenteditable="true"], dialog[open], [popover]')
    )
      return;
    if (document.querySelector(':popover-open, dialog[open]')) return;
    if (event.key === 'Escape') return escape();
    // A focused button or link owns activation and arrow keys; letter shortcuts still apply.
    const controlKeys = [' ', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (controlKeys.includes(event.key) && target.closest('button, a')) return;
    switch (event.key.toLowerCase()) {
      case 'arrowright':
      case 'arrowleft': {
        event.preventDefault();
        const index = planetIds.indexOf(get(selection) ?? '');
        const step = event.key === 'ArrowRight' ? 1 : -1;
        selectBody(planetIds[(index + step + planetIds.length) % planetIds.length]);
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
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />
