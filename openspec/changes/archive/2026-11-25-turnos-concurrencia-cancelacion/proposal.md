# Proposal

## Why

La API ya cuenta con modelos, disponibilidad y reglas de integridad del slot activo, pero todavía no expone el ciclo de vida del turno. Sin endpoints de reserva, consulta y cancelación, los pacientes no pueden concretar una reserva segura, los médicos no pueden ver su agenda y no se puede demostrar frente a concurrencia que el índice único de MySQL se traduce en `409 Conflict`.

## What Changes

- Agregar `POST /api/turnos` para pacientes, con validación del bloque, el lugar, la fecha y el slot dentro de una transacción de Sequelize.
- Generar `slotActivoKey` exclusivamente en el backend y traducir cualquier colisión de unicidad de MySQL a `409 Conflict`.
- Agregar `GET /api/turnos` con filtros `fecha`, `estado`, `medicoId` y `pacienteId`, aplicando siempre el alcance correspondiente al rol de la sesión.
- Agregar `GET /api/turnos/:id` con validación de propiedad: paciente propietario, médico asignado o administrador.
- Agregar `PATCH /api/turnos/:id/cancelar` que solo opera sobre turnos `reservado`, guarda `canceladoPorRol` y `canceladoEn`, y limpia `slotActivoKey` en la misma transacción.
- Documentar los endpoints, esquemas, filtros, códigos de respuesta y reglas de concurrencia en Swagger y README.
- Verificar reserva correcta, reserva duplicada, solicitudes simultáneas, cancelación y reutilización del horario, filtros por rol y denegaciones `403`.
- No se agregan dependencias ni migraciones: se reutilizan `Turno`, `slotActivoKey`, el índice único existente y los middlewares de autenticación/autorización.

## Capabilities

### New Capabilities

- `gestion-turnos`: comportamiento observable de la reserva, el listado, el detalle y la cancelación de turnos, incluyendo concurrencia transaccional, visibilidad por rol y conservación del historial.

### Modified Capabilities

- Ninguna. `integridad-slot-activo`, `autorizacion-roles-propiedad` y `disponibilidad-bloques` ya definen las invariantes que este módulo debe respetar sin cambiarlas.

## Impact

- Nuevos archivos en `src/routes`, `src/controllers`, `src/services` y `src/utils` para turnos.
- Registro de `turnosRoutes` en `src/app.js` antes del middleware 404.
- Actualización de `src/docs/openapi.js` y `README.md`.
- Verificación end-to-end con cookies y reservas concurrentes contra MySQL.
- Sin cambios de esquema, sin nuevas dependencias y sin cambios en las reglas de negocio aprobadas.
