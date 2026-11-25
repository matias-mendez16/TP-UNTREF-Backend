# Turnero Médico — API REST

**Diplomatura en Programación Backend · UNTREF — Sede Guaminí**

API REST para gestionar turnos médicos: pacientes consultan disponibilidad, reservan y cancelan; médicos administran lugares de atención, bloques horarios y ven su agenda; administradores crean médicos y supervisan turnos. El proyecto se desarrolla con **Spec-Driven Development (SDD)** usando **OpenSpec** y **OpenCode**, con foco en integridad transaccional, control de roles y defensibilidad técnica.

---

## 1. Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Runtime y lenguaje | Node.js + JavaScript con ECMAScript Modules (`"type": "module"`) |
| Servidor HTTP | Express 5 |
| Persistencia | MySQL 8 + `mysql2` + Sequelize |
| Seguridad | `bcryptjs`, `jsonwebtoken`, cookie HTTPOnly, `helmet`, `express-rate-limit` |
| Configuración | `dotenv` con validación obligatoria en `src/config/env.js` |
| Logging | `pino` (logging estructurado, sin secretos) |
| Documentación | Swagger UI con `swagger-ui-express` / `swagger-jsdoc` |
| Proceso SDD | OpenSpec + OpenCode, con `AGENTS.md` como fuente de reglas |

---

## 2. Requisitos previos

| Requisito | Versión recomendada |
| --- | --- |
| Node.js | 18 o superior |
| npm | Incluido con Node.js |
| MySQL | 8 o superior |
| Git | Para clonar el repositorio |

Se requiere una instancia MySQL accesible con un usuario que pueda crear la base de datos y ejecutar DDL.

---

## 3. Instalación y configuración

### 3.1. Clonar e instalar

```bash
git clone <URL_DEL_REPOSITORIO>
cd TP-UNTREF-Backend
npm install
```

### 3.2. Variables de entorno

```bash
cp .env.example .env
```

`.env` está excluido del repositorio. La aplicación valida las variables obligatorias al iniciar: si falta alguna, informa cuál e impide el arranque.

| Variable | Obligatoria | Ejemplo | Descripción |
| --- | --- | --- | --- |
| `PORT` | Sí | `3000` | Puerto HTTP del servidor. |
| `NODE_ENV` | Sí | `development` | `development`, `test` o `production`. |
| `LOG_LEVEL` | Sí | `info` | `trace`, `debug`, `info`, `warn`, `error` o `fatal`. |
| `DB_HOST` | Sí | `localhost` | Host de MySQL. |
| `DB_PORT` | Sí | `3306` | Puerto de MySQL. |
| `DB_DATABASE` | Sí | `turnero_medico` | Nombre de la base. No se usa `DB_NAME`. |
| `DB_USER` | Sí | `root` | Usuario de MySQL. |
| `DB_PASSWORD` | No | `cambiar_clave_local` | Contraseña de MySQL; puede quedar vacía en entornos locales. |
| `JWT_SECRET` | Sí | vacío en la plantilla | Secreto de firma: reemplazar antes de iniciar. Nunca subirlo al repositorio. |
| `JWT_EXPIRES_IN` | Sí | `1h` | Caducidad del token. |
| `COOKIE_NAME` | Sí | `token` | Nombre de la cookie de sesión. |
| `COOKIE_SAME_SITE` | Sí | `lax` | `strict`, `lax` o `none`. Mitigación CSRF junto con la cookie no legible desde JS. |
| `COOKIE_MAX_AGE_MS` | Sí | `3600000` | Duración de la cookie en milisegundos. |
| `COOKIE_SECURE` | No | `false` | `true` en producción; si se omite, se activa automáticamente en `production`. |
| `COOKIE_PATH` | No | `/` | Ruta de la cookie. Debe comenzar con `/`. |
| `RATE_LIMIT_WINDOW_MS` | Sí | `900000` | Ventana general del limitador. |
| `RATE_LIMIT_MAX` | Sí | `100` | Máximo general de solicitudes por ventana. |
| `AUTH_RATE_LIMIT_MAX` | Sí | `20` | Máximo específico para `/api/auth`; debe ser menor que `RATE_LIMIT_MAX`. |
| `ADMIN_NOMBRE` | No | `Administrador` | Usado solo por `src/scripts/crear-admin.js`. |
| `ADMIN_EMAIL` | No | `admin@example.com` | Email del administrador inicial. |
| `ADMIN_PASSWORD` | No | `Reemplazar123` | Contraseña del administrador inicial; cumplir 8 a 72 caracteres, con letra y dígito. |

Notas operativas:

- El payload del token se genera solo en el backend con `id`, `rol` y `medicoId`.
- La cookie se emite con `httpOnly: true`, `sameSite`, `path`, `maxAge` y `secure` según entorno.
- `POST /api/auth/logout` elimina la cookie con los mismos atributos usados al crearla; no revoca criptográficamente un token ya emitido.
- Las respuestas nunca incluyen `passwordHash`, JWT ni cookies completas.

---

## 4. Base de datos, migraciones y administrador

### 4.1. Crear la base

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS turnero_medico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4.2. Aplicar migraciones

```bash
npm run migrate
```

El migrador lee los archivos `.sql` ordenados desde `migrations/`, registra cada aplicación en `migrations_aplicadas` y omite las ya ejecutadas. La migración `migrations/001_crear_esquema_turnero.sql` crea `usuarios`, `medicos`, `lugares_atencion`, `bloques_disponibilidad` y `turnos`, con claves foráneas, índices y restricciones `CHECK`/`UNIQUE`. No se usa `sequelize.sync({ alter: true })`.

`slot_activo_key` es `VARCHAR(120)`, única y nullable. Para un turno `reservado` vale `<medicoId>_<fecha>_<horaInicio>` con hora normalizada a `HH:mm`; para un turno `cancelado` vale `NULL`. MySQL impide dos reservas activas del mismo slot pero permite conservar el historial y reutilizar el horario. El cliente nunca controla esta clave.

### 4.3. Crear el administrador inicial

No hay un endpoint público para crear administradores. Se genera desde el entorno local o del despliegue:

```bash
node src/scripts/crear-admin.js
```

Con variables explícitas:

```bash
ADMIN_NOMBRE="Administrador" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="Reemplazar123" node src/scripts/crear-admin.js
```

Si el email ya pertenece a un no administrador, el script responde `409` lógico; si ya es administrador, no duplica la cuenta.

---

## 5. Ejecución y documentación

Modo desarrollo con recarga automática:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

| Recurso | URL |
| --- | --- |
| API base | `http://localhost:3000` |
| Swagger UI | `http://localhost:3000/api-docs` |

`/api-docs` es público, sirve HTML y no exige cookie. El documento OpenAPI declara el esquema `cookieAuth` (`apiKey` sobre cookie, con el nombre tomado de `COOKIE_NAME`) y marca con él todas las operaciones protegidas.

---

## 6. Contrato REST

Todas las respuestas son JSON con `{ "success": true, "data": ... }` o `{ "success": false, "error": { "code": "...", "message": "..." } }`. La única excepción es `GET /api-docs`, que devuelve HTML.

| Método | Ruta | Acceso | Códigos principales |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | `201`, `400`, `409`, `429`, `500` |
| `POST` | `/api/auth/login` | Público | `200`, `400`, `401`, `429`, `500` |
| `POST` | `/api/auth/logout` | Público | `200`, `429`, `500` |
| `POST` | `/api/usuarios/medicos` | Admin | `201`, `400`, `401`, `403`, `409`, `429`, `500` |
| `POST` | `/api/lugares` | Médico / Admin | `201`, `400`, `401`, `403`, `404`, `429`, `500` |
| `GET` | `/api/lugares` | Médico / Admin | `200`, `400`, `401`, `403`, `429`, `500` |
| `GET` | `/api/lugares/:id` | Médico dueño / Admin | `200`, `401`, `403`, `404`, `429`, `500` |
| `PATCH` | `/api/lugares/:id` | Médico dueño / Admin | `200`, `400`, `401`, `403`, `404`, `429`, `500` |
| `POST` | `/api/disponibilidad/bloques` | Médico / Admin | `201`, `400`, `401`, `403`, `404`, `409`, `429`, `500` |
| `GET` | `/api/disponibilidad/medicos/:medicoId` | Autenticado | `200`, `400`, `401`, `403`, `404`, `429`, `500` |
| `PATCH` | `/api/disponibilidad/bloques/:bloqueId` | Médico dueño / Admin | `200`, `400`, `401`, `403`, `404`, `409`, `429`, `500` |
| `DELETE` | `/api/disponibilidad/bloques/:bloqueId` | Médico dueño / Admin | `200`, `401`, `403`, `404`, `409`, `429`, `500` |
| `POST` | `/api/turnos` | Paciente | `201`, `400`, `401`, `403`, `404`, `409`, `429`, `500` |
| `GET` | `/api/turnos` | Paciente / Médico / Admin | `200`, `400`, `401`, `403`, `429`, `500` |
| `GET` | `/api/turnos/:id` | Propietario / Asignado / Admin | `200`, `401`, `403`, `404`, `429`, `500` |
| `PATCH` | `/api/turnos/:id/cancelar` | Propietario / Asignado / Admin | `200`, `401`, `403`, `404`, `409`, `429`, `500` |
| `GET` | `/api-docs` | Público | `200`, `429`, `500` |

Filtros y paginación:

- `GET /api/lugares`: `page`, `limit`.
- `GET /api/disponibilidad/medicos/:medicoId`: `fecha` opcional en `YYYY-MM-DD`.
- `GET /api/turnos`: `fecha`, `estado`, `medicoId`, `pacienteId`, `page`, `limit`.
- Valores por defecto: `page=1`, `limit=20`; `limit` máximo `100`.
- Orden estable por `fecha`, `horaInicio` e `id` en turnos, y por `id` en lugares.
- Ningún filtro amplía el alcance del rol: un paciente o médico que intente consultar otro paciente o médico recibe `403`.

---

## 7. Ejemplos de uso

Los IDs son ilustrativos: reemplazarlos por los devueltos por la API.

### 7.1. Registro, sesión y cierre

```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Paciente Ejemplo","email":"paciente@example.com","password":"Clave123"}'

curl -i -c paciente-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@example.com","password":"Clave123"}'

curl -i -b paciente-cookies.txt -X POST http://localhost:3000/api/auth/logout
```

### 7.2. Alta de médico y de lugar

```bash
curl -i -c admin-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Reemplazar123"}'

curl -i -b admin-cookies.txt -X POST http://localhost:3000/api/usuarios/medicos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Dra. Ana Pérez","email":"ana@example.com","password":"Clave123","especialidad":"Clínica General","matricula":"MAT-1234"}'

curl -i -c medico-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Clave123"}'

curl -i -b medico-cookies.txt -X POST http://localhost:3000/api/lugares \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Consultorio Centro","direccion":"Calle 1"}'
```

### 7.3. Bloques y disponibilidad

```bash
curl -i -b medico-cookies.txt -X POST http://localhost:3000/api/disponibilidad/bloques \
  -H "Content-Type: application/json" \
  -d '{"lugarId":8,"diaSemana":1,"horaInicio":"09:00","horaFin":"10:00","duracionMinutos":30}'

curl -i -b paciente-cookies.txt "http://localhost:3000/api/disponibilidad/medicos/4?fecha=2030-06-03"
```

`diaSemana` sigue la convención `0 = domingo` ... `6 = sábado`.

### 7.4. Reserva, consulta y cancelación

```bash
curl -i -b paciente-cookies.txt -X POST http://localhost:3000/api/turnos \
  -H "Content-Type: application/json" \
  -d '{"medicoId":4,"bloqueId":15,"lugarId":8,"fecha":"2030-06-03","horaInicio":"09:30"}'

curl -i -b paciente-cookies.txt "http://localhost:3000/api/turnos?fecha=2030-06-03&estado=reservado&page=1&limit=20"

curl -i -b medico-cookies.txt "http://localhost:3000/api/turnos?fecha=2030-06-03&page=1&limit=20"

curl -i -b admin-cookies.txt "http://localhost:3000/api/turnos?medicoId=4&estado=cancelado&page=1&limit=20"

curl -i -b paciente-cookies.txt "http://localhost:3000/api/turnos/101"

curl -i -b paciente-cookies.txt -X PATCH http://localhost:3000/api/turnos/101/cancelar
```

Después de la cancelación, `slot_activo_key` queda en `NULL`, la fila histórica se conserva y el horario vuelve a estar disponible. Si dos pacientes reservan el mismo slot en simultáneo, una respuesta es `201` y la otra `409 Conflict`.

---

## 8. Reglas de negocio

### 8.1. Autenticación y roles

| Rol | Permisos principales |
| --- | --- |
| `paciente` | Registro público, consulta de disponibilidad, reserva propia, listado y cancelación de sus turnos. |
| `medico` | Gestión de sus lugares y bloques, consulta de disponibilidad, agenda propia y cancelación de turnos asignados. |
| `admin` | Alta de médicos, gestión de cualquier lugar/bloque, listado y cancelación de cualquier turno. |

El registro público nunca crea usuarios con rol `medico` ni `admin`. Identidad, rol y propiedad se obtienen del JWT validado; `id`, `rol`, `medicoId` o `pacienteId` enviados por el cliente no sustituyen la sesión.

### 8.2. Lugares y bloques

- Un médico solo administra sus propios lugares y bloques; el admin puede administrar los de cualquier médico.
- La hora de fin debe ser posterior a la de inicio.
- `duracionMinutos` debe ser positiva y dividir exactamente la duración total del bloque.
- No se permiten solapamientos para el mismo médico y día, aunque los bloques estén en lugares distintos.
- Los bloques son reglas semanales recurrentes; los slots se calculan dinámicamente y no se almacenan por adelantado.
- No se edita ni desactiva un bloque que tenga turnos `reservado` asociados: la operación responde `409`.
- La desactivación es lógica (`activo = false`) para conservar la integridad histórica.
- Editar un lugar no modifica los datos históricos de turnos ya reservados.

### 8.3. Fechas y horarios

- Zona horaria de referencia: `America/Argentina/Buenos_Aires`; el servidor no depende de su zona local.
- Fechas: `YYYY-MM-DD`. Horarios: `HH:mm`.
- No se permiten reservas en fechas pasadas ni en slots que ya comenzaron.
- La fecha concreta se almacena en `turnos.fecha`; el `diaSemana` del bloque debe coincidir con esa fecha.
- Cada turno conserva su `fecha`, `horaInicio`, `horaFin` y `lugarId` originales aunque el bloque cambie después.

### 8.4. Concurrencia, cancelación e historial

- La reserva ejecuta una transacción de Sequelize y valida disponibilidad dentro de esa transacción.
- `slotActivoKey` se genera exclusivamente en el backend con `<medicoId>_<fecha>_<horaInicio>`.
- La restricción `UNIQUE` real en MySQL es la garantía definitiva contra dobles reservas; un conflicto se traduce a `409`.
- La cancelación también es atómica: cambia `estado` a `cancelado`, fija `slotActivoKey` en `NULL` y registra `canceladoPorRol` y `canceladoEn`.
- Solo se cancelan turnos en estado `reservado`; un turno ya cancelado responde `409`.
- Pueden cancelar el paciente propietario, el médico asignado o un administrador.
- Las claves foráneas usan `ON DELETE RESTRICT` y `ON UPDATE CASCADE`.

### 8.5. Paginación y errores

- `page` y `limit` se validan y normalizan; `limit` máximo `100`.
- El middleware de ruta inexistente devuelve `404` JSON.
- El middleware global `(err, req, res, next)` normaliza `400`, `401`, `403`, `404`, `409`, `429` y `500`.
- En producción no se exponen stack traces ni información sensible.

---

## 9. Arquitectura por capas

| Directorio | Responsabilidad |
| --- | --- |
| `src/config/` | Variables de entorno, conexión Sequelize, logger y configuración de Swagger. |
| `src/middlewares/` | Autenticación JWT, roles, propiedad, límite de solicitudes, 404 y error global. |
| `src/routes/` | Declaración de endpoints y composición de middlewares; sin lógica de negocio. |
| `src/controllers/` | Adaptación HTTP: leen `req`, llaman servicios y devuelven respuestas. |
| `src/services/` | Lógica de negocio, validaciones y transacciones Sequelize. |
| `src/models/` | Modelos, asociaciones y mapeo a las tablas MySQL. |
| `src/docs/` | Documento OpenAPI único con paths, esquemas, seguridad y respuestas. |
| `src/utils/` | Validaciones y serialización reutilizables. |
| `src/scripts/` | Migraciones administradas y creación del administrador inicial. |
| `migrations/` | DDL versionado con índices y restricciones de integridad. |
| `openspec/` | Propuestas, specs, diseños y tareas del flujo SDD. |

Decisiones y justificación oral:

- **ESM estricto:** `import`/`export`, sin `require` ni `module.exports`.
- **Servicios centralizados:** los controllers no contienen reglas de negocio complejas.
- **Cookie HTTPOnly:** reduce exposición ante XSS; `SameSite` y `Secure` mitigan el riesgo CSRF del esquema basado en cookies.
- **Pino:** logs estructurados sin contraseñas, hashes, JWT ni cookies completas.
- **Migraciones reales:** la evolución del esquema queda versionada y es reproducible.
- **Transacción + `UNIQUE`:** la aplicación valida y la base de datos garantiza la integridad final.
- **Swagger centralizado:** `src/docs/openapi.js` es la fuente única del contrato; `src/config/swagger.js` expone la configuración de UI.

---

## 10. Spec-Driven Development

El proyecto usa OpenSpec con el workflow local `spec-driven`:

1. `proposal.md` explica el problema y el alcance.
2. `specs/**/spec.md` define requisitos y escenarios observables.
3. `design.md` registra decisiones, alternativas descartadas y riesgos.
4. `tasks.md` guía la implementación con checkboxes verificables.
5. `openspec validate <change> --strict` valida los artefactos.
6. Tras implementar y verificar, el change se sincroniza y archiva.

Reglas operativas:

- No implementar cambios que contradigan las specs aprobadas.
- Si aparece una ambigüedad, proponer la corrección antes de modificar reglas funcionales.
- `AGENTS.md` concentra las convenciones de ingeniería, seguridad y arquitectura.

---

## 11. Verificación recomendada

Antes de dar por terminado un módulo:

```bash
node --check src/app.js
node --check src/config/swagger.js
node --check src/docs/openapi.js
npm run migrate
```

Comprobaciones funcionales mínimas:

- Registro correcto y email duplicado.
- Login, cookie HTTPOnly, logout y token inválido.
- Paciente sin acceso a recursos de admin; médico sin acceso a bloques ajenos.
- Bloques válidos, duración no divisible, fin anterior al inicio y solapamientos.
- Reserva correcta, duplicada y concurrente; reserva después de cancelación.
- Cancelación propia, ajena, ya cancelada y liberación del slot.
- `/api-docs` sin cookie, `/api/turnos` sin cookie y ruta inexistente.

---

## 12. Objetivo académico

Construir una API REST correcta, segura, consistente y mantenible donde cada decisión técnica pueda explicarse en una defensa oral sin asistencia. El sistema resuelve superposición de horarios, doble reserva, control de permisos, administración de lugares y conservación del historial de turnos cancelados.

**Proyecto académico — Diplomatura en Programación Backend — UNTREF, Sede Guaminí.**
