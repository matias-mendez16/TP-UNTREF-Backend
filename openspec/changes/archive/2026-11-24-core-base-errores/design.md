# Design

## Context

Ver `proposal.md` para la motivación. El repositorio ya tiene `package.json` con `"type": "module"` y las dependencias declaradas, un `.env.example` parcial, `.gitignore` que excluye `.env`, las carpetas `src/config`, `src/middlewares`, `src/routes`, `src/controllers`, `src/services`, `src/models` y `src/docs` vacías, y ningún spec en `openspec/specs/`. No hay base de datos configurada ni rutas que preservar, por lo que el cambio puede definir el esqueleto sin migración de datos.

## Goals / Non-Goals

**Goals:**

- Dejar un punto de entrada único y una aplicación Express configurada antes de cualquier módulo de dominio.
- Centralizar configuración, logging, seguridad HTTP y errores en `src/config` y `src/middlewares`.
- Hacer que la ausencia de configuración crítica falle tempranamente y con un mensaje accionable.
- Mantener el formato JSON de errores ya definido para que los próximos módulos solo propaguen errores etiquetados.

**Non-Goals:**

- Modelos Sequelize, migraciones, seeders ni conexión efectiva a MySQL.
- Registro, login, JWT, cookies emitidas ni control de roles.
- Endpoints de lugares, bloques, disponibilidad ni turnos.
- Swagger y README completos (se documentan cuando exista contrato REST de dominio).
- Storage externo para el limitador de tasa ni despliegue multiinstancia.

## Decisions

### 1. Separar `app.js` de `server.js`

`src/app.js` construye y exporta la aplicación Express sin abrir puertos; `src/server.js` carga el entorno, obtiene la aplicación y gestiona `listen` y las señales de cierre.

- **Alternativa considerada:** un único `index.js` que configura y escucha.
- **Rationale:** separar permite verificar middlewares con herramientas HTTP sin levantar un servidor real y mantiene el arranque como única responsabilidad de `server.js`.

### 2. Configuración centralizada y validada en `src/config/env.js`

`dotenv.config()` se ejecuta una sola vez y el módulo exporta un objeto normalizado: números convertidos desde texto, `NODE_ENV` validado y valores derivados para cookies. Si falta una variable crítica se lanza un error que nombra la variable.

Variables críticas: `PORT`, `NODE_ENV`, `LOG_LEVEL`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_NAME`, `COOKIE_SAME_SITE`, `COOKIE_MAX_AGE_MS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`.

- **Alternativa considerada:** leer `process.env` directamente en cada módulo.
- **Rationale:** evitar duplicación, conversiones inconsistentes y fallos en tiempo de ejecución; el checklist de variables coincide con `.env.example`.

### 3. `COOKIE_SECURE` y `COOKIE_PATH` como variables nuevas en `.env.example`

`AGENTS.md` exige `secure: true` en producción y `path` explícito al crear y borrar la cookie, pero la plantilla actual solo tiene nombre, `sameSite` y `maxAge`. Se agregan `COOKIE_SECURE` y `COOKIE_PATH` con valores ilustrativos; `httpOnly` queda fijo en `true` en código y no es configurable.

- **Alternativa considerada:** derivar `secure` solo de `NODE_ENV` y dejar `path` por defecto.
- **Rationale:** la configuración de emisión y borrado debe ser idéntica y explícita; Agregar dos variables operativas no cambia ninguna regla de negocio.

### 4. Logger singleton en `src/config/logger.js`

Se exporta una instancia de `pino` con `level` desde `LOG_LEVEL`. El logger no recibe request completo: solo metadatos controlados (`method`, `path`, `status`, `code`). Se configuran reglas de redacción para nombres de campos sensibles como `password`, `passwordHash`, `token`, `cookie` y `authorization`.

- **Alternativa considerada:** `console.log` / `console.error`.
- **Rationale:** `pino` produce JSON estructurado, permite filtrar por nivel y centraliza la redacción; cumple la restricción de no registrar secretos.

### 5. Cabeceras y limitación en `src/app.js` y `src/middlewares/rate-limit.js`

`helmet()` se monta globalmente antes de cualquier ruta. El limitador global usa `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX`; el limitador de autenticación usa `AUTH_RATE_LIMIT_MAX` y se exporta para aplicarse cuando se creen las rutas `auth`, sin mount activo en este cambio.

- **Alternativa considerada:** aplicar el limitador estricto a un prefijo `/api/auth` que todavía no existe.
- **Rationale:** una ruta inexistente no debe cambiar el comportamiento de las demás; dejar el limitador listo evite duplicarlo en el módulo de autenticación.

### 6. Errores etiquetados y un único manejador global

`src/middlewares/error-handler.js` exporta una fábrica de errores HTTP con `status` y `code`, el middleware 404 y el manejador de firma `(err, req, res, next)`. El manejador decide el estado según `err.status`/`err.code`, registra el error con `pino` y responde con `{ success: false, error: { code, message } }`. En producción, los errores `500` usan un mensaje genérico.

- **Alternativa considerada:** lanzar errores nativos y comparar mensajes en el manejador.
- **Rationale:** los códigos estables evitan acoplamiento a textos y permiten que futuros servicios solo lancen errores con `status` y `code`.

### 7. Orden de middlewares

El orden es: `helmet()` → limitador global → middlewares de aplicación (sin rutas de negocio aún) → middleware 404 → manejador global de errores. El manejador de errores va al final porque Express lo reconoce por su aridad de cuatro argumentos.

## Risks / Trade-offs

- [El store del limitador está en memoria] → Con una sola instancia es suficiente; si se escala a varias réplicas, se documentará la necesidad de un store compartido fuera de este cambio.
- [Proxy inverso puede ocultar la IP real] → No se confiará en `X-Forwarded-For` sin configuración explícita de `trust proxy`; se documentará al desplegar detrás de proxy.
- [Redacción de `pino` puede no cubrir un campo sensible nuevo] → No se registrarán `req.body`, `req.headers` completos ni cookies; solo metadatos controlados.
- [Validación estricta de entorno puede impedir el arranque en desarrollo] → `.env.example` enumera todas las variables y el error nombra la variable faltante.
- [Express 5 + librerías instaladas] → Las versiones ya están fijadas en `package-lock.json`; la verificación se hace con el entorno instalado, sin agregar dependencias.

## Migration Plan

No hay esquema ni datos que migrar. La secuencia es: actualizar `.env.example`, crear los módulos de configuración y logging, crear los middlewares, ensamblar `app.js` y `server.js`, ajustar scripts de `package.json`, y verificar arranque, 404, `429` y ausencia de secretos en logs. El rollback consiste en revertir los archivos nuevos; no afecta datos persistentes.
