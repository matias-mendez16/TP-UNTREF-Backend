# Proposal

## Why

La API ya expone los módulos de autenticación, usuarios, lugares, disponibilidad y turnos, pero la documentación pública no es verificable de extremo a extremo: Swagger no publica de forma uniforme los códigos `429`/`500`, la ruta de documentación ni todas las condiciones de `req.params`/`req.query`, y el README mezcla tablas no renderizables con una lista incompleta de variables de entorno. Necesitamos un contrato consultable en `/api-docs` y una guía reproducible que pueda defenderse en el examen oral sin depender de memoria.

## What Changes

- Centralizar la configuración de Swagger/OpenAPI en `src/config/swagger.js` y conservar las definiciones de esquemas en `src/docs/openapi.js`.
- Mantener Swagger UI montado en `/api-docs` con el esquema de seguridad `cookieAuth` (`apiKey`, `in: cookie`, `name: <COOKIE_NAME>`).
- Documentar las 16 operaciones REST de las 12 rutas de dominio más la propia ruta de documentación, con descripción, roles, `req.params`, `req.query`, `requestBody`, cabeceras de cookie y respuestas `200`, `201`, `400`, `401`, `403`, `404`, `409`, `429` y `500` según corresponda.
- Reescribir `README.md` con tablas Markdown, prerequisites, `npm install`, copia y validación de `.env`, creación de MySQL, migraciones, administrador inicial, `npm run dev`/`npm start`, ejemplos `curl`, reglas de negocio y guía arquitectónica por capa.
- Alinear `.env.example` y el README para que todas las variables usadas por `src/config/env.js`, incluidas `COOKIE_SECURE`, `COOKIE_PATH` y `ADMIN_*`, estén presentes y explicadas sin credenciales reales.
- Verificar completitud: cada endpoint del código aparece en Swagger y cada variable de entorno aparece en `.env.example` y en el README.

## Capabilities

### New Capabilities

- `documentacion-api`: contrato observable de la API para clientes y evaluadores: Swagger UI accesible, esquemas/seguridad/errores documentados y guía de instalación, ejecución y defensa técnica alineada con el código.

### Modified Capabilities

Ninguna. No cambian las reglas de negocio ni el comportamiento de los endpoints; solo se hace visible y reproducible lo ya implementado.

## Impact

- Código: `src/config/swagger.js` (nuevo), `src/app.js`, `src/docs/openapi.js`.
- Documentación: `README.md`, `.env.example`.
- APIs: contrato OpenAPI en `/api-docs`; sin cambios de rutas ni de respuestas HTTP.
- Dependencias: ninguna; se reutilizan `swagger-ui-express` y `swagger-jsdoc` ya instalados.
- Compatibilidad: sin cambios rupturistas; la documentación pasa a ser la fuente verificable del contrato existente.
