<script lang="ts">
  import { selection, SOLAR_SYSTEM_VIEW } from '$stores/selection';
  import { getAncestors } from '$lib/registry/registry';
  import { infoPanelOpen, openInfoPanel, selectBody } from '$stores/ui';
  import Icon from '$components/ui/Icon.svelte';

  const overview = $derived(!$selection || $selection === SOLAR_SYSTEM_VIEW);
  // The Sun is the root of the registry, but "Solar system" already stands for it.
  const chain = $derived(
    overview
      ? []
      : getAncestors($selection!).filter((body) => body.id !== 'sun' || body.id === $selection)
  );
</script>

<nav aria-label="Location">
  <ol>
    <li>
      {#if overview}
        <span class="crumb current" aria-current="location"
          ><span class="text">Solar system</span></span
        >
      {:else}
        <button class="crumb" type="button" onclick={() => selectBody(SOLAR_SYSTEM_VIEW)}
          ><span class="text">Solar system</span></button
        >
      {/if}
    </li>
    {#each chain as body, index (body.id)}
      <li>
        <Icon name="chevron-right" size={14} />
        {#if index === chain.length - 1}
          <!-- The current crumb brings back its details once they have been closed. -->
          <button
            class="crumb current"
            type="button"
            aria-current="location"
            disabled={$infoPanelOpen}
            onclick={openInfoPanel}
            ><span class="text">{body.name}</span>{#if !$infoPanelOpen}<Icon
                name="info"
                size={14}
              />{/if}</button
          >
        {:else}
          <button class="crumb" type="button" onclick={() => selectBody(body.id)}
            ><span class="text">{body.name}</span></button
          >
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  nav {
    min-width: 0;
  }
  ol {
    display: flex;
    align-items: center;
    min-width: 0;
    color: var(--text-3);
  }
  li {
    display: flex;
    align-items: center;
    flex: 0 1 auto;
    min-width: 0;
  }
  /* Ancestors give up space before the current location does. */
  li:last-child {
    flex-shrink: 0.2;
  }
  .crumb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    height: 36px;
    padding: 0 8px;
    border-radius: var(--radius-pill);
    color: var(--text-2);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    text-shadow: 0 1px 12px rgb(0 0 0 / 0.8);
    transition:
      background-color var(--dur-fast) ease,
      color var(--dur-fast) ease;
  }
  .text {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  button.crumb:not(:disabled):hover {
    background: rgb(245 245 245 / 0.08);
    color: var(--text-1);
  }
  .current {
    color: var(--text-1);
  }
  .crumb:disabled {
    cursor: default;
  }
  .crumb :global(svg) {
    color: var(--text-3);
  }
  /* Phones keep the parent as a way back and the current location. */
  @media (max-width: 639px) {
    li:not(:nth-last-child(-n + 2)) {
      display: none;
    }
    li:nth-last-child(2) {
      flex-shrink: 0;
    }
    li:last-child {
      flex-shrink: 1;
    }
    li:first-child > :global(svg),
    li:nth-last-child(2) > :global(svg) {
      display: none;
    }
  }
  @media (pointer: coarse) {
    .crumb {
      height: 44px;
    }
  }
</style>
