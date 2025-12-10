/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores primárias do dashboard Viva Eventos
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6600', // Cor principal - Laranja Viva
          600: '#e55a00',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Cores de fundo escuro
        dark: {
          primary: '#212529',
          secondary: '#343A40',
          tertiary: '#495057',
          border: '#3c434a',
        },
        // Cores de texto
        text: {
          primary: '#F8F9FA',
          secondary: '#ADB5BD',
          muted: '#6c757d',
        },
        // Cores de status
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'viva': '0 4px 10px rgba(255, 102, 0, 0.12)',
        'viva-lg': '0 8px 18px rgba(0, 0, 0, 0.4)',
        'card': '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
