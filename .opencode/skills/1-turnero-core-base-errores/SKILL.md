---
name: turnero-core-base-errores
description: Inicializa la arquitectura base del backend en Node.js con ESM ("type": "module"), estructura modular, carga segura de variables de entorno (.env), cabeceras con Helmet, rate limiting, logging estructurado con Pino y middlewares estándar de 404 y manejo global de errores en JSON.
---

# Módulo Base, ESM, Seguridad Inicial y Manejo de Errores

Skill para construir y validar los cimientos del proyecto Turnero Médico en Node.js usando ECMAScript Modules (`import`/`export`), cero credenciales en código, seguridad base (`helmet`, `express-rate-limit`), logging estructurado (`pino`) y manejo centralizado de errores.

## Cuándo usarla
- Estás arrancando el proyecto desde cero antes de implementar modelos o lógica de negocio.
- Necesitás configurar `.env`, `.env.example`, `app.js`, `server.js`, logger `pino`, `helmet`, rate limiting y middlewares de `404` y error global en ESM.

## Pasos del flujo de trabajo

1. **Verificación de ESM y estructura base**:
   - Confirmar que `package.json` tiene `"type": "module"` y que ningún archivo usa `require` o `module.exports`.
   - Crear/verificar carpetas: `src/config`, `src/middlewares`, `src/routes`, `src/controllers`, `src/services`, `src/models`, `src/docs`.

2. **Variables de entorno y logger estructurado**:
   - Definir `.env.example` con `PORT`, `NODE_ENV`, `LOG_LEVEL`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_NAME`, `COOKIE_SAME_SITE`, `COOKIE_MAX_AGE_MS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` y `AUTH_RATE_LIMIT_MAX`.
   - Crear `src/config/env.js` y `src/config/logger.js` con `pino` (sin exponer secretos).

3. **Seguridad HTTP y rate limiting**:
   - Montar `helmet()` y `express-rate-limit` en `app.js` (dejando preparado un rate limiter más estricto para rutas de autenticación).

4. **Middlewares estándar de 404 y error global**:
   - Implementar middleware `404` para rutas no encontradas en JSON.
   - Implementar middleware global `(err, req, res, next)` que registre el error con `pino` y responda en JSON según el tipo de error (`400`, `401`, `403`, `404`, `409`, `429`, `500`).

5. **Especificación OpenSpec**:
   - Crear la spec y el cambio en OpenSpec sin incluir lógica de negocio de turnos todavía.