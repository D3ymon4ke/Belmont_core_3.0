import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        belmont: {
          bg: '#090a0f',
          surface: '#11131b',
          'surface-hover': '#161924',
          'surface-elevated': '#181b26',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-strong': 'rgba(255, 255, 255, 0.15)',
          crimson: '#8b1528',
          'crimson-light': '#a81c34',
          rose: '#e11d48',
          gold: '#d4af37',
          'gold-light': '#f3e5ab',
          text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
            muted: '#64748b',
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'belmont-glow': '0 0 25px -5px rgba(139, 21, 40, 0.3)',
        'belmont-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'mansion-radial': 'radial-gradient(circle at 50% 0%, rgba(139, 21, 40, 0.15) 0%, transparent 60%)',
        'mansion-card': 'linear-gradient(135deg, rgba(24, 27, 38, 0.8) 0%, rgba(17, 19, 27, 0.9) 100%)',
      }
    },
  },
  plugins: [],
}

export default config
