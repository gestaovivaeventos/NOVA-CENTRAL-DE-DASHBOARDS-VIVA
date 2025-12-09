/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores Viva Eventos
        viva: {
          primary: '#FF6600',
          'primary-dark': '#E55A00',
          'primary-light': '#FF8533',
        },
        // Dark Theme
        dark: {
          bg: '#212529',
          'bg-secondary': '#343A40',
          'bg-tertiary': '#495057',
          border: '#495057',
          text: '#F8F9FA',
          'text-muted': '#ADB5BD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
