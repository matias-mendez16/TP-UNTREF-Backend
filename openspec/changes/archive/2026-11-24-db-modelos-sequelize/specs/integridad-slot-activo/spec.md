# Spec Delta

## Purpose

Define la invariante de concurrencia del turnero: cómo se identifica un horario activo, cómo se impiden dos reservas simultáneas y cómo se libera ese horario sin borrar el registro cancelado.

## ADDED Requirements

### Requirement: Generación backend de la clave de slot activo

Para todo turno en estado `reservado`, el sistema MUST generar `slotActivoKey` como `<medicoId>_<fecha>_<horaInicio>`, con `fecha` en formato `YYYY-MM-DD` y `horaInicio` normalizada a `HH:mm`. El valor recibido del cliente MUST ser ignorado.

#### Scenario: Reserva con datos válidos

- **WHEN** se almacena un turno reservado para el médico 7, el `2026-12-01` y las `09:30`
- **THEN** su `slotActivoKey` es `7_2026-12-01_09:30`

#### Scenario: Valor enviado por el cliente

- **WHEN** el cliente envía un valor propio para `slotActivoKey`
- **THEN** el sistema no lo utiliza y calcula la clave a partir de los datos del turno

#### Scenario: Hora con segundos

- **WHEN** la hora de inicio se almacena internamente con segundos
- **THEN** la clave utiliza solamente horas y minutos en formato `HH:mm`

### Requirement: Unicidad de reservas activas

La base de datos MUST rechazar dos turnos con la misma `slotActivoKey` no nula. La verificación previa en la aplicación MUST NOT reemplazar esta restricción.

#### Scenario: Inserción duplicada

- **WHEN** se intenta insertar un segundo turno reservado con la misma clave de slot activo
- **THEN** la base de datos rechaza la inserción

#### Scenario: Solicitudes concurrentes

- **WHEN** dos solicitudes compiten por el mismo médico, fecha y hora
- **THEN** solamente una queda reservada y la otra es rechazada por conflicto

#### Scenario: Varias filas canceladas

- **WHEN** existen varias filas canceladas históricas para el mismo médico, fecha y hora
- **THEN** la base de datos las acepta porque sus claves son nulas

### Requirement: Correspondencia entre estado y clave

Todo turno `reservado` MUST tener una `slotActivoKey` no nula y todo turno `cancelado` MUST tener `slotActivoKey = NULL`. La base de datos MUST rechazar combinaciones contrarias.

#### Scenario: Reservado sin clave

- **WHEN** se intenta almacenar un turno reservado con `slotActivoKey` nula
- **THEN** la operación es rechazada

#### Scenario: Cancelado con clave

- **WHEN** se intenta almacenar un turno cancelado con una clave no nula
- **THEN** la operación es rechazada

#### Scenario: Cancelación correcta

- **WHEN** un turno reservado pasa a estado `cancelado`
- **THEN** su `slotActivoKey` queda en `NULL` en la misma operación atómica

### Requirement: Reutilización del horario cancelado

Un horario liberado por cancelación MUST volver a estar disponible de inmediato sin eliminar el turno cancelado. La nueva reserva MUST generar una nueva fila con su propia clave activa.

#### Scenario: Reserva después de cancelación

- **WHEN** se reserva nuevamente un horario que había sido cancelado
- **THEN** se crea una nueva fila reservada y la fila cancelada original permanece

#### Scenario: Metadata de cancelación

- **WHEN** un turno es cancelado por un paciente, médico o administrador
- **THEN** quedan registrados `canceladoPorRol` y `canceladoEn` en la fila histórica
