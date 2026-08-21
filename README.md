# VeoTuMicro

Aplicación web destinada a la gestión integral de acceso a transporte público para personas con discapacidad visual.

## Stack Tecnológico

- **Frontend**: React con Vite
- **Backend**: Node.js con Express
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Container**: Docker

## Estructura del Proyecto

```
VeoTuMicro/
├── frontend/          # Aplicación frontend React
├── backend/           # Servidor backend Node.js/Express
└── README.md
```

## Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Docker & Docker Compose
- PostgreSQL (a través de Docker)

## Comenzar

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd VeoTuMicro
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar Variables de Entorno

Crear archivo `.env` en el directorio `backend/`:

```env
DATABASE_URL="postgresql://TUSUARIO:TUCLAVE@localhost:5432/veotumicro_db"
NODE_ENV=development
PORT=5000
```

### 5. Iniciar Servicios

#### Iniciar PostgreSQL (desde el directorio backend)

```bash
docker-compose up -d
```

#### Ejecutar Migraciones (desde el directorio backend)

```bash
npx prisma migrate dev --name init
```
