import type { Config } from 'tailwindcss';

// Design-systeem: Shopify (rustig, veel witruimte, groene accenten, subtiele
// kaarten) + eBay (strakke marktplaats-lijsten, blauwe interactie-accenten).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#008060', dark: '#004c3f', hover: '#006e52', soft: '#eaf3ef' },
        ebay: { DEFAULT: '#3665f3', dark: '#1f49c9' },
        ink: '#1a1a1a',
        subtle: '#6b7177',
        muted: '#9096a0',
        surface: '#f6f6f7',
        line: '#e3e3e3',
        laag: '#d72c0d',
        middel: '#b98900',
        hoog: '#3665f3',
        sterk: '#008060',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(23,23,23,0.03), 0 1px 2px rgba(23,23,23,0.06)',
        hover: '0 0 0 1px rgba(23,23,23,0.05), 0 4px 14px rgba(23,23,23,0.08)',
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      maxWidth: { content: '72rem' },
      letterSpacing: { label: '0.04em' },
    },
  },
  plugins: [],
};

export default config;
