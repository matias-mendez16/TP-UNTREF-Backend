# persistencia-sequelize Specification

## Purpose

Define el contrato observable de la capa de persistencia del turnero: uso exclusivo de configuración de entorno, verificación de conexión a MySQL, disponibilidad de transacciones atómicas y evolución controlada del esquema.

## Requirements

### Requirement: Conexión configurada exclusivamente desde el entorno

La capa de persistencia MUST construir la conexión a la base de datos únicamente con los valores de `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER` y `DB_PASSWORD` ya validados al iniciar. El código fuente MUST NOT contener credenciales ni valores operativos hardcodeados.

#### Scenario: Configuración presente

- **WHEN** el proceso carga una configuración válida de MySQL desde el entorno
- **THEN** la capa de persistencia utiliza exactamente esos valores para conectarse

#### Scenario: Sin credenciales en el código

- **WHEN** se inspeccionan los archivos de configuración de persistencia
- **THEN** no aparecen host, usuario, contraseña ni nombre de base de datos literales

### Requirement: Verificación de la conexión

El sistema MUST comprobar que la base de datos está accesible antes de habilitar operaciones de dominio. Si la comprobación falla, MUST registrar el fallo con el logger estructurado y MUST NOT dejar operaciones de dominio en un estado inconsistente.

#### Scenario: Conexión disponible

- **WHEN** la base de datos responde correctamente
- **THEN** se registra el evento de conexión y las operaciones de persistencia quedan habilitadas

#### Scenario: Conexión rechazada

- **WHEN** la base de datos no responde o rechaza las credenciales
- **THEN** se registra el error sin incluir contraseñas ni SQL sensible y no se habilitan operaciones de dominio

### Requirement: Operaciones atómicas disponibles

El sistema MUST ofrecer un mecanismo de transacción que permita confirmar todas las operaciones como una sola unidad o revertirlas sin dejar cambios parciales.

#### Scenario: Confirmación de transacción

- **WHEN** una operación compuesta termina correctamente dentro de una transacción
- **THEN** todos sus cambios quedan confirmados en la base de datos

#### Scenario: Reversión de transacción

- **WHEN** una operación compuesta falla antes de confirmar la transacción
- **THEN** ninguno de sus cambios queda persistido

### Requirement: Evolución del esquema por migraciones

El esquema de la base de datos MUST crearse y modificarse mediante migraciones versionadas. El sistema MUST NOT utilizar sincronización automática con `alter` como mecanismo de evolución del esquema.

#### Scenario: Aplicación de migraciones

- **WHEN** se ejecutan las migraciones sobre una base de datos vacía
- **THEN** quedan creadas las tablas, claves y restricciones definidas

#### Scenario: Migraciones repetidas

- **WHEN** se ejecutan nuevamente las migraciones ya aplicadas
- **THEN** no se duplican tablas, índices ni restricciones

#### Scenario: Sin sincronización automática

- **WHEN** se inspecciona la configuración de persistencia
- **THEN** no se invoca una sincronización de esquema con `alter`
