# gestion-lugares-atencion Specification

## Purpose

Define el comportamiento observable de los lugares de atención donde los médicos prestan servicios, incluyendo quién puede crearlos, consultarlos y modificarlos sin alterar el historial de turnos.

## Requirements

### Requirement: Alta de lugares según rol

El sistema MUST permitir crear un lugar de atención a un médico autenticado solo para su propio perfil y a un administrador para cualquier médico existente. El sistema MUST rechazar la creación con `403` si un paciente intenta usar estos endpoints o si un médico intenta crear un lugar para otro médico.

#### Scenario: Médico crea su propio lugar

- **WHEN** un médico autenticado envía nombre y dirección sin identificador de médico
- **THEN** el lugar queda asociado al perfil médico obtenido de la sesión y se responde `201`

#### Scenario: Administrador crea lugar para un médico

- **WHEN** un administrador envía un `medicoId` existente junto con nombre y dirección
- **THEN** el lugar queda asociado a ese médico y se responde `201`

#### Scenario: Médico intenta crear lugar ajeno

- **WHEN** un médico autenticado envía un `medicoId` distinto de su perfil
- **THEN** la operación se rechaza con `403` y no se persiste el lugar

#### Scenario: Paciente intenta crear lugar

- **WHEN** un paciente autenticado solicita crear un lugar
- **THEN** la operación se rechaza con `403`

### Requirement: Listado de lugares por propiedad

El sistema MUST devolver únicamente los lugares del médico autenticado cuando el solicitante es médico, y todos los lugares cuando el solicitante es administrador. El listado MUST aceptar `page` y `limit`, con valores por defecto y un máximo definidos, y MUST ordenarse de forma estable por identificador.

#### Scenario: Médico lista sus lugares

- **WHEN** un médico consulta el listado de lugares
- **THEN** recibe solo los lugares asociados a su perfil médico

#### Scenario: Administrador lista todos los lugares

- **WHEN** un administrador consulta el listado sin filtros de propiedad
- **THEN** recibe los lugares de todos los médicos

#### Scenario: Paginación inválida

- **WHEN** un solicitante envía `page=0`, `limit=0` o `limit` por encima del máximo permitido
- **THEN** la solicitud se rechaza con `400` y no se devuelve una página parcial

### Requirement: Detalle de lugar protegido

El sistema MUST permitir consultar el detalle de un lugar solo al médico propietario o a un administrador. El sistema MUST responder `404` cuando el identificador no exista y `403` cuando exista pero no pertenezca al médico autenticado.

#### Scenario: Médico consulta lugar propio

- **WHEN** un médico consulta el detalle de un lugar asociado a su perfil
- **THEN** recibe los datos del lugar con `200`

#### Scenario: Médico consulta lugar ajeno

- **WHEN** un médico consulta el detalle de un lugar de otro médico
- **THEN** la operación se rechaza con `403`

#### Scenario: Lugar inexistente

- **WHEN** un solicitante autorizado consulta un identificador de lugar inexistente
- **THEN** la operación se rechaza con `404`

### Requirement: Edición de lugar sin alterar historial

El sistema MUST permitir a un médico propietario o a un administrador modificar solamente `nombre` y `direccion` de un lugar. El sistema MUST conservar el lugar y los datos originales ya registrados en los turnos históricos aunque el lugar se edite posteriormente.

#### Scenario: Médico edita lugar propio

- **WHEN** un médico propietario envía un nuevo nombre y una nueva dirección
- **THEN** el lugar se actualiza y se responde `200`

#### Scenario: Administrador edita lugar ajeno

- **WHEN** un administrador envía cambios válidos para un lugar de cualquier médico
- **THEN** el lugar se actualiza y se responde `200`

#### Scenario: Edición sin translado de cambios al historial

- **WHEN** se edita el nombre o la dirección de un lugar que ya tiene turnos
- **THEN** los turnos existentes conservan el `lugarId` y los datos históricos que tenían al reservarse
