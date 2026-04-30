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
        void: '#07070e',
        surface: '#0e0e1a',
        panel: '#13131f',
        border: '#1c1c2e',
        muted: '#2a2a40',
        accent: {
          DEFAULT: '#3b82f6',
          glow: '#1d4ed8',
          dim: '#1e3a5f',
        },
        amber: {
          DEFAULT: '#f59e0b',
          glow: '#d97706',
          dim: '#451a03',
        },
        jade: {
          DEFAULT: '#10b981',
          dim: '#064e3b',
        },
        text: {
          primary: '#e2e8f0',
          secondary: '#64748b',
          muted: '#374151',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'grid-void': 'radial-gradient(circle, #1c1c2e 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid-sm': '24px 24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #3b82f6, 0 0 10px #3b82f6' },
          '100%': { boxShadow: '0 0 20px #3b82f6, 0 0 40px #3b82f6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'accent': '0 0 30px rgba(59, 130, 246, 0.15)',
        'accent-lg': '0 0 60px rgba(59, 130, 246, 0.2)',
        'amber': '0 0 30px rgba(245, 158, 11, 0.15)',
        'panel': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}

export default config
