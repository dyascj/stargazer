<script lang="ts">
  /** Heading text that resolves letter by letter from a blur, after `delay` ms. */
  let { text, delay = 0 }: { text: string; delay?: number } = $props();
  // Letters stay grouped per word so lines only break between words.
  const words = $derived.by(() => {
    let offset = 0;
    return text.split(' ').map((word) => {
      const letters = [...word].map((letter, index) => ({
        letter,
        start: delay + (offset + index) * 18
      }));
      offset += word.length + 1;
      return letters;
    });
  });
</script>

<span class="visually-hidden">{text}</span><span aria-hidden="true"
  >{#each words as word, index}{#if index}{' '}{/if}<span class="word"
      >{#each word as { letter, start }}<span class="letter" style:animation-delay="{start}ms"
          >{letter}</span
        >{/each}</span
    >{/each}</span
>

<style>
  .word {
    display: inline-block;
    white-space: nowrap;
  }
  .letter {
    display: inline-block;
    animation: blur-in 380ms var(--spring-bounce) both;
  }
  @keyframes blur-in {
    from {
      opacity: 0;
      filter: var(--enter-blur, blur(5px));
      transform: translateY(-0.5em);
    }
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
