# Proposal

## Why

El proyecto ya tiene la base HTTP, de configuración y de errores, pero `src/models/` está vacío y no existe un contrato persistente para las entidades del turnero. Los módulos de autenticación, disponibilidad y turnos necesitan un mismo conjunto de tablas, relaciones y restricciones en MySQL para no duplicar reglas ni depender solo de validaciones en JavaScript.

## What Changes

- Definir la instancia de Sequelize en ESM con `mysql2`, usando exclusivamente la configuración ya validada en `src/config/env.js`.
- Definir los modelos `Usuario`, `Medico`, `LugarAtencion`, `BloqueDisponibilidad` y `Turno` con sus atributos, tipos, valores por defecto y restricciones de unicidad.
- Definir las asociaciones `hasMany`/`belongsTo` y las claves foráneas con reglas explícitas `ON DELETE`/`ON UPDATE` que preserven el historial de turnos.
- Definir la restricción de integridad `slotActivoKey`: clave compuesta por médico, fecha y hora de inicio cuando el turno está `reservado`, y `NULL` cuando está `cancelado`.
- Definir el uso de transacciones de Sequelize como mecanismo disponible para las operaciones atómicas de los módulos posteriores de reserva y cancelación.
- Definir la evolución del esquema mediante migraciones ejecutables y documentar su uso, sin recurrir a `sequelize.sync({ alter: true })`.
- No incorporar endpoints, control de roles ni lógica de negocio de reservas en este cambio; esos comportamientos pertenecen a módulos posteriores.

## Capabilities

### New Capabilities

- `persistencia-sequelize`: configuración ESM de la conexión MySQL con Sequelize/mysql2, verificación de conexión, disponibilidad de transacciones y evolución del esquema por migraciones.
- `modelos-dominio-turnero`: esquema y restricciones de las cinco entidades persistentes del dominio del turnero.
- `integridad-relacional-turnero`: asociaciones entre modelos, claves foráneas y reglas de conservación del historial.
- `integridad-slot-activo`: unicidad condicional del slot activo para impedir reservas duplicadas y permitir la reutilización del horario después de una cancelación.

### Modified Capabilities

- Ninguna. Las specs existentes (`runtime-config-esm`, `seguridad-http-base`, `observabilidad-pino` y `manejo-errores-api`) se reutilizan sin cambiar sus requisitos.

## Impact

- Archivos nuevos en `src/config/database.js`, `src/models/` y en el directorio de migraciones.
- `src/config/env.js` ya expone `env.db`; no es necesario modificar su validación para este cambio.
- `package.json`: script `migrate` que ejecuta un migrador propio en ESM, sin incorporar una dependencia adicional.
- `.env.example` y `README.md`: corrección y ampliación de la documentación de variables MySQL y del comando de migración; actualmente el README usa `DB_NAME` mientras la configuración exige `DB_DATABASE`.
- Logging estructurado existente (`src/config/logger.js`) para registrar conexión y fallos de base de datos sin exponer credenciales ni SQL sensible.
- No se modifica el contrato REST ni se agregan rutas nuevas.
