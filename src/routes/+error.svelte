<script lang="ts">
  import { page } from '$app/state';
</script>

<div
  class="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#F5F0E8] px-6 text-center text-[#141414]"
>
  <img
    src="/stargazer-mark.svg"
    alt=""
    width="120"
    height="120"
    class="h-24 w-24 opacity-80 sm:h-28 sm:w-28"
  />

  <div>
    <div
      class="mb-2 font-display text-[4rem] uppercase leading-none tracking-[-0.03em] sm:text-[6rem]"
    >
      {page.status}
    </div>
    <p class="text-[15px] text-[#686660]">
      {#if page.status === 404}
        Lost in space — this page doesn't exist
      {:else}
        Something went wrong
      {/if}
    </p>
  </div>

  <a
    href="/app"
    class="inline-flex h-12 items-center bg-[#E8441E] px-8 text-[13px] text-white transition-[background-color,transform] duration-150 ease-out hover:bg-[#d03a15] active:scale-[0.96]"
  >
    Open Stargazer
  </a>
</div>
