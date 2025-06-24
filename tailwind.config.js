/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kumon-blue': '#33C3F0',       // main Kumon blue
        'kumon-dark': '#279FC5',
        'kumon-light': '#B3E7FA',
        'kumon-white': '#ffffff',
        'kumon-gray': '#f7f7f7',
        'kumon-orange': '#FF6600',
        'kumon-yellow': '#FFD700',
        'kumon-green': '#00CC66',
        'kumon-purple': '#9966CC',
        'kumon-pink': '#FF69B4',
      },
      fontFamily: {
        'kid': ['Nunito', 'Comic Sans MS', 'cursive', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-kumon': 'linear-gradient(to bottom right, #33C3F0, #279FC5)',
        'gradient-kumon-soft': 'linear-gradient(to bottom, #33C3F0, #ffffff)',
      },
    },
  },
  plugins: [],
}

