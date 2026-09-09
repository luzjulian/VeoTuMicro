/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // @fontsource-variable/geist — importado en main.jsx
        sans: ['Geist Variable', 'sans-serif'],
      },
      colors: {
        fondo: {
          principal:  '#1A1C38',
          secundario: '#20234A',
          terciario:  '#282B59',
        },
        superficie: {
          primaria: '#282B59',
          media:    '#42468C',
        },
        acento: {
          primario:   '#B7AEF2',
          secundario: '#C8C4F5',
        },
        texto: {
          principal:  '#F2E1D8',
          // Token semántico accesible para texto de apoyo / descripciones.
          // Contraste certificado WCAG AAA:
          //   10:1 contra fondo-principal  (#1A1C38)
          //    8:1 contra superficie-primaria (#282B59)
          secundario: '#C8C4F5',
        },
        estado: {
          exito:       '#4AE882',
          advertencia: '#F5C842',
          error:       '#F47474',
        },
      },
    },
  },
  plugins: [],
}