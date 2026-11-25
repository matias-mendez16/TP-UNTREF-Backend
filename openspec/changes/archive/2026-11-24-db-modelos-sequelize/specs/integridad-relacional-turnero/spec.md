# Spec Delta

## Purpose

Define cómo se vinculan las entidades del turnero y qué garantías ofrece la base de datos para que ningún turno quede huérfano, apunte a otro médico o pierda su historial por una eliminación física.

## ADDED Requirements

### Requirement: Referencias existentes obligatorias

Toda fila de `Medico`, `LugarAtencion`, `BloqueDisponibilidad` y `Turno` MUST referenciar filas existentes en las entidades correspondientes. La base de datos MUST rechazar cualquier referencia huérfana.

#### Scenario: Médico sin usuario

- **WHEN** se intenta crear un perfil médico con un `usuarioId` inexistente
- **THEN** la operación es rechazada por integridad referencial

#### Scenario: Bloque sin lugar

- **WHEN** se intenta crear un bloque con un `lugarId` inexistente
- **THEN** la operación es rechazada por integridad referencial

#### Scenario: Turno sin paciente

- **WHEN** se intenta crear un turno con un `pacienteId` inexistente
- **THEN** la operación es rechazada por integridad referencial

### Requirement: Relaciones recuperables del dominio

El sistema MUST permitir obtener las entidades vinculadas desde cualquiera de los lados de una relación definida, respetando siempre la pertenencia del recurso.

#### Scenario: Lugares de un médico

- **WHEN** se consultan los lugares asociados a un médico
- **THEN** se obtienen solamente los lugares creados para ese médico

#### Scenario: Turnos de un bloque

- **WHEN** se consultan los turnos de un bloque
- **THEN** se obtienen solamente los turnos vinculados a ese bloque

#### Scenario: Paciente de un turno

- **WHEN** se consulta el paciente de un turno
- **THEN** se obtiene el usuario almacenado como `pacienteId` de ese turno

### Requirement: Coherencia de médico, lugar y bloque

Un `Turno` MUST NOT vincular un bloque y un lugar que no pertenezcan al mismo médico. La base de datos MUST rechazar esa combinación aunque cada identificador exista por separado.

#### Scenario: Lugar ajeno al bloque

- **WHEN** se intenta crear un turno con un bloque del médico A y un lugar del médico B
- **THEN** la operación es rechazada por la restricción de coherencia

#### Scenario: Bloque y lugar coherentes

- **WHEN** se crea un turno con un bloque y un lugar que pertenecen al mismo médico
- **THEN** la operación es aceptada

### Requirement: Conservación del historial ante eliminación

Mientras existan turnos que referencien a un médico, paciente, bloque o lugar, la base de datos MUST rechazar la eliminación física de esas filas. El sistema MUST permitir la desactivación lógica de usuarios y bloques para preservar el historial.

#### Scenario: Eliminar bloque con turnos

- **WHEN** se intenta eliminar físicamente un bloque que tiene turnos asociados
- **THEN** la operación es rechazada

#### Scenario: Eliminar paciente con turnos

- **WHEN** se intenta eliminar físicamente un usuario que figura como paciente en algún turno
- **THEN** la operación es rechazada

#### Scenario: Desactivar bloque con turnos

- **WHEN** se marca como inactivo un bloque que tiene turnos históricos
- **THEN** la operación es aceptada y los turnos siguen siendo consultables
