<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>Stargazer · Explore space</title>
</svelte:head>

{@render children()}
