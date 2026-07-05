/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          DEFAULT: '#1B2340',
          soft: '#2D3454',
          deep: '#12172B'
        },
        paper: {
          DEFAULT: '#F7F6F3',
          raised: '#FFFFFF',
          line: '#E4E1D8'
        },
        moon: {
          DEFAULT: '#D4AF6A',
          soft: '#E9CFA0',
          deep: '#B8933F'
        },
        sage: {
          DEFAULT: '#4E7C6F',
          soft: '#DCE8E3'
        },
        signal: {
          DEFAULT: '#C15B4A',
          soft: '#F2DCD6'
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Public Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      borderRadius: {
        card: '14px'
      }
    }
  },
  plugins: []
}
