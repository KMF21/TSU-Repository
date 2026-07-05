/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tsu-bg': '#0b1220',
        'tsu-card': '#111a2e',
        'tsu-card-border': '#1e2a42',
        'tsu-input-bg': '#0b1220',
        'tsu-input-border': '#223452',
        'tsu-text-primary': '#e8eaed',
        'tsu-text-heading': '#ffffff',
        'tsu-text-secondary': '#96a0b0',
        'tsu-text-muted': '#7c8798',
        'tsu-accent': '#2563eb',
        'tsu-accent-tag-bg': '#132038',
        'tsu-accent-tag-text': '#7ca8e0',
        'tsu-success-bg': '#0f2a1c',
        'tsu-success-text': '#4ade80',
        'tsu-gold-bg': '#2a2010',
        'tsu-gold-text': '#d4a017',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        pill: '20px',
      },
    },
  },
  plugins: [],
};