<script lang="ts">
  import Brand from '$components/brand/Brand.svelte';

  // Hides while scrolling down, returns on any upward scroll.
  let hidden = $state(false);
  let solid = $state(false);
  let lastY = 0;

  function onScroll() {
    const y = scrollY;
    solid = y > 24;
    if (Math.abs(y - lastY) > 6) hidden = y > lastY && y > 320;
    lastY = y;
  }
</script>

<svelte:window onscroll={onScroll} />

<header class:hidden class:solid>
  <nav class="container" aria-label="Primary">
    <a href="/" class="home" aria-label="Stargazer home"><Brand size={22} /></a>
    <div class="links">
      <a class="link" href="https://github.com/dyascj/stargazer" target="_blank" rel="noreferrer"
        >GitHub</a
      >
      <a class="btn btn-primary launch" href="/app">Launch explorer</a>
    </div>
  </nav>
</header>

<style>
  header {
    position: fixed;
    inset: 0 0 auto;
    z-index: 10;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left);
    transition:
      translate 520ms var(--ease-out),
      background-color 320ms ease;
  }
  header::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: rgb(0 0 0 / 0.55);
    -webkit-backdrop-filter: var(--glass-blur);
    backdrop-filter: var(--glass-blur);
    opacity: 0;
    transition: opacity 320ms ease;
  }
  .solid::before {
    opacity: 1;
  }
  .hidden {
    translate: 0 -100%;
  }
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }
  .home {
    display: inline-flex;
    padding: 8px 0;
  }
  .links {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .link {
    padding: 10px 14px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-2);
    transition: color var(--dur-fast) ease;
  }
  .link:hover {
    color: var(--text-1);
  }
  .launch {
    height: 36px;
    font-size: 13px;
  }
  @media (max-width: 720px) {
    nav {
      height: 60px;
    }
    .link {
      display: none;
    }
  }
</style>
