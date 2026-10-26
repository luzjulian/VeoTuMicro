# VeoTuMicro

Aplicación web para la gestión de acceso al transporte público de personas con discapacidad visual. El pasajero solicita un micro por voz, el conductor recibe la alerta en tiempo real y el área administrativa valida los registros y sigue los indicadores.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite 8, Tailwind 4, shadcn/ui |
| Backend | Node.js + Express 5 (CommonJS) |
| Base de datos | PostgreSQL + Prisma 6 |
| Tiempo real | Socket.io 4 |
| Voz | Web Speech API (nativa del navegador) |
| Geocodificación | Nominatim / OpenStreetMap |
| Autenticación | JWT en cookies `httpOnly` (access + refresh) |

## Estructura

```
VeoTuMicro/
├── backend/
│   ├── prisma/           # schema, migraciones y seed
│   └── src/
│       ├── config/       # env (validado con Zod) y swagger
│       ├── controllers/  # entrada HTTP
│       ├── domain/       # entidades
│       ├── lib/          # tokens, cookies, storage, geocoding
│       ├── middlewares/  # auth, validación, rate limit, uploads
│       ├── routes/       # definición de endpoints
│       ├── services/     # lógica de negocio
│       └── sockets/      # eventos de Socket.io
├── frontend/
│   └── src/
│       ├── components/   # por rol: pasajero, conductor, admin
│       ├── context/      # AuthContext
│       ├── hooks/        # voz, GPS, tiempo real
│       ├── pages/        # vistas por rol
│       └── services/     # cliente HTTP y socket
└── README.md
```

## Requisitos

- **Node.js 20.19+ o 22.12+** (lo exige Vite 8; con Node 16 o 18 el frontend no compila)
- npm 10+
- PostgreSQL 15+ (local, en Docker o gestionado)

## Puesta en marcha

### 1. Clonar e instalar

```bash
git clone https://github.com/luzjulian/VeoTuMicro.git
cd VeoTuMicro
npm --prefix backend install
npm --prefix frontend install
```

### 2. Base de datos

Necesitás una base PostgreSQL accesible. Con Docker, sin archivo de compose:

```bash
docker run -d --name veotumicro-db \
  -e POSTGRES_USER=veotumicro \
  -e POSTGRES_PASSWORD=veotumicro \
  -e POSTGRES_DB=veotumicro_db \
  -p 5432:5432 \
  postgres:15
```

### 3. Variables de entorno

Copiá el ejemplo y completalo:

```bash
cp backend/.env.example backend/.env
```

Las obligatorias:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL |
| `CORS_ORIGIN` | Origen del frontend (en desarrollo, `http://localhost:5173`) |
| `JWT_SECRET` | Mínimo 32 caracteres. Generalo con `openssl rand -base64 48` |

`backend/src/config/env.js` valida el archivo con Zod al arrancar. Si falta una variable o `JWT_SECRET` es corto, el proceso **no arranca** y el error dice cuál es. El resto de las variables tienen valores por defecto; están documentadas en `.env.example`.

Dos notas:

- **Mail.** En desarrollo, si `SMTP_HOST` queda vacío los mails de validación no se envían: se imprimen en la consola. En producción (`NODE_ENV=production`) `SMTP_HOST` es obligatoria.
- **Geocodificación.** La ubicación manual del pasajero resuelve intersecciones contra Nominatim. No necesita API key. `GEOCODING_BBOX` limita la búsqueda al Gran La Plata por defecto.

### 4. Migraciones y datos de prueba

```bash
cd backend
npx prisma migrate dev
npm run seed
```

El seed carga líneas, ramales, paradas y usuarios de prueba. **No es idempotente**: corrélo una sola vez por base, o vas a duplicar registros.

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administrativo | `admin.jefe` | `admin1234` |
| Conductor | `chofer.carlos` | `chofer1234` |
| Pasajero | `pasajero.ana` | `pasajero1234` |

Hay más conductores (`chofer.mario`, `chofer.lucas`, `chofer.pedro`, `chofer.jorge`, `chofer.roberto`) y otra pasajera (`pasajero.maria`) con las mismas contraseñas por rol. El seed los lista en consola al terminar.

### 5. Levantar el proyecto

Dos terminales:

```bash
# Terminal 1 — API en http://localhost:5000
npm --prefix backend run dev

# Terminal 2 — frontend en http://localhost:5173
npm --prefix frontend run dev
```

Abrí `http://localhost:5173`. El proxy de Vite reenvía `/api` al backend, incluidos los WebSockets, así que el navegador ve un solo origen y las cookies de sesión funcionan sin configuración extra.

## Scripts

### Backend

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor con recarga automática (nodemon) |
| `npm start` | Servidor en modo producción |
| `npm run seed` | Carga los datos de prueba |

### Frontend

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Compila a `frontend/dist` |
| `npm run preview` | Sirve el build compilado |
| `npm run lint` | ESLint |

## API

Con el backend corriendo, la documentación Swagger está en `http://localhost:5000/api-docs`.

Todo cuelga de `/api`:

| Prefijo | Responsabilidad |
| --- | --- |
| `/api/auth` | Registro, login, refresh, logout |
| `/api/viajes` | Solicitudes de viaje y su ciclo de vida |
| `/api/lineas` | Líneas y ramales |
| `/api/paradas` | Paradas y geocodificación de intersecciones |
| `/api/perfil` | Datos del usuario y su certificado |
| `/api/admin` | Bandeja de validación e indicadores |

`GET /health` responde `{"status":"ok"}` sin autenticación, para los chequeos de salud del hosting.

Los WebSockets viven en `/api/socket.io`. Están bajo `/api` a propósito: así el navegador adjunta la cookie del access token en el handshake, que es cómo el servidor identifica al usuario del socket.

## Autenticación

Dos JWT en cookies `httpOnly`, inaccesibles para el JavaScript de la página:

- `accessToken` — path `/api`, vence en 1 hora
- `refreshToken` — path `/api/auth`, vence en 7 días

Cuando el access token vence, el cliente HTTP (`frontend/src/services/api/apiClient.js`) llama una sola vez a `/api/auth/refresh` y repite el pedido. Si varios pedidos fallan a la vez, se hace un único refresh.

En producción las cookies salen con `secure` y `sameSite: strict`. **Esto obliga a que el frontend y la API compartan origen o dominio registrable**: Safari en iOS bloquea cookies de terceros por defecto, así que servirlos desde dominios distintos rompe el login en iPhone.

## Accesibilidad y voz

La interacción por voz usa la Web Speech API del navegador, con dos limitaciones asumidas en iOS:

- Safari necesita el prefijo `webkitSpeechRecognition` y una interacción táctil del usuario antes de habilitar el micrófono.
- La Vibration API no funciona en Safari para iOS. En esos dispositivos las alertas dependen de estímulos visuales de alto contraste y señales sonoras.