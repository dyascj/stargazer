<script lang="ts">
  /** Stargazer mark (a star rising over a planet's limb) with optional wordmark. */
  let { wordmark = true, size = 24 }: { wordmark?: boolean; size?: number } = $props();
  const id = $props.id();
</script>

<span class="brand" style:--size="{size}px">
  <svg viewBox="0 -5 32 32" fill="currentColor" aria-hidden="true">
    <mask id="limb-{id}"
      ><circle cx="16" cy="46" r="28" fill="#fff" /><circle
        cx="16"
        cy="334.7"
        r="312.7"
        fill="#000"
      /></mask
    >
    <rect y="17" width="32" height="9" mask="url(#limb-{id})" />
    <path
      d="M16 0c.7 5 2.2 6.5 7.2 7.2-5 .7-6.5 2.2-7.2 7.2-.7-5-2.2-6.5-7.2-7.2C13.8 6.5 15.3 5 16 0Z"
    />
  </svg>
  {#if wordmark}<span class="wordmark">Stargazer</span>{/if}
</span>

<style>
  .brand {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--size) * 0.45);
    color: var(--text-1);
  }
  svg {
    width: var(--size);
    height: var(--size);
    flex: none;
  }
  .wordmark {
    font-size: calc(var(--size) * 0.54);
    font-weight: 600;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    /* Optical correction: trailing tracking would offset the visual center. */
    margin-right: -0.32em;
  }
</style>
