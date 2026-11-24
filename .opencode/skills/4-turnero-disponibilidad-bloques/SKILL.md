---
name: turnero-disponibilidad-bloques
description: Gestiona lugares de atención y bloques horarios de los médicos, validando divisibilidad de duración, ausencia de solapamientos horarios, consulta por req.params y bloqueo de edición o borrado cuando existen turnos reservados.
---

# Lugares y Bloques de Disponibilidad

Skill para implementar la oferta horaria de los médicos en sus lugares de atención, garantizando franjas válidas sin choques y protegiendo los bloques que ya tienen turnos comprometidos.

## Cuándo usarla
- Vas a implementar la carga, consulta, edición o eliminación de lugares y bloques de disponibilidad médica.
- Necesitás calcular slots disponibles para un médico usando `req.params.medicoId` y `req.query.fecha`.
- Necesitás impedir que un médico modifique o borre un bloque con turnos activos.

## Pasos del flujo de trabajo

1. **Creación de bloques horarios (`POST /api/disponibilidad/bloques`)**:
   - Permitido para rol `medico` (sobre su propio perfil) o `admin`.
   - Validar que `horaFin > horaInicio` y `duracionMinutos > 0`.
   - Validar **divisibilidad exacta**: la diferencia total en minutos entre `horaInicio` y `horaFin` debe ser múltiplo exacto de `duracionMinutos`.
   - Validar **no solapamiento**: consultar bloques activos del mismo médico en el mismo día y rechazar (`409`) si las franjas se superponen, incluso si pertenecen a distintos lugares de atención.

2. **Consulta de disponibilidad (`GET /api/disponibilidad/medicos/:medicoId`)**:
   - Usar `req.params.medicoId` (y `req.query.fecha` opcional) para devolver lugares de atención, bloques vigentes y slots horarios libres descontando los turnos en estado `reservado`.

3. **Edición y borrado protegidos (`PATCH` / `DELETE /api/disponibilidad/bloques/:bloqueId`)**:
   - Verificar propiedad del bloque (`medico` dueño o `admin`).
   - Consultar si existen registros en `Turno` con `bloqueId` y `estado === 'reservado'`. Si existe al menos uno, bloquear la operación con `409 Conflict`.

4. **Verificación OpenSpec**:
   - Registrar en OpenSpec los casos borde de solapamiento, divisibilidad y bloqueo por turnos reservados.

   Usando el flujo SDD de OpenSpec y la skill turnero-disponibilidad-bloques, creá la especificación e implementación del módulo de disponibilidad de médicos.

## Requisitos:
- Endpoints para crear bloques horarios con lugar de atención, día/franja, horaInicio, horaFin y duración fija en minutos (req.body).
- Validaciones de negocio: horaFin > horaInicio, duración positiva, duración divisible exactamente sobre la duración del bloque, y ausencia de solapamiento horario para el mismo médico (incluso entre distintos lugares).
- Endpoint GET /api/disponibilidad/medicos/:medicoId usando req.params (y req.query opcional de fecha) para listar lugares, bloques y horarios/slots disponibles.
- Endpoints de edición/eliminación de bloques que bloqueen la operación si existen turnos en estado 'reservado' asociados.