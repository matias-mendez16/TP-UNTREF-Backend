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

### 3.5. Ejecutar el servidor

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
POST	/api/auth/logout	Autenticado	Cierre de sesión y limpieza de cookie.
### 6.2. Gestión de usuarios
Método	Endpoint	Acceso	Descripción
POST	/api/usuarios/medicos	Admin	Alta de médico y creación de su perfil profesional.
### 6.3. Disponibilidad horaria
Método	Endpoint	Acceso	Descripción
POST	/api/disponibilidad/bloques	Médico / Admin	Alta de bloque horario y lugar de atención.
GET	/api/disponibilidad/medicos/:medicoId	Autenticado	Consulta lugares, bloques y horarios disponibles.
PATCH	/api/disponibilidad/bloques/:bloqueId	Médico dueño / Admin	Edición de bloque, si no tiene turnos reservados.
DELETE	/api/disponibilidad/bloques/:bloqueId	Médico dueño / Admin	Eliminación de bloque, si no tiene turnos reservados.
### 6.4. Gestión de turnos
Método	Endpoint	Acceso	Descripción
POST	/api/turnos	Paciente	Reserva de turno mediante transacción e índice único.
GET	/api/turnos	Autenticado	Listado de turnos con filtros mediante req.query.
GET	/api/turnos/:id	Dueño / Admin	Consulta del detalle de un turno mediante req.params.id.
PATCH	/api/turnos/:id/cancelar	Dueño / Admin	Cancelación del turno y liberación inmediata del horario.

Los filtros disponibles para consultar turnos incluyen:

fecha
estado
medicoId
### 6.5. Documentación
Método	Endpoint	Acceso	Descripción
GET	/api-docs	Público / Desarrollo	Documentación interactiva de la API mediante Swagger UI.
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

La autenticación utiliza JSON Web Tokens (JWT) almacenados en cookies con la propiedad HTTPOnly.

A diferencia de localStorage, estas cookies no pueden ser leídas directamente mediante JavaScript ejecutado en el navegador, lo que reduce el riesgo de robo del token ante ataques XSS.

Además, se deben configurar adecuadamente las propiedades Secure y SameSite según el entorno de ejecución.

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

