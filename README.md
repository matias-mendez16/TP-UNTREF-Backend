# Turnero Médico — API REST

**Diplomatura en Programación Backend · UNTREF - Sede Guaminí**

Sistema backend RESTful desarrollado con **Spec-Driven Development (SDD)** utilizando **OpenSpec** y **OpenCode**, destinado a la gestión integral de turnos médicos, disponibilidad horaria por lugar de atención, control de roles y reservas concurrentes seguras.

---

## 1. Stack Tecnológico

* **Runtime y Lenguaje:** Node.js con JavaScript en modo ECMAScript Modules (ESM) (`"type": "module"`).
* **Framework HTTP:** Express.
* **Base de Datos y ORM:** MySQL con driver `mysql2` y ORM `Sequelize`.
* **Autenticación y Seguridad:**
  * `bcryptjs` para el hash de contraseñas.
  * `jsonwebtoken` (JWT) transportado mediante cookie `HTTPOnly`.
  * `dotenv` para la gestión de variables de entorno.
* **Documentación:** Swagger UI (`swagger-ui-express` / `swagger-jsdoc`).

---

## 2. Requisitos Previos

Antes de comenzar, es necesario contar con:

* **Node.js** v18 o superior.
* **MySQL** v8 o superior en ejecución.
* **npm** (incluido con Node.js).
* **Git** para clonar el repositorio.

---

## 3. Instalación y Puesta en Marcha

### 3.1. Clonar el repositorio e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd turnero-medico
npm install
```

### 3.2. Configurar las variables de entorno

Copiar la plantilla y completar los valores del entorno local:

```bash
cp .env.example .env
```

Editar `.env` con las credenciales correspondientes. Las variables obligatorias son:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=turnero_medico
DB_USER=root
DB_PASSWORD=

JWT_SECRET=reemplaza_por_una_clave_secreta_segura
JWT_EXPIRES_IN=1h

COOKIE_NAME=token
COOKIE_SAME_SITE=lax
COOKIE_MAX_AGE_MS=3600000
COOKIE_SECURE=false
COOKIE_PATH=/

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=20
```

El nombre de la base se configura con `DB_DATABASE` (no `DB_NAME`). No compartir ni subir `.env` al repositorio.

`JWT_SECRET` y `JWT_EXPIRES_IN` controlan la firma y la expiración del token; el payload incluye `id`, `rol` y `medicoId`, resuelto siempre en el backend. `COOKIE_NAME`, `COOKIE_SAME_SITE`, `COOKIE_MAX_AGE_MS`, `COOKIE_SECURE` y `COOKIE_PATH` configuran la cookie de sesión. En producción se usa `COOKIE_SECURE=true`, que puede forzarse también en desarrollo. `AUTH_RATE_LIMIT_MAX` debe ser menor que `RATE_LIMIT_MAX` y aplica solo a `/api/auth`.

### 3.3. Crear la base de datos en MySQL 8

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS turnero_medico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

La base debe usar MySQL 8 o superior para soportar las restricciones `CHECK` y el índice `UNIQUE` declarados en `migrations/001_crear_esquema_turnero.sql`.

### 3.4. Ejecutar las migraciones

```bash
npm run migrate
```

El migrador ESM lee los archivos `.sql` ordenados desde `migrations/`, registra cada aplicación en la tabla `migrations_aplicadas` y omite las ya ejecutadas. La primera ejecución crea `usuarios`, `medicos`, `lugares_atencion`, `bloques_disponibilidad`, `turnos`, sus índices, claves foráneas y restricciones. Una segunda ejecución no duplica estructura.

`slotActivoKey` es una columna `VARCHAR(120)`, única y nullable. Para un turno `reservado` vale `<medicoId>_<fecha>_<horaInicio>` (por ejemplo, `7_2026-12-01_09:30`, con `horaInicio` normalizada a `HH:mm`); para un turno `cancelado` vale `NULL`. Así MySQL impide dos reservas activas del mismo slot pero permite conservar el historial y reutilizar el horario después de una cancelación. El backend genera este valor; el cliente nunca lo controla.

### 3.5. Crear el administrador inicial

No existe un endpoint público para crear administradores. El primer usuario con rol `admin` se genera con una operación controlada desde el entorno local o del despliegue:

```bash
ADMIN_NOMBRE="Administrador" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="Clave123" node src/scripts/crear-admin.js
```

Las variables `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` son opcionales para el servidor y solo las usa este script. La contraseña debe cumplir la política de 8 a 72 caracteres, con al menos una letra y un dígito. Si el email ya existe con otro rol, el script rechaza la operación; si ya es administrador, no duplica la cuenta.

### 3.6. Ejecutar el servidor

Modo desarrollo (con recarga automática):

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

Una vez iniciado:

```text
API REST: http://localhost:3000
Documentación Swagger: http://localhost:3000/api-docs
```
## 4. Estructura del Proyecto

```text
turnero-medico/
│
├── AGENTS.md                 # Reglas y convenciones para OpenCode / SDD
│
├── openspec/                 # Especificaciones y propuestas de cambio SDD
│
├── src/
│   │
│   ├── config/               # Conexión Sequelize, variables de entorno y Swagger
│   │
│   ├── controllers/          # Controladores HTTP (req/res)
│   │
│   ├── docs/                 # Definiciones OpenAPI / Swagger
│   │
│   ├── middlewares/          # Auth JWT, roles, 404 y error global
│   │
│   ├── models/               # Modelos Sequelize y asociaciones MySQL
│   │
│   ├── routes/               # Definición de rutas REST (/api/...)
│   │
│   ├── services/             # Lógica de negocio y transacciones Sequelize
│   │
│   ├── app.js                # Configuración de Express y middlewares
│   │
│   └── server.js             # Punto de entrada y conexión a MySQL
│
├── .env.example              # Plantilla de variables de entorno
│
├── package.json              # Dependencias y configuración ESM
│
└── README.md                 # Documentación principal
```

## 5. Modelo de Datos y Reglas de Negocio
### 5.1. Entidades principales

Usuario

Representa a las personas que utilizan el sistema.

id
nombre
email (único)
passwordHash
rol (paciente, medico, admin)
activo

Medico

Contiene la información profesional del médico.

id
usuarioId (FK única)
especialidad
matricula (única)

LugarAtencion

Representa los distintos lugares donde un médico brinda atención.

id
medicoId (FK)
nombre
direccion

BloqueDisponibilidad

Define los horarios de atención disponibles de cada médico en un lugar determinado.

id
medicoId (FK)
lugarId (FK)
diaSemana
horaInicio
horaFin
duracionMinutos
activo

Turno

Representa una reserva realizada por un paciente.

id
medicoId (FK)
pacienteId (FK)
bloqueId (FK)
lugarId (FK)
fecha
horaInicio
horaFin
estado (reservado | cancelado)
canceladoPorRol
canceladoEn
slotActivoKey
### 5.2. Reglas de negocio críticas
Roles y altas de usuarios
Los pacientes pueden registrarse por su cuenta mediante POST /api/auth/register.
Los médicos son dados de alta exclusivamente por un administrador mediante POST /api/usuarios/medicos.
Los permisos de acceso se controlan mediante middleware de autenticación y autorización por roles.
Validación de bloques horarios
La hora de finalización debe ser posterior a la hora de inicio.
La duración de los turnos debe dividir exactamente el bloque horario disponible.
No se permiten solapamientos horarios para un mismo médico, incluso cuando corresponden a distintos lugares de atención.
Los bloques son reglas semanales recurrentes: diaSemana va de 0 (domingo) a 6 (sábado) y la fecha concreta se entrega en la consulta de disponibilidad o en la reserva.
Los slots no se almacenan por adelantado: se calculan al consultar disponibilidad con horaInicio, horaFin y duracionMinutos del bloque.
Sin el parámetro fecha, la consulta devuelve lugares y bloques activos; con fecha, además filtra por diaSemana e incluye cada slot con disponible en true o false.
No se devuelven como reservables las fechas pasadas ni los horarios que ya comenzaron.
Fechas y horarios
Las fechas se reciben en formato YYYY-MM-DD y los horarios en formato HH:mm.
La zona horaria de referencia es America/Argentina/Buenos_Aires; el servidor no depende de la zona horaria local del sistema.
Propiedad de lugares y bloques
Un médico solo puede crear, consultar y editar lugares y bloques de su propio perfil.
Un administrador puede operar sobre los lugares y bloques de cualquier médico; el médicoId enviado en el body nunca cambia la identidad obtenida del JWT.
Bloqueo ante turnos activos

No se permite editar ni eliminar un bloque de disponibilidad cuando existen turnos en estado reservado asociados a él.

Concurrencia en las reservas

La reserva de turnos se ejecuta dentro de una transacción de Sequelize y cuenta con una restricción única en MySQL sobre slotActivoKey.

Esta combinación garantiza que dos solicitudes simultáneas no puedan reservar el mismo horario.

Cuando se produce un conflicto de reserva, la API responde con:

409 Conflict

Cancelación y reutilización de horarios

Solo pueden cancelar un turno:

El paciente propietario de la reserva.
El médico asignado.
Un administrador.

Al cancelar un turno:

El estado cambia a cancelado.
Se registra quién realizó la cancelación y cuándo.
Se libera slotActivoKey, asignándole NULL.
Se conserva el registro histórico.
El horario queda disponible nuevamente para futuras reservas.
## 6. Endpoints Principales
### 6.1. Autenticación
Método	Endpoint	Acceso	Descripción
POST	/api/auth/register	Público	Registro de usuario con rol paciente.
POST	/api/auth/login	Público	Inicio de sesión y emisión de JWT en cookie HTTPOnly.
POST	/api/auth/logout	Público	Cierre de sesión y limpieza de cookie con atributos coincidentes.
### 6.2. Gestión de usuarios
Método	Endpoint	Acceso	Descripción
POST	/api/usuarios/medicos	Admin	Alta de médico y creación de su perfil profesional.
### 6.3. Disponibilidad horaria
Método	Endpoint	Acceso	Descripción
POST	/api/disponibilidad/bloques	Médico / Admin	Alta de regla semanal con lugar existente.
GET	/api/disponibilidad/medicos/:medicoId	Autenticado	Consulta lugares, bloques activos y slots calculados; acepta ?fecha=YYYY-MM-DD.
PATCH	/api/disponibilidad/bloques/:bloqueId	Médico dueño / Admin	Edición de bloque, si no tiene turnos reservados.
DELETE	/api/disponibilidad/bloques/:bloqueId	Médico dueño / Admin	Desactivación lógica del bloque, si no tiene turnos reservados.
### 6.4. Lugares de atención
Método	Endpoint	Acceso	Descripción
POST	/api/lugares	Médico / Admin	Alta de lugar; el médico usa su propio perfil y el admin puede indicar medicoId.
GET	/api/lugares	Médico / Admin	Listado paginado; acepta ?page=1&limit=20 con limit máximo 100.
GET	/api/lugares/:id	Dueño / Admin	Detalle del lugar.
PATCH	/api/lugares/:id	Dueño / Admin	Edición de nombre y direccion sin alterar turnos históricos.
### 6.5. Gestión de turnos
Método	Endpoint	Acceso	Códigos	Descripción
POST	/api/turnos	Paciente	201 / 400 / 401 / 403 / 404 / 409	Reserva transaccional; `slotActivoKey` se genera en el backend y el índice único responde 409 ante doble reserva.
GET	/api/turnos	Paciente / Médico / Admin	200 / 400 / 401 / 403	Listado paginado con filtros mediante req.query y alcance fijo por rol.
GET	/api/turnos/:id	Paciente propietario / Médico asignado / Admin	200 / 401 / 403 / 404	Detalle del turno mediante req.params.id; un turno ajeno responde 403 sin datos.
PATCH	/api/turnos/:id/cancelar	Paciente propietario / Médico asignado / Admin	200 / 401 / 403 / 404 / 409	Cancelación lógica, liberación inmediata del slot y conservación del historial.

Los filtros disponibles para `GET /api/turnos` son `fecha` (`YYYY-MM-DD`), `estado` (`reservado` o `cancelado`), `medicoId`, `pacienteId`, `page` y `limit`. Los valores por defecto son `page=1` y `limit=20`, con `limit` máximo 100. El orden es estable por `fecha`, `horaInicio` e `id`.

El alcance se aplica antes que los filtros: el paciente ve solo sus turnos, el médico solo los asignados a su perfil y el admin ve todos. Un filtro que intente ampliar ese alcance se rechaza con 403.
### 6.6. Documentación
Método	Endpoint	Acceso	Descripción
GET	/api-docs	Público / Desarrollo	Documentación interactiva de la API mediante Swagger UI.

### 6.7. Ejemplos de uso

Registro de paciente:

```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Paciente Ejemplo","email":"paciente@example.com","password":"Clave123"}'
```

Inicio de sesión y guardado de la cookie HTTPOnly:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@example.com","password":"Clave123"}'
```

Cierre de sesión:

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

Alta de médico con un administrador previamente autenticado:

```bash
curl -i -b admin-cookies.txt -X POST http://localhost:3000/api/usuarios/medicos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Dra. Ana Pérez","email":"ana@example.com","password":"Clave123","especialidad":"Clínica General","matricula":"MAT-1234"}'
```

Inicio de sesión del médico, necesario para los ejemplos siguientes de lugares y disponibilidad:

```bash
curl -i -c medico-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Clave123"}'
```

Alta de lugar con un médico autenticado:

```bash
curl -i -b medico-cookies.txt -X POST http://localhost:3000/api/lugares \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Consultorio Centro","direccion":"Calle 1"}'
```

Alta de bloque semanal con el lugar recién creado (`diaSemana` 1 equivale a lunes):

```bash
curl -i -b medico-cookies.txt -X POST http://localhost:3000/api/disponibilidad/bloques \
  -H "Content-Type: application/json" \
  -d '{"lugarId":8,"diaSemana":1,"horaInicio":"09:00","horaFin":"10:00","duracionMinutos":30}'
```

Consulta de disponibilidad para una fecha concreta:

```bash
curl -i -b medico-cookies.txt "http://localhost:3000/api/disponibilidad/medicos/4?fecha=2030-06-03"
```

Reserva de un turno con la cookie del paciente. El `pacienteId` se toma del JWT, por lo que no debe enviarse en el body:

```bash
curl -i -c paciente-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@example.com","password":"Clave123"}'

curl -i -b paciente-cookies.txt -X POST http://localhost:3000/api/turnos \
  -H "Content-Type: application/json" \
  -d '{"medicoId":4,"bloqueId":15,"lugarId":8,"fecha":"2030-06-03","horaInicio":"09:00"}'
```

Consulta de turnos por rol, con filtros y paginación:

```bash
curl -i -b paciente-cookies.txt "http://localhost:3000/api/turnos?fecha=2030-06-03&estado=reservado&page=1&limit=20"

curl -i -b medico-cookies.txt "http://localhost:3000/api/turnos?fecha=2030-06-03&page=1&limit=20"

curl -i -b admin-cookies.txt "http://localhost:3000/api/turnos?medicoId=4&estado=cancelado&page=1&limit=20"
```

Detalle y cancelación del turno:

```bash
curl -i -b paciente-cookies.txt "http://localhost:3000/api/turnos/101"

curl -i -b paciente-cookies.txt -X PATCH http://localhost:3000/api/turnos/101/cancelar
```

Después de la cancelación, `slotActivoKey` queda en `NULL`, el turno conserva su historial y el mismo horario puede reservarse nuevamente. Si dos pacientes reservan el mismo slot en simultáneo, una respuesta es `201` y la otra `409 Conflict`.

Las respuestas de autenticación no incluyen `passwordHash`, tokens ni secretos. El JWT viaja solo en la cookie; el cliente no debe enviar `id`, `rol` ni `medicoId` para identificarse.

## 7. Arquitectura y Decisiones Técnicas
### 7.1. Separación por capas

El proyecto utiliza una arquitectura organizada en capas para separar responsabilidades:

Routes: definen los endpoints y conectan las solicitudes con los controladores.
Controllers: reciben las solicitudes HTTP, procesan los parámetros y devuelven las respuestas.
Services: contienen la lógica de negocio y las operaciones transaccionales.
Models: representan las entidades y relaciones de la base de datos.
Middlewares: implementan autenticación, autorización y manejo de errores.
Config: centraliza la configuración de la aplicación, conexión a MySQL y documentación.

Esta separación permite mantener un código organizado, reutilizable y escalable.

### 7.2. Uso de ECMAScript Modules (ESM)

Se utiliza el sistema de módulos nativo de JavaScript mediante import y export, configurando el proyecto con:

```json
{
  "type": "module"
}
```


Ventajas:

Es el estándar moderno de módulos de JavaScript.
Facilita el análisis estático del código.
Mejora la organización y reutilización de componentes.
Permite alinearse con el ecosistema actual de Node.js.
### 7.3. Autenticación mediante JWT y cookies HTTPOnly

La autenticación utiliza JSON Web Tokens (JWT) almacenados en cookies con `HttpOnly`, `SameSite`, `Path`, `Max-Age` y `Secure` según el entorno. El middleware valida firma y expiración en cada solicitud protegida y expone la identidad resultante en `req.user = { id, rol, medicoId }`.

El payload se genera solo en el backend con `id`, `rol` y `medicoId`; este último se resuelve desde el perfil `Medico` cuando corresponde. Los datos de identidad enviados en body, query o params nunca sustituyen a la sesión.

A diferencia de localStorage, una cookie `HttpOnly` no puede ser leída directamente por JavaScript del navegador, lo que reduce el riesgo ante XSS. `SameSite=Lax` o `Strict` y `Secure` en producción son la mitigación CSRF adoptada para este esquema de autenticación basado en cookies.

`POST /api/auth/logout` elimina la cookie con los mismos atributos usados al crearla. No revoca criptográficamente un JWT emitido previamente: si la cookie copiada se reutiliza antes de su expiración, el token seguiría siendo válido. Por eso la caducidad se mantiene acotada con `JWT_EXPIRES_IN` y `COOKIE_MAX_AGE_MS`.

### 7.4. Prevención de reservas duplicadas

La prevención de doble reserva se implementa mediante dos mecanismos complementarios:

Transacciones de Sequelize: agrupan las operaciones de reserva para garantizar su ejecución atómica.
Restricción UNIQUE en MySQL: impide que dos registros activos utilicen la misma clave slotActivoKey.

La clave representa la combinación del médico, la fecha y el horario de inicio de un turno activo.

De esta manera, aunque dos pacientes intenten reservar simultáneamente el mismo horario, la base de datos garantiza la integridad de la información.

El sistema responde con 409 Conflict cuando detecta que el horario ya fue reservado.

7.5. Manejo centralizado de errores

La aplicación implementa una cadena de middlewares al final de app.js:

Middleware de rutas no encontradas (404).
Middleware global de manejo de errores.

El middleware global utiliza la firma de cuatro parámetros de Express:

```javascript
(err, req, res, next)
```


Su responsabilidad es traducir los distintos errores de la aplicación a respuestas JSON uniformes.

Entre los casos contemplados se encuentran:

Errores de validación.
Errores de autenticación JWT (401 Unauthorized).
Errores de permisos (403 Forbidden).
Registros duplicados o conflictos de integridad SQL (409 Conflict).
Recursos inexistentes (404 Not Found).
Errores internos del servidor (500 Internal Server Error).
## 8. Spec-Driven Development (SDD)

El desarrollo del proyecto utiliza el enfoque Spec-Driven Development (SDD), apoyándose en las herramientas OpenSpec y OpenCode.

Este enfoque propone definir las especificaciones y reglas del sistema antes de implementar los cambios en el código.

Herramientas utilizadas
OpenSpec: permite documentar requisitos, especificaciones y propuestas de cambio.
OpenCode: se utiliza como entorno de asistencia para el desarrollo basado en las especificaciones.

La estructura openspec/ contiene la documentación asociada a los cambios y funcionalidades del proyecto.

El archivo AGENTS.md establece las reglas y convenciones que deben respetarse durante el desarrollo.

## 9. Códigos HTTP Utilizados
Código	Significado	Aplicación
200	OK	Operación realizada correctamente.
201	Created	Recurso creado correctamente.
204	No Content	Operación realizada sin contenido de respuesta.
400	Bad Request	Datos de entrada inválidos.
401	Unauthorized	Usuario no autenticado.
403	Forbidden	Usuario sin permisos suficientes.
404	Not Found	Recurso o ruta inexistente.
409	Conflict	Conflicto de reserva o registro duplicado.
500	Internal Server Error	Error interno del servidor.
## 10. Defensa del Proyecto — Accountability UNTREF
¿Por qué se eligió Node.js con Express?

Node.js permite desarrollar aplicaciones backend utilizando JavaScript, mientras que Express facilita la construcción de APIs REST mediante rutas, controladores y middlewares.

¿Por qué se utiliza Sequelize?

Sequelize permite trabajar con bases de datos relacionales mediante un ORM, facilitando la definición de modelos, asociaciones, validaciones y transacciones.

¿Por qué se eligió MySQL?

MySQL es un sistema de gestión de bases de datos relacional que permite garantizar la integridad de los datos mediante claves primarias, claves foráneas, índices y restricciones de unicidad.

¿Por qué se utiliza ESM?

Porque es el sistema estándar moderno de módulos de JavaScript y permite organizar el código mediante import y export.

¿Por qué JWT en cookies HTTPOnly?

Porque evita que JavaScript del navegador pueda acceder directamente al token almacenado en la cookie, reduciendo la exposición ante ataques XSS.

¿Cómo se evita la doble reserva simultánea?

Mediante una doble protección:

Una transacción de Sequelize para agrupar las operaciones de reserva.
Una restricción UNIQUE en MySQL sobre slotActivoKey.

La base de datos actúa como última garantía de integridad, evitando que dos pacientes puedan reservar el mismo horario simultáneamente.

¿Por qué se conserva el registro de un turno cancelado?

Porque permite mantener un historial de las operaciones realizadas.

En lugar de eliminar el registro, se modifica su estado a cancelado y se libera la clave de ocupación del horario.

Esto permite reutilizar el horario sin perder información histórica.

¿Cómo se controlan los permisos?

Mediante middlewares de autenticación y autorización por roles.

Primero se verifica la identidad del usuario mediante JWT y luego se comprueba si tiene permisos suficientes para ejecutar la operación solicitada.

¿Cómo se manejan los errores?

Mediante un middleware global de Express que centraliza las excepciones y devuelve respuestas JSON consistentes con los códigos HTTP correspondientes.

## 11. Objetivo del Proyecto

El objetivo es desarrollar una API REST que permita administrar turnos médicos de manera segura, organizada y confiable.

El sistema busca resolver problemas habituales de los turneros tradicionales:

Superposición de horarios de atención.
Doble reserva de un mismo turno.
Falta de control de permisos según el tipo de usuario.
Dificultad para administrar distintos lugares de atención.
Pérdida de información histórica al cancelar reservas.

La implementación combina una arquitectura backend por capas, persistencia relacional, autenticación segura, documentación de endpoints y mecanismos de concurrencia para garantizar la integridad de las reservas.

Proyecto académico — Diplomatura en Programación Backend

Universidad Nacional de Tres de Febrero (UNTREF) — Sede Guaminí

