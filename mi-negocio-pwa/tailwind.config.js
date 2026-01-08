/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 
          DEFAULT: '#572364',    // Morado principal
          dark: '#3d1846',       // Morado más oscuro (hover)
          light: '#7a3589'       // Morado más claro (destacados)
        },
        success: '#10B981',      // Verde para éxito
        danger: '#EF4444',       // Rojo para errores/alertas
        warning: '#F59E0B'       // Amarillo para advertencias
      },
      borderRadius: { 
        button: '12px'           // Botones redondeados medianos
      },
      spacing: { 
        '18': '4.5rem'           // Espaciado personalizado
      }
    }
  },
  plugins: []
}