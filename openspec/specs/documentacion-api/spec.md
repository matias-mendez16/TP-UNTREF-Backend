# documentacion-api Specification

## Purpose

Define el contrato observable de la documentación de la API: una interfaz Swagger verificable en `/api-docs`, esquemas de seguridad y errores alineados con el comportamiento real, y una guía reproducible para instalar, ejecutar, probar y defender el backend.

## Requirements

### Requirement: Documentación interactiva accesible

La API MUST exponer `/api-docs` sin exigir cookie de sesión y MUST responder con una interfaz HTML que permita explorar y ejecutar las operaciones documentadas. La ruta de documentación MUST coexistir con el middleware global de límite de solicitudes y con el middleware de rutas inexistentes.

#### Scenario: Consulta de Swagger UI

- **WHEN** un cliente solicita `GET /api-docs`
- **THEN** recibe `200` con una interfaz HTML de documentación interactiva

#### Scenario: Cliente sin autenticación

- **WHEN** un cliente consulta `/api-docs` sin cookie `token`
- **THEN** la documentación es accesible y no se devuelve `401`

#### Scenario: Ruta inexistente fuera de la documentación

- **WHEN** un cliente solicita una ruta API no registrada
- **THEN** recibe `404` con el formato JSON estándar de error

### Requirement: Cobertura completa del contrato REST

El documento OpenAPI MUST incluir cada operación REST implementada por la API, con método, ruta, etiqueta, descripción, roles permitidos, parámetros de `req.params` y `req.query`, cuerpo de petición cuando corresponda y respuestas declaradas. El listado documentado MUST coincidir con las rutas efectivamente registradas en la aplicación.

#### Scenario: Inventario de operaciones

- **WHEN** se comparan las operaciones registradas en la aplicación con el documento OpenAPI
- **THEN** cada método y ruta registrada aparece documentado y no aparece una operación inexistente

#### Scenario: Parámetros de una operación con filtros

- **WHEN** se inspecciona el documento de una operación que acepta filtros o paginación
- **THEN** declara sus parámetros de consulta con tipo, requerimiento, valor por defecto y límites cuando aplique

#### Scenario: Cuerpo de una operación de creación

- **WHEN** se inspecciona una operación que recibe un cuerpo JSON
- **THEN** declara `requestBody` obligatorio, esquema de referencia y al menos un ejemplo válido

### Requirement: Seguridad por cookie documentada sin exponer secretos

El documento OpenAPI MUST definir un esquema de seguridad de tipo `apiKey` sobre cookie, con el nombre de cookie configurado en el entorno, y MUST marcar con ese esquema toda operación protegida. Los ejemplos y esquemas MUST NOT publicar contraseñas, hashes, JWT ni secretos.

#### Scenario: Esquema de seguridad

- **WHEN** se inspecciona el documento OpenAPI
- **THEN** existe un esquema `cookieAuth` de tipo `apiKey`, ubicado en `cookie`, cuyo nombre coincide con la cookie de sesión configurada

#### Scenario: Operación protegida

- **WHEN** se inspecciona una operación que exige sesión
- **THEN** declara el esquema `cookieAuth` y su descripción indica los roles autorizados

#### Scenario: Respuesta sin secretos

- **WHEN** se revisan esquemas y ejemplos de autenticación
- **THEN** no aparecen `passwordHash`, tokens, JWT ni valores secretos

### Requirement: Errores y códigos de estado documentados

Cada operación MUST documentar los códigos de estado que puede devolver, incluyendo `429` y `500` en las operaciones alcanzadas por los limitadores y el manejador global, y `400`, `401`, `403`, `404` o `409` cuando corresponda por validación, sesión, permisos, recurso inexistente o conflicto. Los errores MUST usar el esquema JSON estándar con `success`, `error.code` y `error.message`.

#### Scenario: Error de validación documentado

- **WHEN** una operación acepta datos de entrada y la entrada es inválida
- **THEN** el documento declara `400` con el esquema de error estándar

#### Scenario: Conflicto documentado

- **WHEN** una operación puede violar una restricción de unicidad o estado activo
- **THEN** el documento declara `409` con el esquema de error estándar

#### Scenario: Límite y error interno documentados

- **WHEN** se inspecciona cualquier operación de la API alcanzada por los middlewares globales
- **THEN** declara `429` y `500` con el esquema de error estándar

### Requirement: Guía reproducible README

El repositorio MUST incluir un `README.md` que permita reproducir el proyecto desde cero: requisitos previos, instalación de dependencias, configuración de variables de entorno, creación de la base MySQL, ejecución de migraciones, creación del administrador inicial, arranque en modo desarrollo y producción, URL de Swagger, ejemplos de uso, reglas de negocio críticas y explicación de la arquitectura por capas para defensa oral.

#### Scenario: Instalación desde cero

- **WHEN** una persona sigue el README en un entorno con Node.js y MySQL disponibles
- **THEN** puede instalar dependencias, configurar el entorno, crear el esquema e iniciar el servidor sin consultar otras fuentes

#### Scenario: Prueba de endpoints

- **WHEN** se revisa la sección de ejemplos
- **THEN** hay comandos reproducibles para autenticarse, crear recursos, consultar disponibilidad, reservar, listar y cancelar turnos

#### Scenario: Defensa arquitectónica

- **WHEN** se revisa la sección de arquitectura
- **THEN** describe la responsabilidad de configuración, middlewares, rutas, controladores, servicios, modelos y documentación, y justifica las decisiones técnicas principales

### Requirement: Variables de entorno alineadas

La plantilla `.env.example` y el README MUST enumerar las variables operativas obligatorias y opcionales usadas por la configuración, incluidas las de base de datos, JWT, cookie, limitadores y administrador inicial, con valores ilustrativos. Ninguno de los dos archivos MUST contener credenciales reales ni secretos de producción.

#### Scenario: Variable presente en las tres fuentes

- **WHEN** se comparan las variables leídas por la configuración con `.env.example` y el README
- **THEN** cada variable requerida aparece documentada en ambos archivos

#### Scenario: Plantilla sin secretos reales

- **WHEN** se inspecciona `.env.example`
- **THEN** contiene solo valores ilustrativos y el secreto JWT queda vacío o marcado como reemplazable
