<script lang="ts">
  import { TRACKED_OBJECTS } from '$lib/registry/registry';
  import BodyLabel from './BodyLabel.svelte';
</script>

{#each TRACKED_OBJECTS as obj (obj.id)}
  <BodyLabel object={obj} />
{/each}
