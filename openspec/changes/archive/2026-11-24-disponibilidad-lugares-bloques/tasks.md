# Tasks

## 1. Estructura y montaje de rutas

- [x] 1.1 Crear los módulos `lugares` y `disponibilidad` con `routes`, `controllers`, `services` y validaciones; verificar que no haya consultas Sequelize en rutas ni lógica de negocio en controladores.
- [x] 1.2 Montar las rutas nuevas en `src/app.js` antes del middleware 404; verificar que `/api/lugares` y `/api/disponibilidad` respondan y que una ruta inexistente siga devolviendo `404` JSON.
- [x] 1.3 Reutilizar `autenticar`, `autorizarRoles` y `verificarPropiedadMedico` en las rutas nuevas; verificar que una solicitud sin cookie devuelva `401` y que un paciente no pueda usar rutas de médico/admin.

## 2. Validaciones de fechas, horarios y reglas de bloque

- [x] 2.1 Implementar utilidades para validar `YYYY-MM-DD`, `HH:mm`, convertir horas a minutos y derivar `diaSemana` sin depender de la zona horaria del servidor; verificar casos válidos e inválidos con `09:00`, `09:60`, `2026-02-30` y una fecha de domingo.
- [x] 2.2 Implementar la validación de bloque: día `0..6`, fin mayor que inicio, duración positiva y divisibilidad exacta; verificar que `09:00-10:00` con `30` pase y con `25` devuelva `400`.
- [x] 2.3 Implementar el cálculo de slots y el filtro de fechas/horarios pasados en zona `America/Argentina/Buenos_Aires`; verificar que `09:00-10:00/30` genere dos slots y que un slot iniciado no se ofrezca como disponible.

## 3. Gestión de lugares de atención

- [x] 3.1 Implementar `POST /api/lugares` con propiedad derivada del JWT para médicos y `medicoId` validado para administradores; verificar `201` para médico dueño/admin, `403` para médico ajeno y paciente, y que el `medicoId` del body no altere la propiedad del médico.
- [x] 3.2 Implementar `GET /api/lugares` con paginación `page`/`limit`, defaults `1`/`20`, máximo `100` y orden estable por `id`; verificar que un médico vea solo los suyos, un admin vea todos y `page=0` o `limit=101` devuelvan `400`.
- [x] 3.3 Implementar `GET /api/lugares/:id` y `PATCH /api/lugares/:id` restringiendo `nombre` y `direccion`; verificar `200` para propietario/admin, `403` para ajeno, `404` para inexistente y que los turnos históricos conserven su `lugarId` original.
- [x] 3.4 Documentar los cuatro endpoints de lugares en `src/docs/openapi.js` con esquemas, roles y respuestas `201/200/400/401/403/404`; verificar que Swagger UI cargue sin errores y muestre los parámetros de paginación.

## 4. Creación de bloques y prevención de solapamientos

- [x] 4.1 Implementar `POST /api/disponibilidad/bloques` en service con validación de que el lugar pertenezca al médico del bloque; verificar `201` con lugar propio y `403` con lugar ajeno.
- [x] 4.2 Implementar la verificación de solapamiento entre bloques activos del mismo médico y `diaSemana`, incluyendo lugares distintos; verificar `409` para solapes y `201` para bloques consecutivos.
- [x] 4.3 Envolver creación y validación de solapamiento en una transacción con bloqueo de la fila del médico; verificar con dos solicitudes simultáneas que solo una se cree y la otra devuelva `409`.
- [x] 4.4 Documentar `POST /api/disponibilidad/bloques` en Swagger con body, reglas de divisibilidad, solapamiento y respuestas `201/400/401/403/409`; verificar que el esquema publicado coincida con el contrato implementado.

## 5. Consulta de disponibilidad y slots

- [x] 5.1 Implementar `GET /api/disponibilidad/medicos/:medicoId` para usuarios autenticados, devolviendo lugares y bloques activos; verificar `200` para médico existente y `404` para inexistente.
- [x] 5.2 Implementar el cálculo de slots cuando llega `req.query.fecha`, filtrando por `diaSemana` y restando turnos `reservado`; verificar que un slot reservado figure como no disponible y que uno cancelado vuelva a estar libre.
- [x] 5.3 Verificar que fechas pasadas y horarios ya iniciados no se devuelvan como reservables, y que una fecha con formato inválido devuelva `400`.
- [x] 5.4 Documentar el endpoint de consulta en Swagger con `medicoId` en `params`, `fecha` en `query` y respuestas `200/400/401/404`; verificar que la respuesta de ejemplo distinga slot libre y ocupado.

## 6. Edición y desactivación protegida de bloques

- [x] 6.1 Implementar `PATCH /api/disponibilidad/bloques/:bloqueId` con propiedad desde JWT y validación completa de la franja; verificar `200` sin reservas activas, `403` para bloque ajeno y `409` si existe turno `reservado`.
- [x] 6.2 Implementar `DELETE /api/disponibilidad/bloques/:bloqueId` como desactivación lógica dentro de transacción; verificar `200` con `activo=false`, `409` con turno reservado y que un turno cancelado no bloquee la operación.
- [x] 6.3 Verificar que un bloque desactivado deje de publicarse en la consulta y que sus turnos históricos sigan consultables con `bloqueId`, `lugarId`, `fecha` y horarios originales.
- [x] 6.4 Documentar `PATCH` y `DELETE` en Swagger con respuestas `200/400/401/403/404/409` y la regla de desactivación lógica; verificar que la documentación indique explícitamente el bloqueo por turnos reservados.

## 7. Verificación de integración del módulo

- [x] 7.1 Verificar el flujo completo con cookies: login de admin → alta de médico → login de médico → alta de lugar → alta de bloque → login de paciente → consulta de disponibilidad; verificar que cada paso devuelva el código esperado y que el paciente no pueda crear lugares ni bloques.
- [x] 7.2 Verificar los casos críticos de reglas de negocio: duración no divisible, hora fin anterior, solapamiento en distinto lugar, bloque ajeno, edición con reserva y eliminación con reserva.
- [x] 7.3 Actualizar `README.md` con los endpoints nuevos, el formato `YYYY-MM-DD`/`HH:mm`, la zona horaria de referencia, la recurrencia semanal y el criterio de slots dinámicos; verificar que los ejemplos puedan ejecutarse con el orden correcto de pasos.
- [x] 7.4 Ejecutar `openspec validate "disponibilidad-lugares-bloques" --strict`, `node --check src/server.js` y un arranque con `npm start`; verificar que no haya errores, violaciones de ESM ni artefactos de planning incompletos.

## Workflow follow-up

- Sincronizar las specs delta y archivar el cambio después de que la revisión del módulo esté conforme.
