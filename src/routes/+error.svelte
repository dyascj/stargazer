<script lang="ts">
  import { page } from '$app/state';
  import Brand from '$components/brand/Brand.svelte';
  import BlurText from '$components/ui/BlurText.svelte';

  const missing = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{missing ? 'Page not found' : 'Something went wrong'} · Stargazer</title>
</svelte:head>

<main>
  <a class="brand" href="/" aria-label="Stargazer home"><Brand size={22} /></a>
  <div class="message">
    <p class="status tabular">{page.status}</p>
    <h1><BlurText text={missing ? 'Lost in space' : 'Something went wrong'} /></h1>
    <p class="detail rise" style:--i="2">
      {missing
        ? 'This page drifted out of range. The solar system is still where you left it.'
        : 'The explorer hit an unexpected problem. Try again in a moment.'}
    </p>
    <div class="actions rise" style:--i="3">
      <a class="btn btn-primary" href="/app">Open the explorer</a>
      <a class="btn" href="/">Home</a>
    </div>
  </div>
</main>

<style>
  main {
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: max(20px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
    background: radial-gradient(80% 60% at 50% 110%, var(--surface-1), var(--bg) 70%);
  }
  .brand {
    justify-self: start;
    display: flex;
    align-items: center;
    height: 44px;
  }
  .message {
    align-self: center;
    justify-self: center;
    max-width: 440px;
    padding-bottom: 10vh;
    text-align: center;
  }
  .status {
    color: var(--text-3);
    font-size: 14px;
    font-weight: 500;
  }
  h1 {
    margin-top: 12px;
    font-size: clamp(36px, 8vw, 56px);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }
  .detail {
    margin-top: 16px;
    color: var(--text-2);
    font-size: 16px;
    line-height: 1.55;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 28px;
  }
  .btn {
    height: 44px;
    padding: 0 20px;
  }
</style>
