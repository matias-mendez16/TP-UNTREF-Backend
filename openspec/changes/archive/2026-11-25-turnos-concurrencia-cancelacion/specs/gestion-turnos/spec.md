# Spec Delta

## Purpose

Define el comportamiento observable del ciclo de vida de los turnos médicos: quién puede reservarlos, cómo se consultan según rol y cómo se cancelan conservando el historial y liberando el horario de inmediato.

## ADDED Requirements

### Requirement: Reserva restringida a pacientes

El sistema MUST aceptar reservas solo de usuarios autenticados con rol `paciente`. El paciente de la reserva MUST obtenerse de la sesión; un `pacienteId` enviado por el cliente MUST NOT reemplazarlo. Un médico o administrador MUST recibir `403`.

#### Scenario: Paciente reserva su propio turno

- **WHEN** un paciente autenticado envía médico, bloque, lugar, fecha y hora válidos
- **THEN** la reserva se procesa con su propia identidad y se responde `201`

#### Scenario: Médico intenta reservar

- **WHEN** un usuario con rol `medico` solicita crear un turno
- **THEN** la operación se rechaza con `403` y no se persiste el turno

#### Scenario: Paciente envía otro pacienteId

- **WHEN** un paciente incluye un `pacienteId` distinto del suyo en el cuerpo
- **THEN** el sistema ignora ese valor y asocia el turno al paciente autenticado

### Requirement: Validación del destino de la reserva

Antes de reservar, el sistema MUST verificar que el bloque exista y esté activo, que la fecha corresponda a su `diaSemana`, que `horaInicio` sea un slot generado por su duración y que el lugar pertenezca al médico y al bloque. MUST rechazar fechas pasadas y horarios ya iniciados.

#### Scenario: Bloque inexistente o inactivo

- **WHEN** el bloque indicado no existe o está desactivado
- **THEN** la reserva se rechaza con `404` y no se persiste el turno

#### Scenario: Horario fuera del bloque

- **WHEN** la hora solicitada no coincide con un slot generado por el bloque
- **THEN** la reserva se rechaza con `400`

#### Scenario: Lugar ajeno al bloque

- **WHEN** el lugar enviado no pertenece al médico o al bloque seleccionado
- **THEN** la reserva se rechaza con `403`

#### Scenario: Reserva en el pasado

- **WHEN** la fecha es anterior al día actual o el slot ya comenzó en la zona horaria de referencia
- **THEN** la reserva se rechaza con `400`

### Requirement: Reserva atómica del slot

La reserva MUST ejecutarse como una única operación que valida disponibilidad y persiste el turno con `estado = 'reservado'` y `slotActivoKey` generada por el backend. Si dos solicitudes compiten por el mismo médico, fecha y hora, como máximo una MUST quedar reservada y la otra MUST devolver `409 Conflict`.

#### Scenario: Reserva correcta

- **WHEN** el slot está libre y todos los datos son válidos
- **THEN** se crea una fila reservada con su clave de slot activa y se responde `201`

#### Scenario: Clave generada por el backend

- **WHEN** el cliente envía un valor propio de `slotActivoKey`
- **THEN** el sistema lo ignora y calcula la clave a partir del médico, la fecha y la hora

#### Scenario: Reserva duplicada

- **WHEN** el mismo médico, fecha y hora ya tienen un turno reservado
- **THEN** la segunda reserva se rechaza con `409` y no se crea otra fila activa

#### Scenario: Solicitudes simultáneas

- **WHEN** dos solicitudes compiten por el mismo slot en el mismo instante
- **THEN** una se confirma con `201` y la otra se rechaza con `409`

### Requirement: Listado filtrado por rol

`GET /api/turnos` MUST aceptar filtros de `fecha`, `estado`, `medicoId`, `pacienteId`, `page` y `limit` con orden estable. El alcance MUST ser solo sus turnos para el paciente, solo los asignados a su perfil para el médico y todos para el administrador. Ningún filtro MUST ampliar esos permisos.

#### Scenario: Paciente lista sus turnos

- **WHEN** un paciente consulta el listado sin filtro de propiedad
- **THEN** recibe únicamente los turnos cuyo `pacienteId` es su identidad

#### Scenario: Médico consulta su agenda

- **WHEN** un médico consulta el listado
- **THEN** recibe sus turnos con fecha, horario y datos básicos del paciente

#### Scenario: Administrador filtra turnos

- **WHEN** un administrador combina filtros por fecha, estado, médico y paciente
- **THEN** recibe todos los turnos que coinciden con esos filtros

#### Scenario: Filtro que amplía permisos

- **WHEN** un paciente o un médico intenta filtrar por otro paciente o por otro médico
- **THEN** la solicitud se rechaza con `403`

#### Scenario: Paginación inválida

- **WHEN** `page` es menor que uno o `limit` supera el máximo definido
- **THEN** la solicitud se rechaza con `400`

### Requirement: Detalle de turno con propiedad

`GET /api/turnos/:id` MUST devolver el turno solo al paciente propietario, al médico asignado o al administrador. Un turno inexistente MUST devolver `404`; uno ajeno MUST devolver `403` sin revelar datos. Las respuestas MUST NOT incluir `passwordHash`, tokens ni secretos.

#### Scenario: Paciente consulta turno propio

- **WHEN** un paciente solicita el detalle de un turno propio
- **THEN** recibe la fecha, el horario, el lugar y el estado con `200`

#### Scenario: Paciente consulta turno ajeno

- **WHEN** un paciente solicita un turno de otro paciente
- **THEN** la respuesta es `403` y no se devuelven datos del turno

#### Scenario: Turno inexistente

- **WHEN** un usuario autorizado solicita un identificador inexistente
- **THEN** la respuesta es `404`

### Requirement: Cancelación con liberación inmediata

`PATCH /api/turnos/:id/cancelar` MUST estar disponible para el paciente propietario, el médico asignado o el administrador y solo sobre turnos `reservado`. En una única operación MUST cambiar el estado a `cancelado`, fijar `slotActivoKey` en `NULL` y registrar `canceladoPorRol` y `canceladoEn`, conservando la fila histórica.

#### Scenario: Cancelación correcta

- **WHEN** un usuario autorizado cancela un turno reservado
- **THEN** el turno pasa a `cancelado`, la clave queda nula y se responde `200`

#### Scenario: Cancelación por usuario no propietario

- **WHEN** un paciente, médico o administrador sin relación con el turno intenta cancelarlo
- **THEN** la respuesta es `403` y el turno permanece reservado

#### Scenario: Cancelación de turno ya cancelado

- **WHEN** se intenta cancelar un turno que ya está cancelado
- **THEN** la operación se rechaza con `409`

#### Scenario: Reutilización del horario

- **WHEN** otro paciente reserva el horario liberado por una cancelación
- **THEN** se crea una nueva fila reservada y la fila cancelada permanece conservada
