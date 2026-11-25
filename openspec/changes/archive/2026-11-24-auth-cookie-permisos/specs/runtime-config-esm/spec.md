# Spec Delta: runtime-config-esm

## MODIFIED Requirements

### Requirement: Estructura por responsabilidades

El código base MUST organizarse en las carpetas `config`, `middlewares`, `routes`, `controllers`, `services`, `models` y `docs` dentro de `src/`, de modo que cada capa tenga una responsabilidad diferenciada.

#### Scenario: Carpetas base disponibles

- **WHEN** se clona el proyecto y se lista `src/`
- **THEN** existen las carpetas `config`, `middlewares`, `routes`, `controllers`, `services`, `models` y `docs`

#### Scenario: Sin lógica de negocio en la base

- **WHEN** se revisa el contenido inicial de `src/routes`, `src/controllers` y `src/services`
- **THEN** no existen endpoints ni reglas de negocio de turnos, disponibilidad ni autenticación

#### Scenario: Separación con endpoints de autenticación presentes

- **WHEN** se revisan `src/routes`, `src/controllers` y `src/services` después de incorporar el módulo de autenticación
- **THEN** las rutas solo declaran endpoints y middlewares, los controladores orquestan solicitudes y respuestas, y las reglas de negocio y consultas permanecen en servicios
