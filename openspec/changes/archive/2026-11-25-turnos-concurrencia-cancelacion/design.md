# Design

## Context

Ver `proposal.md` para la motivación. El proyecto ya tiene el modelo `Turno`, la restricción única sobre `slotActivoKey`, middlewares de sesión/roles y utilidades de fecha hora en `America/Argentina/Buenos_Aires`. No hay rutas ni servicios de turnos: las verificaciones previas se hicieron insertando filas directamente en MySQL. Ver `specs/gestion-turnos/spec.md` para el contrato observable.

## Goals / Non-Goals

**Goals:**

- Centralizar el ciclo de vida del turno en un service con operaciones atómicas.
- Traducir colisiones de unicidad a `409 Conflict` sin exponer errores de MySQL.
- Mantener un historial conservado y un slot reutilizable inmediatamente después de cancelar.
- Aplicar alcance por rol en listado, detalle y cancelación sin confiar en datos del cliente.

**Non-Goals:**

- Modificar esquema, migraciones ni asociaciones de Sequelize.
- Implementar reserva por administradores o médicos.
- Agregar notificaciones, recordatorios ni pagos.
- Cambiar las reglas existentes de disponibilidad semanal o de propiedad.

## Decisions

- **Separación por capas**: `routes` solo autentica/autoriza y delega; `controllers` adaptan `req`/`res`; `services` contienen validación de negocio, transacciones y consultas. Alternativa descartada: consultar Sequelize desde rutas o controladores, porque rompe la arquitectura y dificulta la defensa oral.
- **Validación centralizada**: crear `src/utils/validaciones-turnos.js` reutilizando `validarFecha`, `validarHora`, `entero` y `paginacion`. La hora de inicio se normaliza a `HH:mm`; el formato inválido se responde con `400`. Alternativa descartada: validar en cada controlador con reglas duplicadas.
- **Reserva transaccional**: `crearTurno` abre una transacción, busca el bloque activo, valida `diaSemana`, el slot y la pertenencia del lugar, calcula `horaFin` con `duracionMinutos`, genera `slotActivoKey` en backend y crea la fila `reservado`. Alternativa descartada: confiar solo en una consulta previa sin restricción de BD.
- **Concurrencia**: la garantía definitiva es el índice único de `slotActivoKey`; `esErrorDuplicado` convierte `SequelizeUniqueConstraintError`/`ER_DUP_ENTRY` en `HttpError(409, 'CONFLICT', ...)` y hace rollback. No se usa bloqueo de fila adicional porque agrega contención sin reforzar la invariante ya garantizada por MySQL.
- **Listado**: `listarTurnos` construye `where` con `Op` y aplica primero el alcance obligatorio por rol; luego interpreta filtros `fecha`, `estado`, `medicoId` y `pacienteId`. Un filtro que intente ampliar el alcance se rechaza con `403`. Orden estable: `fecha`, `horaInicio`, `id`; paginación `page`/`limit` con límites existentes.
- **Serialización**: `src/utils/serializacion-turnos.js` expone datos del turno y del paciente (`id`, `nombre`, `email`) solo cuando el rol lo permite. Nunca se incluyen `passwordHash`, JWT ni cookies. Alternativa descartada: devolver la instancia Sequelize con `include` completo.
- **Detalle y cancelación**: la propiedad se verifica en el service comparando `req.user` con `pacienteId`/`medicoId`; admin siempre puede operar. Un turno ajeno responde `403` sin revelar datos. Alternativa descartada: usar solo middlewares de propiedad, porque no cubren la combinación de roles sobre el mismo recurso.
- **Cancelación atómica**: dentro de una transacción se ejecuta una actualización condicional `where: { id, estado: 'reservado' }`; si no afecta filas, se responde `409`. La misma actualización fija `estado = 'cancelado'`, `slotActivoKey = null`, `canceladoPorRol` y `canceladoEn`. Alternativa descartada: leer, validar y guardar, que permite dos cancelaciones simultáneas.
- **Historial**: no se eliminan turnos ni se reescriben filas canceladas. La nueva reserva del mismo horario crea una fila nueva; la clave activa solo existe en turnos `reservado`.

## Risks / Trade-offs

- [Dos reservas simultáneas] → índice único real en MySQL y traducción centralizada a `409`.
- [Doble cancelación] → actualización condicional por estado dentro de la transacción.
- [Filtros que amplían permisos] → alcance por rol aplicado antes que los filtros del cliente.
- [Comparación de fechas en zona incorrecta] → reutilizar utilidades con `America/Argentina/Buenos_Aires`.
- [Exposición de datos sensibles] → serialización explícita y atributos limitados en `include`.
- [Pérdida de trazabilidad] → cancelación lógica, sin `DELETE` sobre `turnos`.

## Migration Plan

No requiere migración: el esquema y el índice único ya existen. La implementación se entrega agregando archivos de código, montando la ruta y actualizando documentación. Rollback: retirar el montaje de `turnosRoutes`, los archivos nuevos y los cambios de Swagger/README; los datos de turnos ya creados permanecen intactos.

## Open Questions

Ninguna.
