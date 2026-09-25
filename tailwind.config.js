/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)'
      },
      fontFamily: {
        sans: [
          'Cygnito Mono',
          'Geist Mono Variable',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ],
        mono: [
          'Cygnito Mono',
          'Geist Mono Variable',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ],
        display: [
          'Cygnito Mono',
          'Geist Mono Variable',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ]
      }
    }
  },
  plugins: []
};
