# Frontend VeoTuMicro

Aplicación frontend en React construida con Vite para el proyecto VeoTuMicro.

## Requisitos Previos

- Node.js (v16+)
- npm

## Instalación

```bash
npm install
```
## Estructura del Proyecto

```
src/
├── main.jsx           # Punto de entrada de la aplicación
├── App.jsx            # Componente principal App
├── App.css            # Estilos específicos de la aplicación, si son necesarios
├── index.css          # Tailwind, tema de shadcn y estilos globales
├── assets/            # Imágenes, fuentes y archivos estáticos
├── components/        # Componentes React reutilizables
│   └── ui/            # Librería de componentes UI
├── pages/             # Componentes de página
│   └── gastos/        # Páginas de gastos
└── lib/
    └── utils.js       # Funciones de utilidad
```

## Tailwind CSS

El proyecto utiliza Tailwind CSS v4 mediante el plugin oficial de Vite, definido en `vite.config.js`.

Los estilos globales, las variables de tema y las personalizaciones de Tailwind deben mantenerse en `src/index.css`. Las clases de utilidad se pueden utilizar directamente en los componentes JSX.

## shadcn/ui

Los componentes de shadcn/ui se agregan al proyecto como código fuente editable, en `src/components/ui/`. El proyecto está configurado con el preset Nova y utiliza Base UI como librería de componentes accesibles.

## Integración de API

El frontend se comunica con la API del backend ejecutándose en `http://localhost:5000/api/`

### Ejemplo de Llamada a API

```javascript
const response = await fetch('http://localhost:5000/api/endpoint', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## Estilos

El proyecto utiliza Tailwind CSS para las clases de utilidad y shadcn/ui para los componentes reutilizables. Los estilos globales y el tema se encuentran en `src/index.css`. `App.css` puede utilizarse para estilos específicos de la aplicación que no resulten prácticos como clases de Tailwind.

## Organización de Componentes

- **components/ui/** - Componentes UI reutilizables
- **pages/** - Componentes de nivel de página
- **assets/** - Archivos estáticos e imágenes
