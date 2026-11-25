# modelos-dominio-turnero Specification

## Purpose

Define la estructura observable de las cinco entidades persistentes del turnero y las restricciones mínimas que toda fila debe cumplir para que los módulos posteriores puedan confiar en el dominio almacenado.

## Requirements

### Requirement: Entidades persistentes obligatorias

El esquema MUST contener las entidades `Usuario`, `Medico`, `LugarAtencion`, `BloqueDisponibilidad` y `Turno`, cada una con los atributos necesarios para identificarla y vincularla con las demás.

#### Scenario: Tablas del dominio

- **WHEN** se inspecciona el esquema de la base de datos
- **THEN** existen las cinco entidades con sus columnas obligatorias

#### Scenario: Identificador primario

- **WHEN** se crea una fila en cualquiera de las cinco entidades
- **THEN** recibe un identificador único autogenerado

### Requirement: Unicidad de accesos y datos profesionales

El email de `Usuario`, el número de matrícula de `Medico` y la asociación de un `Usuario` con un perfil `Medico` MUST ser únicos en toda la base de datos.

#### Scenario: Email repetido

- **WHEN** se intenta crear un usuario con un email ya existente
- **THEN** la operación es rechazada por la restricción de unicidad

#### Scenario: Matrícula repetida

- **WHEN** se intenta crear un médico con una matrícula ya existente
- **THEN** la operación es rechazada por la restricción de unicidad

#### Scenario: Perfil médico duplicado

- **WHEN** se intenta crear un segundo perfil médico para el mismo usuario
- **THEN** la operación es rechazada

### Requirement: Estados y valores por defecto

Las entidades `Usuario` y `BloqueDisponibilidad` MUST nacer activas por defecto, y todo `Turno` MUST nacer en estado `reservado` salvo indicación explícita válida.

#### Scenario: Usuario sin campo activo

- **WHEN** se crea un usuario sin enviar el campo `activo`
- **THEN** el usuario queda almacenado con `activo = true`

#### Scenario: Bloque sin campo activo

- **WHEN** se crea un bloque de disponibilidad sin enviar el campo `activo`
- **THEN** el bloque queda almacenado con `activo = true`

#### Scenario: Turno sin estado

- **WHEN** se crea un turno sin enviar el campo `estado`
- **THEN** el turno queda almacenado con `estado = 'reservado'`

### Requirement: Dominio de valores controlado

Los campos `rol`, `estado` y `canceladoPorRol` MUST aceptar solamente los valores definidos para el dominio del turnero. `diaSemana` MUST estar entre `0` y `6`, y `duracionMinutos` MUST ser mayor que cero.

#### Scenario: Rol inválido

- **WHEN** se intenta almacenar un usuario con un rol fuera de `paciente`, `medico` o `admin`
- **THEN** la operación es rechazada

#### Scenario: Estado inválido

- **WHEN** se intenta almacenar un turno con un estado fuera de `reservado` o `cancelado`
- **THEN** la operación es rechazada

#### Scenario: Día de semana inválido

- **WHEN** se intenta almacenar un bloque con `diaSemana` fuera del rango `0..6`
- **THEN** la operación es rechazada

#### Scenario: Duración inválida

- **WHEN** se intenta almacenar un bloque con `duracionMinutos` igual o menor que cero
- **THEN** la operación es rechazada

### Requirement: Datos históricos del turno

El esquema de `Turno` MUST conservar `fecha`, `horaInicio`, `horaFin` y `lugarId` originales, además de los campos opcionales `canceladoPorRol` y `canceladoEn`, sin eliminar automáticamente las filas canceladas.

#### Scenario: Turno cancelado conservado

- **WHEN** un turno pasa a estado `cancelado`
- **THEN** su fila permanece en la base de datos con sus datos originales y la metadata de cancelación

#### Scenario: Rol de cancelación inválido

- **WHEN** se intenta almacenar `canceladoPorRol` con un valor fuera de `paciente`, `medico` o `admin`
- **THEN** la operación es rechazada
