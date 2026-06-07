/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0f0e17',
        surface: 'rgba(255, 255, 255, 0.03)',
        surfaceHover: 'rgba(255, 255, 255, 0.06)',
        surfaceBorder: 'rgba(255, 255, 255, 0.08)',
        primary: '#a78bfa',
        primaryHover: '#8b5cf6',
        textPrimary: '#e2e8f0',
        textSecondary: '#94a3b8',
      }
    },
  },
  plugins: [],
}
