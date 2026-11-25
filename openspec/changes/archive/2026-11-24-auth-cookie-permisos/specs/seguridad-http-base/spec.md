# Spec Delta: seguridad-http-base

## MODIFIED Requirements

### Requirement: Política de limitación para autenticación

El sistema MUST contar con una política de limitación independiente para las rutas de autenticación, parametrizada por `AUTH_RATE_LIMIT_MAX`, con un umbral menor al límite global. Esta política MUST NO modificar el comportamiento de rutas no relacionadas con autenticación.

#### Scenario: Parámetros independientes

- **WHEN** se cargan `AUTH_RATE_LIMIT_MAX` y `RATE_LIMIT_MAX` con valores distintos
- **THEN** cada política utiliza su propio umbral configurado

#### Scenario: Sin rutas de autenticación

- **WHEN** se consultan las rutas disponibles en este cambio
- **THEN** no existen rutas de autenticación y la política estricta no se aplica a otras rutas

#### Scenario: Límite de autenticación superado

- **WHEN** un cliente supera `AUTH_RATE_LIMIT_MAX` solicitudes a rutas de autenticación durante la ventana configurada
- **THEN** el servidor responde `429` con el formato JSON estándar y una cabecera `Retry-After`

#### Scenario: Aplicación exclusiva a autenticación

- **WHEN** se envían solicitudes a rutas de autenticación y a rutas que no lo son dentro de la misma ventana
- **THEN** el umbral estricto se aplica solo a las rutas de autenticación y las demás continúan usando el límite global
