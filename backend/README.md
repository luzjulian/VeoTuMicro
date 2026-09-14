# Backend VeoTuMicro

Backend con Node.js/Express, ORM Prisma y base de datos PostgreSQL.

## Requisitos Previos

- Node.js (v16+)
- npm
- Docker & Docker Compose
- PostgreSQL 15

## Instalación

```bash
npm install
```

## Configuración de Variables de Entorno

Crear archivo `.env`:

```env
DATABASE_URL="postgresql://admin_veotumicro:indecifrablejaja@localhost:5432/veotumicro_db"
NODE_ENV=development
PORT=5000
```

## Ejecutar la Aplicación

### Iniciar Base de Datos

```bash
docker-compose up -d
```

### Ejecutar Migraciones

```bash
npx prisma migrate dev --name init
```

### Iniciar Servidor de Desarrollo

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:5000`

### Detener Base de Datos

```bash
docker-compose down
```

## Estructura del Proyecto

```
src/
├── app.js                  # Configuración de Express (cors, helmet, cookies, rutas)
├── server.js               # Punto de entrada del servidor
│
├── config/
│   ├── env.js              # Validación de variables de entorno con Zod
│   └── prisma.js           # Instancia única de PrismaClient
│
├── lib/                    # Utilidades reutilizables sin lógica de negocio
│   ├── http-errors.js      # Clases de error con status HTTP
│   ├── password.js         # Hash y verificación de contraseñas con bcrypt
│   ├── tokens.js           # Generación y verificación de JWT y refresh tokens
│   └── auth-cookies.js     # Seteo y limpieza de cookies HttpOnly
│
├── domain/                 # Schemas de validación (Zod) y mappers de salida
│   └── cuenta.js           # loginSchema, registerSchema
│
├── middlewares/
│   ├── error-handler.js    # Manejo centralizado de errores
│   ├── validate.js         # Validación de body con Zod
│   ├── require-auth.js     # Verificación de token y restricción por rol
│   └── rate-limit.js       # Rate limiting global y para auth
│
├── controllers/            # Traducen HTTP ↔ servicio (req/res, cookies)
├── services/               # Lógica de negocio y acceso a la BD (Prisma)
└── routes/                 # Definición de rutas y middlewares por módulo
```
## Endpoints de API

### Auth — `/api/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registra un nuevo usuario con rol | No |
| POST | `/api/auth/login` | Inicia sesión y setea cookies | No |
| POST | `/api/auth/refresh` | Renueva el access token | Cookie |
| POST | `/api/auth/logout` | Cierra sesión y revoca el refresh token | Cookie |

#### Register — campos según rol

- `pasajero` → `certificadoDiscapacidad`, `adminOid` (opcional)
- `chofer` → `nroLicenciaConducir`
- `administrativo` → `legajo`

## Base de Datos

- **Tipo**: PostgreSQL 15
- **Host**: localhost:5432
- **ORM**: Prisma
- **Migraciones**: Ubicadas en `prisma/migrations/`

### Comandos de Prisma

```bash
# Ver base de datos
npx prisma studio

# Crear migración
npx prisma migrate dev --name <migration-name>

# Generar cliente
npx prisma generate

# Reiniciar base de datos
npx prisma migrate reset
```

## Endpoints de API

[Agregar documentación de API aquí]

## Scripts

- `npm run dev` - Iniciar servidor de desarrollo con nodemon
- `npm start` - Iniciar servidor en producción

## Dependencias

- express
- cors
- dotenv
- @prisma/client

## Dependencias de Desarrollo

- nodemon
- prisma

## Solución de Problemas

### Problemas de Conexión

- Asegúrate de que el contenedor Docker está corriendo: `docker-compose ps`
- Verifica DATABASE_URL en .env
- Comprueba que PostgreSQL está saludable: `docker-compose logs db_veotumicro`

### Puerto Already in Use (Puerto en Uso)

```bash
# Encontrar proceso usando puerto 5000
lsof -i :5000

# Terminar proceso
kill -9 <PID>
```

## Contribuir

Sigue la estructura de código y convenciones de nomenclatura existentes.
