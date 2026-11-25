# Design

## Context

La aplicación ya registra 16 operaciones REST en `auth`, `usuarios`, `lugares`, `disponibilidad` y `turnos`, y hoy publica Swagger desde `app.js` usando el objeto definido en `src/docs/openapi.js`. El manejo de errores ya normaliza `400`, `401`, `403`, `404`, `409`, `429` y `500`; la configuración ya valida variables desde `src/config/env.js`; y el README contiene gran parte de la información, pero con formato inconsistente y algunas variables omitidas. Ver `proposal.md` para la motivación y `specs/documentacion-api/spec.md` para el contrato.

## Goals / Non-Goals

**Goals:**

- Publicar un contrato OpenAPI completo, consistente y verificable en `/api-docs`.
- Hacer que la documentación explícite autenticación por cookie, parámetros, cuerpos, roles y errores reales de la API.
- Dejar un README ejecutable paso a paso y útil como guía de defensa oral.
- Alinear `.env.example`, README y configuración sin incluir secretos.

**Non-Goals:**

- Modificar rutas, controladores, servicios, modelos ni reglas de negocio.
- Agregar dependencias, tests automatizados nuevos ni mecanismos de revocación de JWT.
- Generar documentación desde anotaciones automáticas o introspección de Express.
- Publicar tokens, cookies completas ni datos sensibles en Swagger.

## Decisions

- **Un único objeto OpenAPI en `src/docs/openapi.js`.** Se conserva la definición actual como fuente única de paths, esquemas y seguridad. Alternative descartada: migrar todo a anotaciones JSDoc con `swagger-jsdoc`; agregaría una capa de indirección sin beneficio para un contrato cerrado y pequeño.
- **Adaptador delgado en `src/config/swagger.js`.** Exporta el documento OpenAPI y las opciones de Swagger UI, dejando `app.js` con una sola línea de montaje. Alternative descartada: duplicar la configuración en `app.js`, que dispersaría responsabilidades y complicaría la defensa por capas.
- **Catálogo compartido de respuestas.** Centralizar `Error`, validación, autenticación, autorización, no encontrado, conflicto, límite y error interno como referencias reutilizables. Alternative descartada: repetir literalmente cada código en cada operación; es propenso a olvidar `429`/`500`.
- **Seguridad `cookieAuth` con nombre dinámico.** El esquema toma el nombre de `env.cookie.name` para no hardcodear la cookie. Las operaciones protegidas declaran `security: [{ cookieAuth: [] }]`. Swagger UI se configura con `persistAuthorization: false` para no guardar credenciales en el navegador; las peticiones protegidas se prueban con la cookie de sesión enviada por el mismo origen o con `curl -b`.
- **Verificación por inventario manual.** Durante la implementación se comparan las rutas de `src/routes/*.js` contra `paths` del documento y las variables de `src/config/env.js` contra `.env.example` y README. Alternative descartada: introspección automática de Express; no existe una API confiable y estable sin agregar dependencias.
- **README como documentación orientada a ejecución y defensa.** Se reescribe con tablas Markdown, comandos copiables y una sección de arquitectura por capa. Se mantienen las reglas de negocio ya aprobadas sin introducir cambios funcionales.

## Risks / Trade-offs

- [Riesgo] El documento Swagger puede divergir de las rutas reales → Mitigación: checklist final de inventario de 12 paths y 16 operaciones, más revisión de parámetros y respuestas por módulo.
- [Riesgo] Swagger UI no puede leer una cookie `HTTPOnly` para el botón Authorize → Mitigación: documentar el esquema y aclarar que la cookie se envía automáticamente por el navegador o mediante `curl -b`; no persistir autorización.
- [Riesgo] Declarar `429`/`500` en todas las operaciones genera ruido → Mitigación: usar componentes/ayudas compartidas y descripciones breves.
- [Riesgo] Un README extenso quede desactualizado → Mitigación: derivar comandos y variables directamente de `package.json`, `src/config/env.js` y `src/scripts/`, y verificarlos al final.
- [Riesgo] Se filtre un valor sensible en ejemplos → Mitigación: revisar que ejemplos usen correos ficticios, contraseñas de prueba rotuladas como reemplazables y ningún JWT real.

## Migration Plan

No requiere migración de base de datos ni cambios de despliegue. La implementación se aplica con el flujo `apply`: crear `src/config/swagger.js`, ajustar `src/app.js`, completar `src/docs/openapi.js`, reescribir `README.md` y alinear `.env.example`. Rollback: revertir esos archivos con Git y eliminar `src/config/swagger.js`. El comportamiento HTTP de la API permanece invariante salvo la documentación servida.

## Open Questions

Ninguna. El alcance, los endpoints y las variables están determinados por el código existente.
