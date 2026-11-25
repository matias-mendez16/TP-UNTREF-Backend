# Proposal

## Why

Los médicos todavía no pueden publicar cuándo y dónde atienden, por lo que el sistema no puede calcular horarios reservables ni proteger la disponibilidad ya comprometida. Este cambio incorpora la oferta horaria con reglas explícitas de validez, solapamiento y propiedad.

## What Changes

- Incorporar la gestión de lugares de atención con endpoints de alta, listado, detalle y edición, respetando que un médico solo opera sobre sus propios lugares y un admin sobre cualquiera.
- Incorporar `POST /api/disponibilidad/bloques` para crear franjas semanales recurrentes por médico, lugar, día, hora inicio, hora fin y duración fija del turno.
- Validar `horaFin > horaInicio`, `duracionMinutos > 0`, divisibilidad exacta del bloque por la duración y ausencia de solapamiento con otros bloques activos del mismo médico, aun en lugares distintos.
- Incorporar `GET /api/disponibilidad/medicos/:medicoId` con `req.params.medicoId` y `req.query.fecha` opcional para devolver lugares, bloques vigentes y slots libres descontando turnos `reservado`.
- Incorporar `PATCH` y `DELETE /api/disponibilidad/bloques/:bloqueId` con verificación de propiedad y rechazo `409` cuando existan turnos `reservado` vinculados al bloque.
- Implementar el borrado como desactivación lógica para conservar la integridad referencial y el historial de turnos cancelados.
- Documentar los endpoints en Swagger y actualizar el README con el criterio de fechas, horarios y cálculo de slots.
- No se agregan dependencias ni cambios de esquema: las validaciones existentes en MySQL se complementan con validaciones de servicio y una serialización por médico para evitar solapamientos concurrentes.

## Capabilities

### New Capabilities

- `gestion-lugares-atencion`: alta, listado, detalle y edición de los lugares donde un médico presta servicios, con control de propiedad.
- `disponibilidad-bloques`: creación, consulta, edición y desactivación de bloques horarios semanales y cálculo dinámico de slots disponibles.

### Modified Capabilities

Ninguna. Las reglas generales de roles, propiedad, integridad referencial y modelo de datos ya están cubiertas por las specs existentes y se reutilizan sin cambiar su comportamiento.

## Impact

- Rutas nuevas bajo `/api/lugares` y `/api/disponibilidad`, registradas en `src/app.js` antes del middleware 404.
- Nuevos controladores, servicios y validaciones en las capas existentes; reutilización de `autenticar`, `autorizarRoles` y `verificarPropiedadMedico`.
- Consultas a `LugarAtencion`, `BloqueDisponibilidad` y `Turno` mediante Sequelize, con transacciones para crear y modificar bloques.
- Actualización de `src/docs/openapi.js` y `README.md`.
- Sin nuevas dependencias, sin migraciones y sin cambios en el contrato de autenticación.
