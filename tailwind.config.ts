import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F4EFE6',
        'paper-deep': '#EBE3D5',
        'paper-edge': '#D9CFBC',
        ink: '#1C1815',
        'ink-soft': '#544A41',
        'ink-mute': '#8A7E72',
        vermillion: {
          DEFAULT: '#C8312B',
          deep: '#9B2520',
          dim: 'rgba(200,49,43,0.08)',
        },
        gold: {
          DEFAULT: '#A88A4A',
          mute: 'rgba(168,138,74,0.15)',
        },
        ok: '#5C7A3E',
        warn: '#B5832A',
      },
      fontFamily: {
        serif:  ['Fraunces', 'Georgia', 'serif'],
        sans:   ['DM Sans', 'system-ui', 'sans-serif'],
        mono:   ['JetBrains Mono', 'monospace'],
        cjk:    ['Noto Serif SC', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}

export default config
