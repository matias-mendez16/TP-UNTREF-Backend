
# AGENTS.md — Turnero Médico (UNTREF · Sede Guaminí)

Este documento es la fuente principal de instrucciones para cualquier agente que trabaje en el proyecto. Define las reglas de ingeniería, arquitectura, stack tecnológico, seguridad, reglas de negocio y flujo de desarrollo.

Toda implementación debe respetar esta especificación y ser defendible en una evaluación oral sin asistencia.

## 1. Reglas generales de ingeniería

- Idioma: español claro y técnico en documentación, mensajes de error y comentarios relevantes.
- ESM estricto: usar siempre import y export. Nunca usar require ni module.exports.
- Mantener "type": "module" en package.json.
- Cero secretos en código: leer toda configuración sensible y operativa desde variables de entorno (process.env).
- Mantener .env fuera del repositorio y .env.example actualizado.
- No devolver contraseñas ni hashes en respuestas JSON.
- Accountability: cada decisión técnica (arquitectura, seguridad, concurrencia, ORM, logging) debe ser simple, trazable y defendible en un examen oral.
- No agregar dependencias o complejidad innecesaria.
- No modificar reglas de negocio sin justificación y aprobación.
- Validar y normalizar todos los datos recibidos mediante req.body, req.params y req.query.
- No confiar en IDs, roles ni datos de propiedad enviados por el cliente.
- El rol y la identidad del usuario deben obtenerse exclusivamente del JWT validado.
- El registro público nunca debe permitir crear usuarios con rol medico o admin.
- Las contraseñas deben tener una política mínima de seguridad.
- Implementar protección CSRF cuando corresponda al uso de autenticación mediante cookies.
- Configurar CORS con orígenes explícitamente permitidos, si el proyecto necesita acceso desde otro frontend.

## 2. Stack y librerías base

- Node.js + Express (ESM).
- MySQL + mysql2 + Sequelize.
- bcryptjs para hash de contraseñas.
- jsonwebtoken para autenticación JWT.
- JWT almacenado en cookie HTTPOnly.
- cookie-parser para lectura de cookies.
- helmet para seguridad HTTP.
- express-rate-limit para limitar solicitudes.
- pino para logging estructurado.
- dotenv para variables de entorno.
- Swagger (swagger-ui-express / swagger-jsdoc).
- README.md con instrucciones completas de instalación y ejecución.

No incorporar librerías adicionales sin justificación técnica.

## 3. Arquitectura y separación por capas

Mantener separación por responsabilidades:

- config
- middlewares
- routes
- controllers
- services
- models
- docs
- utils

Reglas:

- No colocar lógica de negocio compleja en los controllers.
- No ejecutar consultas directamente desde las rutas.
- Centralizar la lógica de negocio en services.
- Utilizar Sequelize para interactuar con MySQL.
- Mantener las asociaciones entre modelos explícitas.
- Evitar duplicar lógica entre módulos.

Asociaciones:

- Usuario tiene un perfil Medico opcional.
- Medico pertenece a Usuario.
- Medico tiene muchos LugaresAtencion.
- Medico tiene muchos BloquesDisponibilidad.
- LugarAtencion pertenece a Medico.
- BloqueDisponibilidad pertenece a Medico y LugarAtencion.
- Turno pertenece a Medico, Usuario (paciente), BloqueDisponibilidad y LugarAtencion.
- Las claves foráneas deben mantener integridad referencial.

## 4. Flujo SDD con OpenSpec + OpenCode

- Trabajar por módulo o cambio en openspec/ antes o junto con la implementación.
- Revisar las especificaciones existentes antes de modificar código.
- Crear propuestas y tareas para funcionalidades nuevas.
- Implementar los cambios siguiendo los criterios de aceptación.
- Actualizar la documentación cuando cambie el comportamiento.
- No implementar funcionalidades que contradigan las especificaciones aprobadas.
- Si existe una contradicción o ambigüedad, identificarla y proponer una solución antes de modificar reglas funcionales.

## 5. Manejo de errores

- Implementar middleware específico para rutas inexistentes (404).
- Implementar middleware global de errores con firma estándar de Express: (err, req, res, next).
- Devolver respuestas JSON consistentes.
- Normalizar errores de validación, autenticación, autorización, conflictos y errores internos.
- No exponer stack traces ni información sensible en producción.


# Turnero Médico — Especificación Técnica

> **Contexto:** Diplomatura en Programación Backend (UNTREF - Sede Guaminí).  
> **Enfoque:** Especificación técnica cerrada con reglas de negocio definidas y *accountability* para defensa oral sin asistencia.

---

## 1. Visión y Stack Tecnológico

### 1.1 Visión del Producto
Construir una **API REST** para un sistema de **turnero médico** que permita a los médicos gestionar sus lugares de atención, bloques horarios y turnos reservados (visualizando día, horario y paciente), y a los pacientes consultar disponibilidades, reservar turnos y cancelar reservas. El sistema garantiza integridad transaccional frente a reservas concurrentes, control de acceso basado en roles y propiedad de recursos, y cumplimiento estricto de las consignas académicas.

### 1.2 Stack Tecnológico
* **Lenguaje y Runtime:** JavaScript moderno sobre **Node.js** con **ECMAScript Modules (`ESM`)** (`"type": "module"` en `package.json`, `import`/`export` en todo el proyecto, sin `require`).
* **Framework HTTP:** Express (o framework REST compatible con Node ESM, middlewares estándar `(err, req, res, next)` y manejo explícito de 404 y error global).
* **Base de Datos:** **MySQL** con driver **`mysql2`** y ORM **`Sequelize`**.
* **Autenticación y Seguridad:**
  * **`bcryptjs`** para hash de contraseñas.
  * **JWT** almacenado en **cookie `HTTPOnly`** (mitigando acceso desde JS/XSS).
  * Variables de entorno (`.env` + `.env.example`) para credenciales de BD, secretos JWT, flags de cookies y puerto.
* **Documentación:** **Swagger** (OpenAPI) documentando todos los endpoints y `README.md` con instrucciones completas de instalación, variables de entorno, migraciones/seed y ejecución.
* **Flujo SDD:** **OpenSpec** + **OpenCode** (especificaciones, propuestas/cambios, tareas y módulos implementados por dominio).

---

## 2. Requisitos Funcionales (RF)

* **RF-01 — Registro de Paciente:** Un visitante puede registrarse con rol `paciente` (contraseña hasheada con `bcryptjs`). Se valida unicidad de email y campos obligatorios.
* **RF-02 — Alta de Médico y Gestión de Usuarios:** Un usuario con rol `admin` puede crear cuentas de `medico` (y administrar usuarios si aplica), asignando sus datos profesionales/perfil médico.
* **RF-03 — Login y Logout con Cookie `HTTPOnly`:** Autenticación mediante credenciales válidas que emite un JWT firmado y lo envía en una cookie `HTTPOnly` (y `SameSite`/`Secure` según entorno). El logout limpia/invalida la cookie.
* **RF-04 — Gestión de Lugares y Bloques de Disponibilidad:** Un `medico` (o `admin` según política definida) crea, consulta, edita o elimina bloques horarios indicando lugar de atención, día/fecha o regla de bloque, hora inicio, hora fin y duración fija de turno en minutos.
* **RF-05 — Bloqueo de Modificación/Borrado con Turnos Activos:** Si un bloque horario o slot asociado ya posee turnos en estado activo (`reservado`), se rechaza la edición o eliminación del bloque con error de conflicto (`409` / `400`).
* **RF-06 — Consulta de Disponibilidad por Médico (`req.params`):** Dado el ID de un médico (`:id` / `:medicoId`), se puede consultar su disponibilidad (lugares, días/bloques y horarios/slots libres).
* **RF-07 — Reserva de Turno Transaccional:** Un `paciente` autenticado reserva un turno para un médico/bloque/horario disponible. La operación corre dentro de una **transacción de Sequelize** y se apoya en una **restricción/índice único en MySQL** para evitar dobles reservas concurrentes.
* **RF-08 — Listado y Filtrado de Turnos (`req.query`):** Endpoint para listar turnos admitiendo parámetros `req.query` (ej. `fecha`, `estado`, `medicoId`, `pacienteId`). Cada rol ve lo que le corresponde según permisos/propiedad.
* **RF-09 — Visualización de Agenda del Médico:** El `medico` ve sus turnos reservados indicando fecha/día, horario y datos del paciente.
* **RF-10 — Cancelación de Turno y Liberación de Slot:** Un turno `reservado` puede pasar a estado `cancelado` (sin perder trazabilidad en BD), verificando propiedad (`paciente` solo su turno; `medico` solo los suyos; `admin` cualquiera). El slot/horario queda nuevamente disponible para futuras reservas sin colisionar con el registro cancelado.
* **RF-11 — Manejo de Errores y Documentación:** Middleware de ruta no encontrada (`404`), middleware global de errores, documentación Swagger completa de todos los endpoints y `README.md`.

---

## 3. Modelo de Datos (MySQL + Sequelize)

> Nota de diseño: Se normalizan las entidades en MySQL y se definen asociaciones en Sequelize (`hasMany` / `belongsTo`). Para permitir que un slot cancelado quede libre y pueda volver a reservarse sin chocar con registros históricos cancelados, se combina **transacción en Sequelize** con una **restricción/índice único en MySQL** sobre la clave de slot junto con una columna de control de slot activo (por ejemplo, `slotActivoKey` que vale `"${medicoId}_${fecha}_${horaInicio}"` cuando `estado = 'reservado'` y `NULL` cuando `estado = 'cancelado'`, permitiendo múltiples filas canceladas en MySQL mientras impide dos `reservado` simultáneos).

### 3.1 Entidades y Atributos

1. **`usuarios` (`Usuario`)**
   * `id` (PK, INT AUTO_INCREMENT)
   * `nombre` (VARCHAR, NOT NULL)
   * `email` (VARCHAR, UNIQUE, NOT NULL)
   * `passwordHash` (VARCHAR, NOT NULL — generado con `bcryptjs`)
   * `rol` (ENUM `'paciente'`, `'medico'`, `'admin'`, NOT NULL)
   * `activo` (BOOLEAN, default `true`)
   * `createdAt`, `updatedAt`

2. **`medicos` (`Medico`)** *(extensión de perfil para usuarios con rol `medico`)*
   * `id` (PK, INT AUTO_INCREMENT)
   * `usuarioId` (FK -> `usuarios.id`, UNIQUE, NOT NULL)
   * `especialidad` (VARCHAR, NOT NULL)
   * `matricula` (VARCHAR, UNIQUE, NOT NULL)
   * `createdAt`, `updatedAt`

3. **`lugares_atencion` (`LugarAtencion`)**
   * `id` (PK, INT AUTO_INCREMENT)
   * `medicoId` (FK -> `medicos.id`, NOT NULL)
   * `nombre` (VARCHAR, NOT NULL — ej. *"Consultorio Centro"*, *"Clínica Guaminí"*)
   * `direccion` (VARCHAR, NOT NULL)
   * `createdAt`, `updatedAt`

4. **`bloques_disponibilidad` (`BloqueDisponibilidad`)**
   * `id` (PK, INT AUTO_INCREMENT)
   * `medicoId` (FK -> `medicos.id`, NOT NULL)
   * `lugarId` (FK -> `lugares_atencion.id`, NOT NULL)
   * `diaSemana` (INT / ENUM `0..6` o `'lunes'..'domingo'` o fecha específica según definición de bloque; si es regla semanal o bloque por día, mantener consistencia explícita)
        Decisión de diseño:
      - Los bloques representan reglas de disponibilidad semanales recurrentes.
      - diaSemana será un entero de 0 a 6.
      - La fecha concreta del turno se almacena en turnos.fecha.
      - La disponibilidad se genera aplicando el día de la semana correspondiente a la fecha consultada.
      Decisiones adicionales sobre disponibilidad:
   - Los bloques representan reglas semanales recurrentes.
   - Cada bloque genera slots según su horaInicio, horaFin y duracionMinutos.
   - Los slots se calculan dinámicamente al consultar disponibilidad.
   - No se almacenan previamente todos los slots en una tabla independiente.
   - La fecha consultada debe corresponder al diaSemana del bloque.
   - No se pueden generar turnos para fechas pasadas.
   - No se pueden reservar horarios que ya hayan comenzado.
   - Los turnos deben conservar su horaInicio, horaFin y lugarId originales aunque posteriormente cambie la configuración del bloque.
   * `horaInicio` (TIME / string `HH:mm`, NOT NULL)
   * `horaFin` (TIME / string `HH:mm`, NOT NULL)
   * `duracionMinutos` (INT, NOT NULL — ej. `15`, `20`, `30`, `45`, `60`)
   * `activo` (BOOLEAN, default `true`)
   * `createdAt`, `updatedAt`

5. **`turnos` (`Turno`)**
   * `id` (PK, INT AUTO_INCREMENT)
   * `medicoId` (FK -> `medicos.id`, NOT NULL)
   * `pacienteId` (FK -> `usuarios.id`, NOT NULL)
   * `bloqueId` (FK -> bloques_disponibilidad.id, NOT NULL)
   * `lugarId` (FK -> `lugares_atencion.id`, NOT NULL)
   * `fecha` (DATEONLY `YYYY-MM-DD`, NOT NULL)
   * `horaInicio` (TIME / string `HH:mm`, NOT NULL)
   * `horaFin` (TIME / string `HH:mm`, NOT NULL)
   * `estado` (ENUM `'reservado'`, `'cancelado'`, default `'reservado'`, NOT NULL)
   * `canceladoPorRol` (ENUM `'paciente'`, `'medico'`, `'admin'`, NULLABLE)
   * `canceladoEn` (DATETIME, NULLABLE)
   * `slotActivoKey` (VARCHAR(120), UNIQUE NULLABLE — `"${medicoId}_${fecha}_${horaInicio}"` cuando `estado = 'reservado'`, `NULL` cuando `estado = 'cancelado'`)
   * `createdAt`, `updatedAt`

---

## 4. Contrato REST API

> Todas las rutas protegidas esperan la **cookie `HTTPOnly`** con el JWT válido. Las respuestas siguen un formato JSON consistente.

### 4.1 Autenticación y Usuarios
* `POST /api/auth/register` — Auto-registro de `paciente`. Body: `{ nombre, email, password }`. Respuesta: `201 Created` (sin devolver `passwordHash`).
* `POST /api/auth/login` — Inicia sesión. Body: `{ email, password }`. Setea cookie `HTTPOnly` con JWT. Respuesta: `200 OK` con datos básicos del usuario.
* `POST /api/auth/logout` — Limpia la cookie `HTTPOnly`. Respuesta: `200 OK`.
* `POST /api/usuarios/medicos` — *(Solo `admin`)* Crea usuario con rol `medico` y su registro en `medicos`. Body: `{ nombre, email, password, especialidad, matricula }`. Respuesta: `201 Created`.

### 4.2 Disponibilidad y Lugares
* `POST /api/disponibilidad/bloques` — *(Solo `medico` / `admin`)* Crea un bloque horario + lugar. Valida no solapamiento y duración divisible. Respuesta: `201 Created`.
* `GET /api/disponibilidad/medicos/:medicoId` — *(Autenticado)* Obtiene lugares, bloques y slots disponibles del médico (`req.params.medicoId`, opcionalmente `req.query.fecha`). Respuesta: `200 OK`.
* `PATCH /api/disponibilidad/bloques/:bloqueId` — *(Solo `medico` dueño / `admin`)* Edita bloque si **no** tiene turnos `reservado` asociados. Respuesta: `200 OK` o `409 Conflict`.
* `DELETE /api/disponibilidad/bloques/:bloqueId` — *(Solo `medico` dueño / `admin`)* Elimina/desactiva bloque si **no** tiene turnos `reservado` asociados. Respuesta: `200 OK` o `409 Conflict`.

### 4.3 Turnos
* `POST /api/turnos` — *(Solo `paciente`)* Reserva un turno dentro de transacción Sequelize + restricción única en MySQL. Body: `{ medicoId, bloqueId, lugarId, fecha, horaInicio }`. Respuesta: `201 Created` o `409 Conflict` si el slot ya está tomado.
* `GET /api/turnos` — *(Autenticado)* Lista turnos filtrando por `req.query` (`fecha`, `estado`, `medicoId`, `pacienteId`). Filtra automáticamente según rol si el usuario no es `admin`. Respuesta: `200 OK`.
* `GET /api/turnos/:id` — *(Autenticado)* Detalle de turno por `req.params.id`, validando propiedad (`paciente` dueño, `medico` del turno o `admin`). Respuesta: `200 OK` o `403/404`.
* `PATCH /api/turnos/:id/cancelar` — *(Autenticado)* Cancela el turno (`estado = 'cancelado'`, limpia `slotActivoKey = null`, registra `canceladoPorRol` y `canceladoEn`). Valida propiedad (`paciente` dueño, `medico` del turno o `admin`). Respuesta: `200 OK`.

### 4.4 Documentación y Errores
* `GET /api-docs` (o ruta configurada) — Interfaz Swagger UI con todos los endpoints, esquemas y códigos de respuesta.
* Cualquier ruta inexistente -> `404 Not Found` vía middleware específico de ruta no encontrada.
* Cualquier error no controlado o lanzado con `next(err)` -> Manejador global de errores.

### Gestión de lugares de atención

* `POST /api/lugares`
* Médico autenticado o admin.
* Crea un lugar de atención.
* El médico solamente puede crear lugares para su propio perfil.
* El admin puede crear lugares para cualquier médico.

* `GET /api/lugares`
* Médico: consulta sus propios lugares.
* Admin: puede consultar los lugares de todos los médicos.

* `GET /api/lugares/:id`
* Consulta el detalle de un lugar.
* El médico solamente puede consultar sus propios lugares.
* El admin puede consultar cualquier lugar.

- `PATCH /api/lugares/:id`
* Permite modificar nombre y dirección.
* Verifica la propiedad del recurso.
* No debe modificar los datos históricos de turnos ya reservados.
---

## 5. Reglas de Negocio y Restricciones Críticas

1. **ESM Estricto:** Todo el código usa `import` y `export`. No usar `require` ni `module.exports`.
2. **Seguridad y Credenciales:** Cero credenciales o secretos en código. Todo en `.env`. Contraseñas hasheadas con `bcryptjs` (nunca en texto plano ni retornadas en JSON).
3. **Token en Cookie `HTTPOnly`:** El JWT se guarda en cookie con `httpOnly: true`. Middlewares verifican la cookie, decodifican el JWT y adjuntan `req.user = { id, rol, medicoId }`.
4. **Control de Roles y Propiedad:**
   * `paciente`: puede registrarse, iniciar/cerrar sesión, consultar disponibilidad, listar sus turnos, reservar y cancelar **solo sus propios turnos**.
   * `medico`: dado de alta por `admin`; puede gestionar sus lugares y bloques de disponibilidad, ver sus turnos reservados (con datos del paciente) y cancelar **solo turnos asignados a él**.
   * `admin`: puede dar de alta médicos, consultar/listar y cancelar cualquier turno.
5. **Validación de Bloques Horarios:**
   * `horaFin > horaInicio` y `duracionMinutos > 0`.
   * La duración total del bloque en minutos debe ser **divisible exactamente** por `duracionMinutos` (`minutosTotales % duracionMinutos === 0`).
   * **No puede haber solapamiento horario** para el mismo médico en el mismo día/franja, incluso si es en distintos lugares de atención.
6. **Bloqueo al Modificar/Borrar Disponibilidad:**
   * Antes de editar o eliminar un bloque o slot, verificar si existen turnos en estado `reservado` vinculados a ese bloque/horario. Si existen, rechazar la operación.
7. **Concurrencia y Reservas:**
   * La creación de un turno se ejecuta dentro de una **transacción de Sequelize** (`sequelize.transaction(...)`).
   * Se verifica disponibilidad del bloque/slot y se inserta con `estado: 'reservado'` y `slotActivoKey = "${medicoId}_${fecha}_${horaInicio}"`.
   * Las operaciones de reserva y cancelación deben ejecutarse de forma atómica.
   * La restricción UNIQUE sobre slotActivoKey es la garantía definitiva contra reservas duplicadas.
   * La verificación previa de disponibilidad no reemplaza la restricción de MySQL.
   * Los errores de duplicidad de Sequelize/MySQL deben convertirse en HTTP 409 Conflict.
   * La cancelación debe actualizar el estado y liberar slotActivoKey dentro de una misma transacción.
   * MySQL cuenta con índice/restricción única sobre `slotActivoKey`; si dos peticiones compiten en el mismo instante, la segunda falla y se traduce a `409 Conflict` (slot ya reservado).
   Reglas adicionales de reservas:
   - La fecha y horario deben pertenecer a un bloque activo del médico.
   - El lugar debe pertenecer al médico y al bloque seleccionado.
   - El paciente no puede reservar turnos para otros pacientes.
   - No se permiten reservas para fechas u horarios pasados.
   - La horaFin del turno debe calcularse utilizando la duración del bloque.
   - La reserva debe validar nuevamente la disponibilidad dentro de la transacción.
   - Una cancelación solamente puede realizarse si el turno se encuentra en estado reservado.
   - Las reservas y cancelaciones deben preservar la integridad del historial.
   - slotActivoKey debe generarse exclusivamente en el backend.
   - Su valor debe identificar de manera única al médico, fecha y hora de inicio.
   - No debe aceptar valores proporcionados por el cliente.
   - Al cancelar un turno, debe establecerse en NULL dentro de la misma transacción que modifica el estado.
   - La columna debe tener una restricción UNIQUE real en MySQL.
8. **Cancelación y Reutilización de Slot:**
   * Al cancelar un turno `reservado`, se actualiza `estado` a `'cancelado'`, se setea `slotActivoKey = null` y se guardan metadatos de cancelación (`canceladoPorRol`, `canceladoEn`).
   * El registro histórico permanece en MySQL y el horario vuelve a quedar disponible de inmediato para nuevas reservas.
9. **Manejo de Errores Estándar Node:**
   * Middleware 404 para rutas no registradas.
   * Middleware global de 4 argumentos `(err, req, res, next)` que normaliza errores de validación, JWT/auth (`401`), permisos/propiedad (`403`), conflicto/duplicado (`409`) y errores internos (`500`).

   
---

# 6. Base de datos y migraciones

- Utilizar Sequelize para modelos y consultas.
- Mantener las asociaciones centralizadas.
- Implementar migraciones para crear y modificar tablas.
- Crear índices y restricciones en MySQL.
- Utilizar seeders para datos iniciales cuando corresponda.
- No depender de sequelize.sync({ alter: true }) como mecanismo de evolución del esquema.
- No modificar manualmente la estructura de producción sin migraciones.
- Las restricciones importantes de integridad deben existir en la base de datos, no únicamente en JavaScript.
- La aplicación debe validar las variables de entorno obligatorias al iniciar.
- Si falta una variable crítica, el servidor debe informar claramente cuál falta y detener el inicio.
- No utilizar valores secretos predeterminados en producción.
- El archivo .env.example debe contener todas las variables necesarias, con valores ilustrativos y sin credenciales reales.

# 7. Logging

Utilizar Pino.

Registrar:

- Inicio y cierre del servidor.
- Conexión a la base de datos.
- Errores de aplicación.
- Errores inesperados.
- Información operativa relevante.

No registrar:

- Contraseñas.
- passwordHash.
- JWT.
- Cookies completas.
- Datos sensibles innecesarios.

# 8. Documentación y README

El README.md debe incluir:

- Descripción del proyecto.
- Stack tecnológico.
- Requisitos previos.
- Instalación.
- Configuración de .env.
- Creación de la base de datos.
- Ejecución de migraciones.
- Ejecución de seeders.
- Comando para iniciar el servidor.
- Modo desarrollo.
- URL de Swagger.
- Ejemplos de uso de la API.

Mantener Swagger actualizado con cada modificación del contrato REST.

# 9. Estrategia de pruebas

Verificar como mínimo:

## Autenticación

- Registro correcto.
- Email duplicado.
- Login correcto.
- Contraseña incorrecta.
- Cookie HTTPOnly.
- Logout.
- Token inválido o vencido.

## Autorización

- Paciente intentando acceder a recursos administrativos.
- Médico intentando modificar bloques ajenos.
- Paciente intentando cancelar turnos ajenos.
- Admin realizando operaciones permitidas.

## Disponibilidad

- Bloques válidos.
- Duración no divisible.
- Horario de fin anterior al inicio.
- Bloques solapados.
- Bloques con turnos reservados.

## Reservas

- Reserva correcta.
- Horario inexistente.
- Horario fuera del bloque.
- Reserva duplicada.
- Dos solicitudes concurrentes para el mismo horario.
- Reserva después de una cancelación.

## Cancelaciones

- Cancelación correcta.
- Cancelación por usuario no propietario.
- Cancelación de turno ya cancelado.
- Liberación efectiva del horario.
- Conservación del registro histórico.

# 10. Criterios para considerar terminado un módulo

Antes de considerar terminado un módulo:

- Cumple los requisitos funcionales.
- Respeta las reglas de autorización.
- No introduce secretos en el código.
- Utiliza ESM.
- Mantiene la separación por capas.
- Gestiona correctamente los errores.
- Respeta las restricciones de MySQL.
- Incluye documentación Swagger.
- Tiene pruebas para los escenarios críticos.
- No rompe funcionalidades existentes.

No marcar tareas como terminadas si únicamente se escribió el código sin verificar su comportamiento.

# 11. Principio rector

El objetivo no es construir una arquitectura innecesariamente sofisticada.

El objetivo es desarrollar una API REST correcta, segura, consistente y mantenible, donde cada decisión técnica pueda explicarse y justificarse durante la defensa oral de la diplomatura.

## Reglas adicionales de seguridad
La cookie JWT debe configurarse con httpOnly: true.
En producción debe utilizarse secure: true.
Definir explícitamente sameSite, path y maxAge.
La configuración utilizada para eliminar la cookie debe coincidir con la utilizada para crearla.
Validar la expiración del JWT en cada solicitud protegida.
El logout elimina la cookie del cliente, pero no invalida criptográficamente un JWT previamente emitido, salvo que se implemente un mecanismo adicional de revocación.
No devolver tokens, secretos ni información sensible en respuestas JSON.
Aplicar protección CSRF cuando corresponda al esquema de autenticación mediante cookies.
No confiar en información de identidad, roles o propiedad enviada en el body, query o params.

## Reglas de fechas y horarios
Utilizar America/Argentina/Buenos_Aires como zona horaria de referencia del sistema.
No depender de la zona horaria configurada en el servidor.
Mantener un criterio consistente de almacenamiento y comparación de fechas y horarios entre Node.js y MySQL.
Validar que las fechas recibidas tengan formato YYYY-MM-DD.
Validar que los horarios recibidos tengan formato HH:mm.
No permitir reservas para fechas pasadas ni horarios que ya hayan comenzado.
Documentar el tratamiento de fechas y horarios en la API.

## Integridad histórica
Los turnos cancelados deben conservarse en la base de datos.
No eliminar físicamente bloques que tengan turnos históricos asociados si esto compromete la integridad referencial.
Priorizar la desactivación lógica mediante activo = false.
Definir explícitamente las reglas ON DELETE y ON UPDATE de las claves foráneas.
Los datos históricos del turno deben conservar su fecha, horario y lugar originales aunque cambie la configuración actual del médico.

## Paginación y consultas
Los endpoints de listado deben admitir paginación cuando corresponda.
Utilizar parámetros page y limit.
Definir valores predeterminados y un límite máximo de resultados.
Validar y normalizar los parámetros de consulta.
Definir un ordenamiento estable para los resultados.
No permitir que los filtros enviados por el cliente amplíen los permisos correspondientes a su rol.