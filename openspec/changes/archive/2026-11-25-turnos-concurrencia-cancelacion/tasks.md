# Tasks

## 1. Preparación y utilidades

- [x] 1.1 Crear `src/utils/validaciones-turnos.js` reutilizando `validarFecha`, `validarHora`, `entero` y `paginacion`; verificar con `node --check` y con casos inválidos de fecha, hora y paginación que se responda `400`.
- [x] 1.2 Crear `src/utils/serializacion-turnos.js` con serialización explícita de turno, médico, lugar y paciente; verificar que la salida no contenga `passwordHash`, JWT, cookies ni campos sensibles.
- [x] 1.3 Crear `src/routes/turnos-routes.js`, `src/controllers/turnos-controller.js` y `src/services/turnos-service.js` siguiendo el patrón de módulos existente; verificar que no haya `require`, `module.exports` ni consultas Sequelize en rutas o controladores.
- [x] 1.4 Montar `turnosRoutes` en `src/app.js` antes de `middleware404`; verificar que `GET /api/turnos` sin cookie devuelva `401` y que una ruta inexistente siga devolviendo `404` JSON.

## 2. Reserva transaccional

- [x] 2.1 Implementar `validarReserva` con `medicoId`, `bloqueId`, `lugarId`, `fecha` y `horaInicio` obligatorios, normalizando la hora a `HH:mm`; verificar `400` para campos faltantes, fecha inválida y hora inválida.
- [x] 2.2 Implementar `crearTurno` en una transacción que obtenga el bloque activo, valide `diaSemana`, slot válido y pertenencia del lugar al médico y al bloque; verificar `201` válido, `404` para bloque inexistente/inactivo, `400` para slot fuera del bloque, `403` para lugar ajeno y `400` para fecha u horario pasado.
- [x] 2.3 Calcular `horaFin` con `duracionMinutos` y generar `slotActivoKey` exclusivamente en backend; verificar en MySQL que un cliente que envía su propia clave no altera el valor persistido.
- [x] 2.4 Convertir colisiones de unicidad en `HttpError(409, 'CONFLICT', ...)` con rollback de la transacción; verificar que una reserva duplicada y dos solicitudes simultáneas produzcan exactamente un `201` y un `409`.
- [x] 2.5 Agregar `POST /api/turnos` con `autenticar` y `autorizarRoles('paciente')`, obteniendo `pacienteId` solo de `req.user`; verificar que médico y admin reciban `403` y que un `pacienteId` ajeno en el body sea ignorado.
- [x] 2.6 Documentar `POST /api/turnos` en `src/docs/openapi.js` con body, reglas de concurrencia y respuestas `201/400/401/403/404/409`; verificar que el spec importe sin errores y muestre el ejemplo de reserva.

## 3. Listado con filtros por rol

- [x] 3.1 Implementar `validarFiltrosTurnos` para `fecha`, `estado`, `medicoId`, `pacienteId`, `page` y `limit`, con `estado` restringido a `reservado|cancelado`; verificar `400` para estado inválido, fecha inválida, IDs inválidos y paginación fuera de rango.
- [x] 3.2 Implementar `listarTurnos` aplicando primero el alcance por rol y luego los filtros con operadores Sequelize, orden estable por `fecha`, `horaInicio` e `id`; verificar que paciente vea solo los suyos, médico vea sus turnos con datos del paciente y admin vea todos.
- [x] 3.3 Rechazar con `403` cualquier filtro que intente ampliar el alcance del rol; verificar que un paciente con `pacienteId` ajeno y un médico con `medicoId` ajeno no obtengan resultados ni información del otro recurso.
- [x] 3.4 Agregar `GET /api/turnos` autenticado para los tres roles; verificar la forma `{ success: true, data: { items, pagination } }` y que los defaults de paginación coincidan con los módulos existentes.
- [x] 3.5 Documentar `GET /api/turnos` en Swagger con parámetros de filtro y paginación, aclarando la visibilidad por rol; verificar que la respuesta de ejemplo distinga médico, paciente y administrador.

## 4. Detalle con propiedad

- [x] 4.1 Implementar `obtenerTurnoPorId` verificando propiedad en el service: paciente propietario, médico asignado o admin; verificar `200` para los autorizados, `403` sin datos para ajenos y `404` para inexistente.
- [x] 4.2 Agregar `GET /api/turnos/:id` autenticado para los tres roles; verificar que el controlador solo pase `req.params.id` y `req.user` al service.
- [x] 4.3 Serializar el detalle con fecha, hora, lugar, médico, paciente y estado; verificar que la respuesta JSON no incluya `passwordHash`, tokens ni cookies.
- [x] 4.4 Documentar `GET /api/turnos/:id` en Swagger con respuestas `200/401/403/404`; verificar que la documentación indique explícitamente la regla de propiedad por rol.

## 5. Cancelación atómica y reutilización

- [x] 5.1 Implementar `cancelarTurno` con transacción y actualización condicional `where: { id, estado: 'reservado' }`; verificar que la respuesta `200` incluya `estado = 'cancelado'`, `slotActivoKey = null`, `canceladoPorRol` y `canceladoEn`.
- [x] 5.2 Verificar que la cancelación respete propiedad y estado: `403` para ajeno, `409` para turno ya cancelado y ninguna modificación en BD en esos casos.
- [x] 5.3 Verificar la reutilización completa: tras cancelar, la consulta de disponibilidad muestra el slot libre, una nueva reserva devuelve `201`, y la fila cancelada original conserva su historial con clave nula.
- [x] 5.4 Agregar `PATCH /api/turnos/:id/cancelar` autenticado para paciente, médico y admin; verificar que cada rol autorizado pueda cancelar solo bajo su regla de propiedad.
- [x] 5.5 Documentar `PATCH /api/turnos/:id/cancelar` en Swagger con respuestas `200/401/403/404/409` y la regla de liberación inmediata; verificar que el esquema publicado coincida con el comportamiento probado.

## 6. Documentación general

- [x] 6.1 Actualizar la tabla de endpoints del README con los cuatro endpoints de turnos y sus accesos por rol; verificar que las rutas y códigos coincidan con Swagger.
- [x] 6.2 Actualizar el README con filtros `req.query`, paginación, concurrencia, cancelación y ejemplos ordenados de reserva, consulta y cancelación; verificar que los comandos de ejemplo puedan ejecutarse con cookies de paciente y médico.

## 7. Verificación de integración

- [x] 7.1 Ejecutar un script E2E con cookies que cubra reserva correcta, duplicada, concurrente, listado por rol, detalle propio/ajeno, cancelación correcta/ajena/duplicada y reutilización; verificar salida `E2E-TURNOS-OK`.
- [x] 7.2 Ejecutar `node --check` sobre todos los archivos nuevos y buscar `require(` o `module.exports` en `src`; verificar que no haya errores ni violaciones ESM.
- [x] 7.3 Ejecutar `openspec validate "turnos-concurrencia-cancelacion" --strict`, `openspec validate --specs --strict` y un arranque con `npm start`; verificar que no haya errores, artefactos incompletos ni logs con secretos.

## Workflow follow-up

- Sincronizar las specs delta y archivar el cambio después de que la revisión del módulo esté conforme.
