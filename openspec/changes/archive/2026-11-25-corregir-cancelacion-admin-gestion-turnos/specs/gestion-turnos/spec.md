# Spec Delta

## MODIFIED Requirements

### Requirement: Cancelación con liberación inmediata

`PATCH /api/turnos/:id/cancelar` MUST estar disponible para el paciente propietario, el médico asignado o cualquier administrador y solo sobre turnos `reservado`. El administrador MUST poder cancelar turnos de cualquier paciente o médico sin verificar relación adicional con el turno, el lugar o el bloque. En una única operación MUST cambiar el estado a `cancelado`, fijar `slotActivoKey` en `NULL` y registrar `canceladoPorRol` y `canceladoEn`, conservando la fila histórica.

#### Scenario: Cancelación correcta

- **WHEN** un usuario autorizado cancela un turno reservado
- **THEN** el turno pasa a `cancelado`, la clave queda nula y se responde `200`

#### Scenario: Cancelación por usuario no propietario

- **WHEN** un paciente distinto del propietario o un médico distinto del asignado intenta cancelar el turno
- **THEN** la respuesta es `403` y el turno permanece reservado

#### Scenario: Administrador cancela turno ajeno

- **WHEN** un administrador sin vínculo previo cancela un turno reservado de cualquier paciente o médico
- **THEN** la respuesta es `200`, `canceladoPorRol` es `admin` y la clave de slot queda nula

#### Scenario: Cancelación de turno ya cancelado

- **WHEN** se intenta cancelar un turno que ya está cancelado
- **THEN** la operación se rechaza con `409`

#### Scenario: Reutilización del horario

- **WHEN** otro paciente reserva el horario liberado por una cancelación
- **THEN** se crea una nueva fila reservada y la fila cancelada permanece conservada
