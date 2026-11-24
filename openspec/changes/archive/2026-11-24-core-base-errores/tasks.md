# Tasks

## 1. Configuración y plantilla de entorno

- [x] 1.1 Actualizar `.env.example` con `COOKIE_SECURE` y `COOKIE_PATH` conservando el resto de variables de la plantilla; verificar que incluye todas las variables críticas enumeradas en `design.md` y que no contiene credenciales reales.
- [x] 1.2 Implementar `src/config/env.js` con `dotenv.config()`, validación de variables críticas y normalización de números y flags; verificar que al ausentarse `JWT_SECRET` o al ser `PORT` inválido el proceso falla antes de escuchar y nombra la variable.
- [x] 1.3 Implementar `src/config/logger.js` con una instancia de `pino` configurable por `LOG_LEVEL` y reglas de redacción de contraseñas, tokens, cookies y secretos; verificar con un registro de prueba que el JSON no contiene esos valores.
- [x] 1.4 Agregar los scripts `start` y `dev` en `package.json` apuntando a `src/server.js` con `nodemon` para desarrollo; verificar que `npm run` los lista y que no se modificó `"type": "module"`.

## 2. Seguridad HTTP y limitación de tasa

- [x] 2.1 Implementar `src/middlewares/rate-limit.js` con el limitador global (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`) y el limitador de autenticación (`AUTH_RATE_LIMIT_MAX`) sin aplicarlo a rutas inexistentes; verificar que una prueba local excede el umbral global y obtiene `429` con `Retry-After`.
- [x] 2.2 Montar `helmet()` y el limitador global en `src/app.js` antes de cualquier ruta; verificar mediante una solicitud local que las respuestas incluyen `X-Frame-Options`, `X-Content-Type-Options` y `Content-Security-Policy`, y no incluyen `X-Powered-By`.

## 3. Respuestas de error consistentes

- [x] 3.1 Implementar `src/middlewares/error-handler.js` con una fábrica de errores HTTP (`status`, `code`), el middleware 404 y el manejador global `(err, req, res, next)` que registra con `pino` y responde `{ success: false, error: { code, message } }`; verificar el mapeo `400/401/403/404/409/429/500` y que en producción un `500` no expone stack traces.
- [x] 3.2 Registrar el middleware 404 y luego el manejador global al final de `src/app.js`; verificar que una solicitud a `GET /ruta-inexistente` devuelve `404` JSON con las cabeceras de seguridad y un registro estructurado.

## 4. Arranque y verificación de integración

- [x] 4.1 Implementar `src/server.js` como único punto de entrada: cargar configuración, iniciar `listen` en `PORT`, registrar inicio y cerrar de forma ordenada ante señales de terminación; verificar con `npm start` que escucha en el puerto configurado y que `SIGTERM` produce un registro de cierre.
- [x] 4.2 Verificar la integración completa de los escenarios de `specs/`: ESM sin `require`/`module.exports`, ausencia de `console.log`, `.env` ignorado por Git, ausencia de endpoints de negocio, formato JSON de errores, `429` configurado y logs sin secretos.

## Workflow follow-up

- Revisar los artefactos y aplicar el cambio con el flujo de implementación de OpenSpec cuando se solicite explícitamente.
- Archivar el cambio y sincronizar los specs principales una vez verificadas las tareas.
