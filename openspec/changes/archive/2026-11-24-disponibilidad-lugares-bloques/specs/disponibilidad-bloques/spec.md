# Spec Delta

## Purpose

Define el comportamiento observable de la disponibilidad semanal de los médicos: cómo se publican los bloques horarios, cómo se calculan los turnos libres para una fecha y cuándo una franja deja de ser editable o eliminable.

## ADDED Requirements

### Requirement: Creación de bloques con propiedad

El sistema MUST permitir crear bloques solo a médicos autenticados sobre su propio perfil y a administradores sobre cualquier médico. El lugar indicado MUST pertenecer al mismo médico del bloque. Un paciente o un médico que indique otro perfil MUST recibir `403` y el bloque no se persiste.

#### Scenario: Médico crea bloque propio

- **WHEN** un médico envía lugar propio, día, horarios y duración válidos
- **THEN** el bloque se crea activo y se responde `201`

#### Scenario: Administrador crea bloque ajeno

- **WHEN** un administrador envía un `medicoId` existente y un lugar que pertenece a ese médico
- **THEN** el bloque se crea para ese médico y se responde `201`

#### Scenario: Lugar de otro médico

- **WHEN** el lugar indicado no pertenece al médico del bloque
- **THEN** la creación se rechaza con `400` o `403` y no se persiste el bloque

#### Scenario: Paciente intenta crear bloque

- **WHEN** un paciente autenticado solicita crear un bloque
- **THEN** la operación se rechaza con `403`

### Requirement: Validación de la franja horaria

Todo bloque MUST tener `diaSemana` entre `0` y `6`, `horaFin` posterior a `horaInicio`, `duracionMinutos` mayor que cero y una duración total divisible exactamente por `duracionMinutos`. Los horarios MUST tener formato `HH:mm` y la fecha MUST tener formato `YYYY-MM-DD` cuando se use.

#### Scenario: Duración no divisible

- **WHEN** la diferencia entre `horaFin` y `horaInicio` no es divisible por `duracionMinutos`
- **THEN** la operación se rechaza con `400`

#### Scenario: Horario invertido

- **WHEN** `horaFin` es anterior o igual a `horaInicio`
- **THEN** la operación se rechaza con `400`

#### Scenario: Día inválido

- **WHEN** `diaSemana` está fuera del rango `0..6`
- **THEN** la operación se rechaza con `400`

#### Scenario: Formato inválido

- **WHEN** se envía una hora con formato distinto de `HH:mm` o una fecha distinta de `YYYY-MM-DD`
- **THEN** la operación se rechaza con `400`

### Requirement: No solapamiento por médico y día

El sistema MUST rechazar con `409` cualquier bloque activo cuyo intervalo se solape con otro bloque activo del mismo médico y el mismo `diaSemana`, aunque pertenezcan a lugares distintos. Dos bloques consecutivos sin solapamiento MUST ser aceptados.

#### Scenario: Solapamiento en el mismo lugar

- **WHEN** un nuevo bloque se solapa con otro bloque activo del mismo médico y día en el mismo lugar
- **THEN** la creación se rechaza con `409`

#### Scenario: Solapamiento en otro lugar

- **WHEN** un nuevo bloque se solapa con otro bloque activo del mismo médico y día en un lugar distinto
- **THEN** la creación se rechaza con `409`

#### Scenario: Bloques consecutivos

- **WHEN** un bloque termina exactamente cuando empieza otro bloque del mismo médico y día
- **THEN** ambos bloques son aceptados

#### Scenario: Solicitudes simultáneas

- **WHEN** dos solicitudes simultáneas intentan crear bloques solapados para el mismo médico y día
- **THEN** una se crea y la otra se rechaza con `409`

### Requirement: Consulta de disponibilidad por médico

El sistema MUST permitir a cualquier usuario autenticado consultar la disponibilidad de un médico existente usando `req.params.medicoId`. La respuesta MUST incluir los lugares activos del médico y sus bloques activos. Un médico inexistente MUST producir `404`.

#### Scenario: Consulta sin fecha

- **WHEN** un usuario autenticado consulta un médico existente sin `fecha`
- **THEN** recibe sus lugares y bloques activos con `200`

#### Scenario: Consulta con fecha válida

- **WHEN** un usuario autenticado incluye una fecha con formato válido
- **THEN** el sistema filtra los bloques cuyo `diaSemana` coincide con esa fecha

#### Scenario: Médico inexistente

- **WHEN** un usuario autenticado consulta un `medicoId` inexistente
- **THEN** la respuesta es `404`

### Requirement: Cálculo dinámico de slots libres

Cuando se consulta con `fecha`, el sistema MUST generar los horarios de inicio y fin de cada bloque aplicando su `duracionMinutos`, MUST descontar los horarios con turno `reservado` y MUST NO ofrecer como disponibles fechas pasadas ni horarios que ya comenzaron. No se almacena una tabla de slots.

#### Scenario: Slots libres

- **WHEN** un bloque va de `09:00` a `10:00` con duración de `30` minutos y no tiene reservas para la fecha
- **THEN** se devuelven `09:00-09:30` y `09:30-10:00` como disponibles

#### Scenario: Slot reservado

- **WHEN** uno de los horarios generados tiene un turno `reservado` para esa fecha
- **THEN** ese horario se devuelve como no disponible y el resto permanece disponible

#### Scenario: Slot cancelado

- **WHEN** un horario tuvo un turno cancelado y no tiene turno `reservado`
- **THEN** el horario vuelve a devolverse como disponible

#### Scenario: Fecha pasada

- **WHEN** se consulta una fecha anterior al día actual en la zona horaria de referencia
- **THEN** no se devuelven slots reservables para esa fecha

#### Scenario: Horario ya iniciado

- **WHEN** se consulta el día actual y un slot comenzó antes de la hora actual
- **THEN** ese slot no se devuelve como disponible

### Requirement: Modificación y desactivación protegidas

El sistema MUST permitir editar o desactivar un bloque solo al médico propietario o a un administrador. Si el bloque tiene al menos un turno `reservado`, la operación MUST rechazarse con `409`. Turnos cancelados MUST NO impedir la operación, y la desactivación MUST conservar el registro del bloque y su historial.

#### Scenario: Edición de bloque sin reservas

- **WHEN** un médico propietario edita un bloque que solo tiene turnos cancelados
- **THEN** la edición se acepta con `200`

#### Scenario: Edición con turno reservado

- **WHEN** un médico propietario intenta editar un bloque con un turno `reservado`
- **THEN** la operación se rechaza con `409`

#### Scenario: Eliminación con turno reservado

- **WHEN** un administrador intenta eliminar un bloque con un turno `reservado`
- **THEN** la operación se rechaza con `409`

#### Scenario: Eliminación lógica

- **WHEN** un médico propietario elimina un bloque sin turnos reservados
- **THEN** el bloque queda `activo = false`, deja de publicarse y se responde `200`

#### Scenario: Bloque ajeno

- **WHEN** un médico intenta editar o eliminar un bloque de otro médico
- **THEN** la operación se rechaza con `403`
