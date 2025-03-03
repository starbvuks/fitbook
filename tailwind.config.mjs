/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        background: {
          DEFAULT: '#0C0C0C',
          soft: '#141414',
          softer: '#1A1A1A',
          gradient: {
            from: '#1a1a1a',
            to: '#0C0C0C',
          }
        },
        foreground: {
          DEFAULT: '#FFFFFF',
          soft: '#A1A1A1',
          softer: '#666666',
        },
        accent: {
          purple: {
            light: '#B19DFF',
            DEFAULT: '#9B87F5',
            dark: '#7B67D5',
          },
          blue: {
            light: '#9DCAFF',
            DEFAULT: '#87B9F5',
            dark: '#6799D5',
          },
          pink: '#F587B9',
          yellow: '#F5E787',
        },
        border: {
          DEFAULT: '#2A2A2A',
          bright: '#3A3A3A',
        }
      },
      spacing: {
        container: 'max(1rem, calc((100vw - 1280px) / 2))',
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 24px rgba(155, 135, 245, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
    },
  },
  plugins: [],
};
