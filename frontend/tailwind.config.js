/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'], // Tipografía principal del proyecto
      },
      colors: {
        fondo: {
          principal: '#1A1C38',
          secundario: '#20234A',
          terciario: '#282B59',
        },
        superficie: {
          primaria: '#282B59',
          media: '#42468C',
        },
        acento: {
          primario: '#B7AEF2',
          secundario: '#777CD9',
        },
        texto: {
          principal: '#F2E1D8',
        },
        estado: {
          exito: '#4AE882',       // Confirmar (verde)
          advertencia: '#F5C842', // Pendiente (ámbar)
          error: '#F47474',       // Cancelar (rojo)
        }
      }
    },
  },
  plugins: [],
}
