# Tasks

## 1. Configuración centralizada de Swagger

- [x] 1.1 Crear `src/config/swagger.js` con export ESM del documento OpenAPI y de las opciones de Swagger UI (`customSiteTitle`, `explorer`, `deepLinking`, `displayRequestDuration`, `persistAuthorization: false`), sin secretos ni valores hardcodeados; verificar que el archivo se importa con `node -e "import('./src/config/swagger.js')"` y que no contiene `require(` ni `module.exports`.
- [x] 1.2 Ajustar `src/app.js` para montar `/api-docs` usando la configuración centralizada, manteniendo el orden tras `cookieParser` y antes de las rutas de dominio; verificar con el servidor iniciado que `GET /api-docs` responde `200` sin cookie y que `/api/turnos` sin cookie responde `401`.

## 2. Contrato OpenAPI completo

- [x] 2.1 Centralizar en `src/docs/openapi.js` las respuestas reutilizables `Error`, validación, autenticación, autorización, no encontrado, conflicto, límite e interno, y el esquema `cookieAuth` con `name` tomado de `env.cookie.name`; verificar que todas las referencias `$ref` resuelvan y que el documento cargue sin error.
- [x] 2.2 Completar la documentación de los 3 endpoints de autenticación con `requestBody`, cabecera `Set-Cookie`, roles implícitos y respuestas `200`/`201`/`400`/`401`/`409`/`429`/`500` según corresponda; verificar contra `src/routes/auth-routes.js` que no falte método ni código aplicable.
- [x] 2.3 Completar `POST /api/usuarios/medicos` y los 4 endpoints de lugares con parámetros de `req.params`, `req.query` de paginación, cuerpo JSON, roles y respuestas `400`/`401`/`403`/`404`/`409`/`429`/`500` según corresponda; verificar contra `src/routes/usuarios-routes.js` y `src/routes/lugares-routes.js`.
- [x] 2.4 Completar los 4 endpoints de disponibilidad con `medicoId`/`bloqueId`, `fecha`, reglas de solapamiento y duración, bloqueo por turnos reservados y respuestas `400`/`401`/`403`/`404`/`409`/`429`/`500`; verificar contra `src/routes/disponibilidad-routes.js`.
- [x] 2.5 Completar los 4 endpoints de turnos con filtros de `fecha`, `estado`, `medicoId`, `pacienteId`, `page` y `limit`, reglas de propiedad, conflicto por `slotActivoKey` y cancelación; verificar contra `src/routes/turnos-routes.js` y el capability `gestion-turnos`.
- [x] 2.6 Documentar `GET /api-docs` como operación pública de la tag Documentación con respuesta HTML y códigos `429`/`500`; verificar que Swagger UI muestre la operación junto al resto del contrato.
- [x] 2.7 Revisar esquemas y ejemplos para excluir `passwordHash`, JWT, cookies completas y secretos; verificar con búsqueda en `src/docs/openapi.js` y con la respuesta de `/api/auth/login` que el token no figure en el cuerpo documentado.

## 3. README reproducible y defendible

- [x] 3.1 Reescribir las secciones de requisitos, clonación, `npm install`, copia de `.env` y tabla completa de variables con valores ilustrativos; verificar que cada variable de `OBLIGATORIAS` en `src/config/env.js`, más `COOKIE_SECURE`, `COOKIE_PATH` y `ADMIN_*`, aparezca en el README.
- [x] 3.2 Documentar creación de base MySQL, `npm run migrate`, creación del administrador con `src/scripts/crear-admin.js`, `npm run dev`, `npm start` y URL de Swagger; verificar que los comandos coincidan con `package.json`, `migrations/` y `src/scripts/`.
- [x] 3.3 Reemplazar las tablas tabuladas por tablas Markdown y publicar el resumen de los 16 endpoints con método, ruta, acceso y códigos; verificar que el inventario del README coincida con los paths de `src/docs/openapi.js`.
- [x] 3.4 Actualizar los ejemplos `curl` para cubrir registro, login con cookie, logout, alta de médico, lugar, bloque, disponibilidad, reserva, listado filtrado, detalle y cancelación; verificar que cada comando use rutas y campos existentes en las rutas y esquemas.
- [x] 3.5 Reordenar y completar reglas de negocio, zona horaria, concurrencia, cancelación, paginación y arquitectura por capa con responsabilidad de `config`, `middlewares`, `routes`, `controllers`, `services`, `models`, `docs` y justificación oral; verificar que no haya contradicciones con `AGENTS.md` ni con las specs de dominio.
- [x] 3.6 Verificar formato final del README con encabezados numerados consistentes, tablas renderizables y bloques de código cerrados; verificar que no queden líneas sueltas con columnas separadas por tabulación.

## 4. Alineación de variables de entorno

- [x] 4.1 Actualizar `.env.example` para que contenga todas las variables obligatorias y opcionales usadas por `src/config/env.js` y por `src/scripts/crear-admin.js`, con valores ilustrativos y sin credenciales reales; verificar comparando nombres y que `JWT_SECRET` quede vacío o reemplazable.
- [x] 4.2 Añadir al README la explicación de `COOKIE_SECURE`, `COOKIE_PATH`, `COOKIE_SAME_SITE`, `COOKIE_MAX_AGE_MS`, `AUTH_RATE_LIMIT_MAX` y `ADMIN_*`; verificar que cada nombre coincida exactamente con `.env.example`.

## 5. Verificación integral

- [x] 5.1 Comparar las rutas registradas en `src/routes/*.js` contra los paths y métodos de `src/docs/openapi.js`; verificar 12 paths de dominio, 16 operaciones REST y 1 operación de documentación, sin operaciones faltantes ni sobrantes.
- [x] 5.2 Cargar el documento OpenAPI desde Node con un script temporal sin dependencias nuevas y comprobar que no hay `$ref` roto, que `cookieAuth` existe y que `paths` no está vacío; verificar salida exitosa.
- [x] 5.3 Ejecutar una prueba de humo del servidor con variables de entorno temporalmente válidas y confirmar `GET /api-docs` → `200`, `GET /api/turnos` sin cookie → `401` y `GET /ruta-inexistente` → `404` JSON; verificar que no se registren secretos en los logs.
- [x] 5.4 Ejecutar `node --check` sobre `src/app.js`, `src/config/swagger.js` y `src/docs/openapi.js`, y buscar violaciones de ESM en `src`; verificar 0 errores y 0 usos de `require(` o `module.exports`.
- [x] 5.5 Revisar `git diff --stat` y `git status --short` para confirmar que solo cambiaron los archivos previstos de configuración, documentación y entorno; verificar que no se incluyó `.env`, cookies ni credenciales.

## Workflow follow-up

- Sincronizar el capability `documentacion-api` a `openspec/specs/` durante el archive, cuando la revisión esté aprobada.
- Archivar el cambio una vez verificada la implementación.
