/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFCF7',
          100: '#F7F4EC',
          150: '#F3EFE4',
          200: '#EFECE2',
          300: '#E2DDD1',
          400: '#C9C3B4',
          500: '#ADA798',
        },
        ink: {
          950: '#121110',
          900: '#1A1816',
          800: '#2C2926',
          700: '#45413C',
          600: '#5C564F',
          500: '#757067',
          400: '#A19C91',
          300: '#CCC8BD',
          200: '#E5E2D9',
          100: '#F2EFEB',
        },
        moss: {
          950: '#0E2117',
          900: '#173626',
          850: '#1E4532',
          800: '#26533C',
          700: '#2E664A',
          600: '#3A7D5C',
          500: '#4B9670',
          400: '#68B08A',
          200: '#C3E4D2',
          100: '#E5F3EB',
          50: '#F2F8F4',
        },
        terracotta: {
          900: '#6B2412',
          800: '#94331A',
          700: '#B94726',
          600: '#D45D3B',
          500: '#E37656',
          200: '#F9D0C4',
          100: '#FDF0EB',
          50: '#FFF7F5',
        },
        amber: {
          900: '#6E400E',
          800: '#8F5313',
          700: '#B26A1A',
          600: '#D48224',
          500: '#E89D3C',
          200: '#FDE4C2',
          100: '#FEF7EB',
          50: '#FFFBF5',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Newsreader', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(26, 24, 22, 0.04), 0 1px 3px rgba(26, 24, 22, 0.03)',
        'elevated': '0 4px 12px rgba(26, 24, 22, 0.06), 0 1px 3px rgba(26, 24, 22, 0.04)',
        'modal': '0 12px 32px rgba(26, 24, 22, 0.12), 0 2px 6px rgba(26, 24, 22, 0.06)',
      },
      maxWidth: {
        'content': '1320px',
      }
    },
  },
  plugins: [],
}
