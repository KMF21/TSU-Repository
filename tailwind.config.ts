/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tsu-blue': '#185fa5',
        'tsu-navy': '#0f3d63',
        'tsu-gold': '#c9971c',
        'tsu-cream': '#f7f5f0',
        'tsu-charcoal': '#1f2328',
        'tsu-slate': '#6b7280',
        'tsu-success': '#2e7d32',
        'tsu-border': '#e2ddd2',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};