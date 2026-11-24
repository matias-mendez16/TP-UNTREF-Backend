# observabilidad-pino Specification

## Purpose

Define la observabilidad mínima del backend mediante registros estructurados y seguros, de modo que la operación pueda seguir el ciclo de vida del servidor y diagnosticar fallos sin exponer credenciales, tokens ni datos sensibles en los logs.

## Requirements

### Requirement: Registros estructurados

El servidor MUST emitir sus registros como objetos JSON estructurados hacia la salida estándar, con un nivel de severidad explícito y un mensaje descriptivo. El nivel mínimo de registro MUST configurarse mediante `LOG_LEVEL`. El código MUST NOT utilizar `console.log`, `console.error` ni equivalentes para logging operativo.

#### Scenario: Registro de inicio

- **WHEN** el servidor inicia correctamente
- **THEN** emite un registro JSON estructurado de nivel `info` con un mensaje de inicio

#### Scenario: Nivel configurado

- **WHEN** `LOG_LEVEL` se configura en `warn`
- **THEN** los registros de nivel inferior a `warn` no se emiten

#### Scenario: Sin consola directa

- **WHEN** se inspecciona el código fuente bajo `src/`
- **THEN** no existen llamadas a `console.log` ni `console.error`

### Requirement: Datos sensibles excluidos de registros

Los registros MUST NOT incluir contraseñas en texto plano, hashes de contraseña, tokens JWT, cookies completas ni secretos de configuración, incluso cuando una solicitud o un error los contenga.

#### Scenario: Solicitud con cookie

- **WHEN** una solicitud incluye una cookie con un token
- **THEN** los registros generados para esa solicitud no contienen el valor de la cookie ni del token

#### Scenario: Error con datos sensibles

- **WHEN** ocurre un error cuyo contexto incluye una contraseña o un `passwordHash`
- **THEN** el registro de error no contiene esos valores

#### Scenario: Configuración secreta

- **WHEN** se registran eventos de configuración o arranque
- **THEN** el valor de `JWT_SECRET` y de `DB_PASSWORD` no aparece en los registros

### Requirement: Eventos operativos obligatorios

El servidor MUST registrar el inicio, el cierre y los errores de aplicación, incluidos los errores inesperados que llegan al manejador global.

#### Scenario: Cierre ordenado

- **WHEN** el servidor se detiene por una señal de terminación
- **THEN** emite un registro estructurado de cierre

#### Scenario: Error inesperado

- **WHEN** una solicitud provoca un error no controlado
- **THEN** se emite un registro estructurado de nivel `error` antes de responder al cliente
