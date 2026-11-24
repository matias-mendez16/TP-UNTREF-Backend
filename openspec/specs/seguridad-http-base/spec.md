# seguridad-http-base Specification

## Purpose

Establece las defensas HTTP mínimas de la API: cabeceras de seguridad en todas las respuestas y limitación de tasa configurable para proteger el servicio frente a abuso, dejando preparada una política más estricta para futuras rutas de autenticación.

## Requirements

### Requirement: Cabeceras de seguridad HTTP

Toda respuesta HTTP del servidor MUST incluir cabeceras de seguridad que reduzcan la exposición a ataques comunes, entre ellas la prevención de incrustación (`X-Frame-Options`), la no inferencia de tipo de contenido (`X-Content-Type-Options`) y una política de seguridad de contenido. El servidor MUST NO anunciar tecnologías internas mediante cabeceras innecesarias.

#### Scenario: Respuesta a una ruta pública

- **WHEN** un cliente realiza una solicitud a cualquier ruta registrada
- **THEN** la respuesta incluye `X-Frame-Options`, `X-Content-Type-Options` y `Content-Security-Policy`

#### Scenario: Respuesta de error

- **WHEN** un cliente solicita una ruta inexistente
- **THEN** la respuesta de error también incluye las cabeceras de seguridad

#### Scenario: Cabecera de tecnología del servidor

- **WHEN** se inspeccionan las cabeceras de una respuesta
- **THEN** no se expone la cabecera `X-Powered-By`

### Requirement: Límite global de solicitudes

El servidor MUST limitar la cantidad de solicitudes por dirección de origen dentro de una ventana de tiempo configurable mediante `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX`. Al superar el límite, MUST responder con estado `429` y un cuerpo JSON consistente, e incluir la cabecera `Retry-After`.

#### Scenario: Solicitudes dentro del límite

- **WHEN** un cliente realiza menos solicitudes que `RATE_LIMIT_MAX` durante la ventana configurada
- **THEN** las solicitudes se procesan normalmente

#### Scenario: Límite superado

- **WHEN** un cliente supera `RATE_LIMIT_MAX` solicitudes durante `RATE_LIMIT_WINDOW_MS`
- **THEN** el servidor responde `429` con un cuerpo JSON de error y una cabecera `Retry-After`

#### Scenario: Distintos orígenes

- **WHEN** dos clientes con direcciones de origen distintas envían solicitudes simultáneas
- **THEN** el conteo de solicitudes de cada uno se lleva por separado

### Requirement: Política de limitación para autenticación

El sistema MUST contar con una política de limitación independiente para futuras rutas de autenticación, parametrizada por `AUTH_RATE_LIMIT_MAX`, con un umbral menor al límite global. Esta política MUST NO modificar el comportamiento de rutas no relacionadas con autenticación.

#### Scenario: Parámetros independientes

- **WHEN** se cargan `AUTH_RATE_LIMIT_MAX` y `RATE_LIMIT_MAX` con valores distintos
- **THEN** cada política utiliza su propio umbral configurado

#### Scenario: Sin rutas de autenticación

- **WHEN** se consultan las rutas disponibles en este cambio
- **THEN** no existen rutas de autenticación y la política estricta no se aplica a otras rutas
