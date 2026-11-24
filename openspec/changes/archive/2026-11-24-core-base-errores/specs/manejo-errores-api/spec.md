# Spec Delta

## Purpose

Garantiza que todas las respuestas de error de la API sean predecibles, seguras y uniformes, con un middleware específico para rutas inexistentes y un manejador global que clasifica fallos y evita filtrar información interna.

## ADDED Requirements

### Requirement: Formato único de respuestas de error

Toda respuesta de error MUST ser JSON y MUST seguir una estructura consistente que incluya un indicador de fallo, un código de error legible y un mensaje para el cliente. En producción, MUST NOT incluir stack traces, rutas de archivos ni detalles internos de la excepción.

#### Scenario: Error devuelto por una ruta

- **WHEN** una ruta registrada responde con un error
- **THEN** el cuerpo es JSON con `success: false`, `error.code` y `error.message`

#### Scenario: Entorno de producción

- **WHEN** ocurre un error inesperado con `NODE_ENV=production`
- **THEN** la respuesta no contiene stack traces ni rutas internas

### Requirement: Ruta no encontrada

Toda solicitud que no coincida con una ruta registrada MUST ser respondida por un middleware específico con estado `404` y el formato JSON estándar de error.

#### Scenario: Ruta inexistente

- **WHEN** un cliente solicita `GET /ruta-inexistente`
- **THEN** recibe `404` con un código de error de recurso no encontrado

#### Scenario: Método no soportado

- **WHEN** un cliente utiliza un método no registrado sobre una ruta conocida
- **THEN** recibe `404` con el mismo formato JSON de error

### Requirement: Clasificación centralizada de errores

El manejador global de errores MUST normalizar los fallos según su naturaleza: errores de validación o formato a `400`, autenticación a `401`, autorización o propiedad a `403`, recursos no encontrados a `404`, conflictos o duplicados a `409`, límite de solicitudes a `429` y errores no previstos a `500`.

#### Scenario: Error de validación

- **WHEN** una solicitud contiene datos inválidos y se propaga un error de validación
- **THEN** la respuesta es `400` con un código que identifica el error de validación

#### Scenario: Error de autenticación

- **WHEN** una credencial falta o es inválida
- **THEN** la respuesta es `401` y no revela qué parte de la credencial falló

#### Scenario: Error de autorización

- **WHEN** un usuario autenticado intenta una acción sin permisos
- **THEN** la respuesta es `403`

#### Scenario: Conflicto por duplicado

- **WHEN** una operación viola una restricción de unicidad o entra en conflicto con el estado actual
- **THEN** la respuesta es `409`

#### Scenario: Límite de tasa excedido

- **WHEN** el limitador de solicitudes rechaza una petición
- **THEN** la respuesta es `429` con el formato JSON estándar

#### Scenario: Error inesperado

- **WHEN** se propaga un error no clasificado
- **THEN** la respuesta es `500` con un mensaje genérico y sin información sensible

### Requirement: Registro centralizado de errores

Todo error que llegue al manejador global MUST registrarse con el logger estructurado antes de enviar la respuesta, incluyendo contexto útil como método, ruta y código de estado.

#### Scenario: Error propagado

- **WHEN** una ruta llama al manejador global con un error
- **THEN** se emite un registro estructurado de nivel `error` con método, ruta y estado de respuesta

#### Scenario: Error de cliente

- **WHEN** se rechaza una solicitud por validación o por falta de autenticación
- **THEN** el registro no incluye contraseñas ni tokens
