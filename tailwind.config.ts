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
        'tsu-card-hover': '#15213a',
        'tsu-card-border': '#1e2a42',
        'tsu-input-bg': '#0b1220',
        'tsu-input-border': '#223452',
        'tsu-text-primary': '#e8eaed',
        'tsu-text-heading': '#ffffff',
        'tsu-text-secondary': '#a6b0c0',
        'tsu-text-muted': '#8793a6',
        'tsu-accent': '#2563eb',
        'tsu-blue': '#185fa5',
        'tsu-accent-tag-bg': '#132038',
        'tsu-accent-tag-text': '#8db6ec',
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
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 18px 40px -20px rgba(0,0,0,0.6)',
        glow: '0 10px 30px -10px rgba(37,99,235,0.55)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out both',
      },
    },
  },
  plugins: [],
};
