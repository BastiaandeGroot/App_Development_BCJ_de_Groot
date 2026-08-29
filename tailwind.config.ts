import type { Config } from 'tailwindcss';

// Look & feel: Shopify (rustig, veel witruimte, groene accenten) +
// eBay (marktplaats-productlijst met thumbnails en status-labels).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Shopify-groen als primaire "readiness/health"-kleur.
        brand: {
          DEFAULT: '#008060',
          dark: '#004c3f',
          hover: '#006e52',
          soft: '#e3f1ed',
        },
        // eBay-blauw als secundaire/link-kleur.
        ebay: '#3665f3',
        ink: '#1a1a1a',
        subtle: '#616161',
        surface: '#f1f2f4',
        line: '#e1e3e5',
        // Labelkleuren.
        laag: '#d72c0d',
        middel: '#b98900',
        hoog: '#3665f3',
        sterk: '#008060',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
