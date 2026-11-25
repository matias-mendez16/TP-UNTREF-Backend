# autorizacion-roles-propiedad Specification

## Purpose

Define cómo el turnero decide qué usuario autenticado puede ejecutar una acción, combinando el rol validado del token con la propiedad del recurso para proteger identidades, disponibilidad y turnos.

## Requirements

### Requirement: Identidad derivada de la sesión

Toda decisión de autorización MUST basarse en la identidad y el rol obtenidos del JWT verificado. Los valores de `id`, `rol`, `medicoId` o propiedad enviados por el cliente en body, query o params MUST NO ampliar los permisos ni reemplazar los de la sesión.

#### Scenario: Rol enviado por el cliente

- **WHEN** un paciente autenticado envía `rol: "admin"` en el cuerpo de una solicitud protegida
- **THEN** el sistema sigue considerándolo paciente y aplica los permisos de paciente

#### Scenario: Identidad ajena enviada por el cliente

- **WHEN** un paciente envía otro `pacienteId` en la query para consultar un recurso
- **THEN** el sistema no usa ese valor para autorizar el acceso

#### Scenario: Medio de autenticación alternativo

- **WHEN** un cliente sin cookie válida envía un `id` de administrador en el cuerpo
- **THEN** la solicitud es rechazada con `401`

### Requirement: Control de acceso por roles

El sistema MUST restringir las operaciones declaradas como exclusivas de un rol. Las rutas de administración de médicos MUST ser accesibles solo para `admin`; las de gestión de disponibilidad MUST ser accesibles solo para `medico` o `admin`; las de reserva de turnos MUST ser accesibles solo para `paciente`.

#### Scenario: Administrador crea médico

- **WHEN** un usuario con rol `admin` accede al alta de médicos
- **THEN** la operación se autoriza

#### Scenario: Paciente intenta administrar médicos

- **WHEN** un usuario con rol `paciente` accede al alta de médicos
- **THEN** la respuesta es `403`

#### Scenario: Médico intenta administrar médicos

- **WHEN** un usuario con rol `medico` accede al alta de médicos
- **THEN** la respuesta es `403`

#### Scenario: Paciente intenta gestionar disponibilidad

- **WHEN** un usuario con rol `paciente` intenta crear o editar un bloque horario
- **THEN** la respuesta es `403`

#### Scenario: Médico consulta disponibilidad

- **WHEN** un usuario con rol `medico` consulta su propia disponibilidad
- **THEN** la operación se autoriza

### Requirement: Propiedad de recursos del paciente

Un usuario con rol `paciente` MUST poder consultar y cancelar únicamente turnos cuyo `pacienteId` coincida con su identidad. Cualquier intento de operar sobre un turno de otro paciente MUST responderse con `403`, sin revelar datos del turno ajeno.

#### Scenario: Paciente consulta su turno

- **WHEN** un paciente solicita el detalle de un turno propio
- **THEN** la operación se autoriza y se devuelve el turno

#### Scenario: Paciente consulta turno ajeno

- **WHEN** un paciente solicita el detalle de un turno de otro paciente
- **THEN** la respuesta es `403` y no se devuelven datos del turno

#### Scenario: Paciente cancela turno ajeno

- **WHEN** un paciente intenta cancelar un turno que no le pertenece
- **THEN** la respuesta es `403` y el turno permanece sin cambios

### Requirement: Propiedad de recursos del médico

Un usuario con rol `medico` MUST poder gestionar únicamente sus lugares, bloques y turnos. El `medicoId` de la sesión MUST coincidir con el dueño del recurso. Los intentos sobre recursos de otro médico MUST responderse con `403`.

#### Scenario: Médico edita su bloque

- **WHEN** un médico edita un bloque cuyo dueño es su perfil
- **THEN** la operación se autoriza

#### Scenario: Médico edita bloque ajeno

- **WHEN** un médico intenta editar un bloque de otro médico
- **THEN** la respuesta es `403` y el bloque permanece sin cambios

#### Scenario: Médico cancela turno ajeno

- **WHEN** un médico intenta cancelar un turno asignado a otro médico
- **THEN** la respuesta es `403`

### Requirement: Acceso administrativo y respuestas de denegación

Un usuario con rol `admin` MUST poder operar sobre cualquier usuario, lugar, bloque o turno. Las denegaciones por autenticación y autorización MUST usar el formato JSON estándar y MUST NO revelar contraseñas, hashes, tokens ni la razón exacta de una credencial fallida.

#### Scenario: Administrador opera sobre recurso ajeno

- **WHEN** un administrador consulta o cancela un turno de cualquier paciente
- **THEN** la operación se autoriza

#### Scenario: Respuesta sin autenticación

- **WHEN** una solicitud protegida se rechaza por falta de sesión válida
- **THEN** la respuesta es `401` con `success: false`, `error.code` y `error.message`

#### Scenario: Respuesta sin permisos

- **WHEN** una solicitud autenticada se rechaza por rol o propiedad
- **THEN** la respuesta es `403` con el mismo formato JSON y sin datos sensibles
