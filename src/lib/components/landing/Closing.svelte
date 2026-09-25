<script lang="ts">
  import Brand from '$components/brand/Brand.svelte';
  import { magnetic, reveal } from './motion';

  const year = new Date().getUTCFullYear();
</script>

<section class="closing" aria-labelledby="closing-title">
  <div class="mark" data-reveal use:reveal aria-hidden="true">
    <svg viewBox="0 -5 32 32" fill="currentColor">
      <mask id="closing-limb"
        ><circle cx="16" cy="46" r="28" fill="#fff" /><circle
          cx="16"
          cy="334.7"
          r="312.7"
          fill="#000"
        /></mask
      >
      <clipPath id="closing-sky"><rect x="-8" y="-12" width="48" height="31" /></clipPath>
      <rect y="17" width="32" height="9" mask="url(#closing-limb)" />
      <g clip-path="url(#closing-sky)"
        ><path
          class="star"
          d="M16 0c.7 5 2.2 6.5 7.2 7.2-5 .7-6.5 2.2-7.2 7.2-.7-5-2.2-6.5-7.2-7.2C13.8 6.5 15.3 5 16 0Z"
        /></g
      >
    </svg>
  </div>
  <div class="copy container" data-reveal use:reveal style:--d="200ms">
    <h2 id="closing-title">Look up.</h2>
    <p>The solar system is waiting, live in your browser.</p>
    <div class="actions">
      <a class="btn btn-primary" href="/app" use:magnetic>Launch explorer</a>
      <a class="btn ghost" href="/app?body=solarSystem" use:magnetic={4}>Start from the Sun</a>
    </div>
  </div>
</section>

<footer class="container">
  <div class="top">
    <Brand size={22} />
    <nav aria-label="Footer">
      <a href="/app">Explorer</a>
      <a href="https://github.com/dyascj/stargazer" target="_blank" rel="noreferrer">GitHub</a>
      <a
        href="https://github.com/dyascj/stargazer/blob/master/THIRD_PARTY_NOTICES.md"
        target="_blank"
        rel="noreferrer">Credits</a
      >
    </nav>
  </div>
  <div class="fine">
    <p>
      Data from NASA, JPL, ESA, JAXA, CelesTrak and The Space Devs. Textures by Solar System Scope,
      CC BY 4.0. Logos are trademarks of their owners, shown for source attribution only.
    </p>
    <p>Not affiliated with NASA, JPL, ESA, JAXA or SpaceX.</p>
    <p>
      © {year} The Lab by Ordinary Company. Code under the
      <a
        href="https://github.com/dyascj/stargazer/blob/master/LICENSE"
        target="_blank"
        rel="noreferrer">MIT License</a
      >.
    </p>
  </div>
</footer>

<style>
  .closing {
    position: relative;
    padding-block: clamp(120px, 20vh, 220px) clamp(96px, 16vh, 160px);
    text-align: center;
    background: radial-gradient(70% 50% at 50% 0%, rgb(92 213 255 / 0.05), transparent 70%);
  }
  .mark {
    width: clamp(96px, 14vw, 160px);
    margin: 0 auto;
    color: var(--text-1);
  }
  .star {
    translate: 0 14px;
    transition: translate 1400ms var(--ease-out) 300ms;
  }
  .mark:global([data-in]) .star {
    translate: 0 0;
  }
  h2 {
    margin-top: 40px;
    font-size: clamp(3.5rem, 9vw, 8rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }
  .copy p {
    margin-top: 20px;
    font-size: clamp(1rem, 1.3vw, 1.1875rem);
    color: var(--text-2);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 40px;
  }
  .btn {
    height: 52px;
    padding: 0 26px;
    font-size: 15px;
    transition:
      background-color var(--dur-fast) ease,
      scale 260ms var(--ease-overshoot),
      translate 420ms cubic-bezier(0.22, 0.9, 0.28, 1);
  }
  .ghost {
    background: var(--surface-2);
  }
  .ghost:hover {
    background: var(--surface-3);
  }

  footer {
    padding-block: 40px max(40px, env(safe-area-inset-bottom));
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 24px 28px;
    border-radius: var(--radius-2xl);
    background: var(--surface-1);
  }
  nav {
    display: flex;
    gap: 4px;
  }
  nav a {
    padding: 8px 12px;
    border-radius: var(--radius-pill);
    font-size: 14px;
    color: var(--text-2);
    transition:
      color var(--dur-fast) ease,
      background-color var(--dur-fast) ease;
  }
  nav a:hover {
    color: var(--text-1);
    background: var(--surface-3);
  }
  .fine {
    display: grid;
    gap: 6px;
    margin-top: 24px;
    padding-inline: 28px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-3);
  }
  .fine a {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .fine a:hover {
    color: var(--text-2);
  }

  @media (max-width: 560px) {
    .actions .btn {
      flex: 1 1 100%;
    }
    .top {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
    }
    nav {
      margin-left: -12px;
    }
    .fine {
      padding-inline: 4px;
    }
  }
</style>
