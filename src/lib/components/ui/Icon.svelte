<script lang="ts" module>
  // 20px grid, 1.6px strokes. Static markup only, so {@html} is safe here.
  const PATHS = {
    search: '<circle cx="8.75" cy="8.75" r="5.25"/><path d="m12.75 12.75 3.75 3.75"/>',
    sliders:
      '<path d="M3.5 6.5h7M14.5 6.5h2M3.5 13.5h2M9.5 13.5h7"/><circle cx="12.5" cy="6.5" r="2"/><circle cx="7.5" cy="13.5" r="2"/>',
    close: '<path d="m5.5 5.5 9 9M14.5 5.5l-9 9"/>',
    play: '<path d="M6.5 4.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L7.7 4.1a.8.8 0 0 0-1.2.7Z" fill="currentColor" stroke="none"/>',
    pause:
      '<rect x="5" y="4.5" width="3.4" height="11" rx="1" fill="currentColor" stroke="none"/><rect x="11.6" y="4.5" width="3.4" height="11" rx="1" fill="currentColor" stroke="none"/>',
    'chevron-right': '<path d="m8 5.5 4.5 4.5L8 14.5"/>',
    'chevron-left': '<path d="M12 5.5 7.5 10l4.5 4.5"/>',
    'chevron-down': '<path d="m5.5 8 4.5 4.5L14.5 8"/>',
    info: '<circle cx="10" cy="10" r="7"/><path d="M10 9v4.5"/><circle cx="10" cy="6.6" r=".4" fill="currentColor"/>',
    link: '<path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-.9.9"/><path d="M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l.9-.9"/>',
    check: '<path d="m4.5 10.5 3.5 3.5 7.5-8"/>',
    expand: '<path d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4"/>',
    keyboard:
      '<rect x="2.5" y="5" width="15" height="10" rx="2"/><path d="M6 8.5h.01M9 8.5h.01M12 8.5h.01M15 8.5h.01M6.5 12h7"/>',
    compare: '<circle cx="7" cy="11" r="4"/><circle cx="14" cy="9" r="2.5"/>',
    external: '<path d="M7 5h8v8M15 5 5.5 14.5"/>',
    rocket:
      '<path d="M10 2.5c2.7 1.8 4 4.6 4 8.2l-1.5 3.3h-5L6 10.7c0-3.6 1.3-6.4 4-8.2Z"/><circle cx="10" cy="8" r="1.4"/><path d="M8.5 17h3"/>'
  } as const;
  export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
  let { name, size = 20 }: { name: IconName; size?: number } = $props();
</script>

<svg
  viewBox="0 0 20 20"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true">{@html PATHS[name]}</svg
>

<style>
  svg {
    flex: none;
    display: block;
  }
</style>
