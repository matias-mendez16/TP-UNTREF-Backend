---
name: turnero-turnos-concurrencia-cancelacion
description: Implementa reserva atómica de turnos con transacción Sequelize y restricción única en MySQL, listado con filtros req.query según rol y cancelación con validación de propiedad y liberación inmediata del horario.
---

# Turnos, Concurrencia Transaccional y Cancelación

Skill para resolver el ciclo de vida completo del turno médico: reserva segura frente a peticiones concurrentes, consultas filtradas por rol y cancelación sin pérdida de historial.

## Cuándo usarla
- Vas a implementar `POST /api/turnos`, `GET /api/turnos`, `GET /api/turnos/:id` o `PATCH /api/turnos/:id/cancelar`.
- Necesitás asegurar que dos pacientes no puedan reservar el mismo horario al mismo tiempo.
- Necesitás aplicar filtros con `req.query` y reglas de propiedad para cancelar y liberar un slot al instante.

## Pasos del flujo de trabajo

1. **Reserva transaccional (`POST /api/turnos` — rol `paciente`)**:
   - Abrir una transacción de Sequelize (`sequelize.transaction`).
   - Validar que el bloque exista, esté activo y que `horaInicio` coincida con un slot válido del bloque.
   - Insertar el turno con `estado: 'reservado'` y `slotActivoKey: "${medicoId}_${fecha}_${horaInicio}"`.
   - Capturar errores de restricción única de MySQL (`SequelizeUniqueConstraintError`) y traducirlos a `409 Conflict` (turno ya reservado).

2. **Listado y filtrado (`GET /api/turnos` con `req.query`)**:
   - Admitir filtros por `req.query`: `fecha`, `estado`, `medicoId`, `pacienteId`.
   - Aplicar alcance por rol: `paciente` solo ve sus turnos; `medico` ve sus turnos incluyendo día, horario y datos del paciente; `admin` ve todos.

3. **Detalle y cancelación con liberación inmediata (`GET /api/turnos/:id` y `PATCH /api/turnos/:id/cancelar`)**:
   - Obtener el turno por `req.params.id`.
   - Validar propiedad: `paciente` dueño del turno, `medico` asignado al turno o `admin` (caso contrario `403 Forbidden`).
   - En cancelación: verificar que esté en estado `reservado`, actualizar a `estado = 'cancelado'`, asignar `slotActivoKey = null`, registrar `canceladoPorRol` y `canceladoEn`, dejando el slot libre de inmediato y conservando la fila histórica.

4. **Verificación OpenSpec**:
   - Documentar y verificar escenarios de concurrencia (`409`), filtros `req.query` y permisos de cancelación (`403`).

   Usando el flujo SDD de OpenSpec y la skill turnero-turnos-concurrencia-cancelacion, creá la especificación e implementación del 
   módulo de turnos.

## Requisitos:
- POST /api/turnos (rol paciente): ejecuta la reserva dentro de una transacción de Sequelize, verifica disponibilidad y persiste con estado 'reservado' y slotActivoKey único; si hay colisión/concurrencia en MySQL, responde 409 Conflict.
- GET /api/turnos: usa req.query para filtrar por fecha, estado, medicoId o pacienteId, aplicando visibilidad según rol (médico ve sus turnos con datos del paciente; paciente ve los suyos; admin ve todos).
- GET /api/turnos/:id y PATCH /api/turnos/:id/cancelar: usa req.params.id, valida propiedad (paciente dueño, médico asignado o admin), pasa el turno a estado 'cancelado', limpia slotActivoKey a null para liberar el horario al instante y conserva el historial en BD.