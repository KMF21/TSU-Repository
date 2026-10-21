/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light theme shared with the TSU screening portal: pale page,
        // white cards, deep navy ink, gold accent.
        'tsu-bg': '#f5f7fb',
        'tsu-card': '#ffffff',
        'tsu-card-hover': '#fbfcfe',
        'tsu-card-border': '#e3e8f0',
        'tsu-input-bg': '#ffffff',
        'tsu-input-border': '#d3dbe8',
        'tsu-navy': '#0f1f3d',
        'tsu-navy-deep': '#091428',
        'tsu-text-primary': '#1f2b40',
        'tsu-text-heading': '#0f1f3d',
        'tsu-text-secondary': '#4a5a73',
        'tsu-text-muted': '#6b7a92',
        'tsu-accent': '#c9971c',
        'tsu-gold': '#e4bb5a',
        'tsu-blue': '#185fa5',
        'tsu-accent-tag-bg': '#eef2f9',
        'tsu-accent-tag-text': '#1d3a6b',
        'tsu-success-bg': '#e7f6ed',
        'tsu-success-text': '#17803d',
        'tsu-gold-bg': '#fdf3d9',
        'tsu-gold-text': '#8a6410',
      },
      fontFamily: {
        display: ['"Sora Variable"', 'Sora', 'system-ui', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,31,61,0.04), 0 8px 24px -12px rgba(15,31,61,0.10)',
        lift: '0 2px 4px rgba(15,31,61,0.05), 0 18px 36px -16px rgba(15,31,61,0.22)',
        glow: '0 10px 24px -10px rgba(201,151,28,0.65)',
        navy: '0 10px 24px -12px rgba(15,31,61,0.55)',
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
