# Proposal

## Why

El repositorio ya cuenta con dependencias, carpetas vacías y un `.env.example`, pero todavía no define ni implementa los comportamientos base de la API: arranque ESM, configuración validada, seguridad HTTP, logging y respuestas de error consistentes. Sin esta base, los módulos posteriores (autenticación, disponibilidad y turnos) no tienen un contrato común sobre el cual apoyarse y cada uno terminaría resolviendo estas cuestiones por su cuenta.

## What Changes

- Definir el comportamiento obligatorio de ESM estricto (`"type": "module"`, solo `import`/`export`) para todo el código del proyecto.
- Definir la carga de variables de entorno desde `.env`, la validación de variables críticas al iniciar y el contenido de `.env.example` sin credenciales reales.
- Definir la configuración base de Express: `helmet()` y limitación de tasa global, más un limitador más estricto reservado para futuras rutas de autenticación.
- Definir logging estructurado con `pino` en reemplazo de `console.log`, con reglas explícitas de datos que nunca deben registrarse.
- Definir el middleware de ruta no encontrada (404) y el middleware global de errores `(err, req, res, next)` con respuestas JSON normalizadas por tipo de error.
- Establecer la estructura de carpetas `src/config`, `src/middlewares`, `src/routes`, `src/controllers`, `src/services`, `src/models` y `src/docs` como límite de responsabilidades.
- No incluir lógica de negocio de turnos, modelos de dominio ni endpoints de autenticación/disponibilidad en este cambio.

## Capabilities

### New Capabilities

- `runtime-config-esm`: arranque del servidor en ESM estricto, carga y validación de variables de entorno y una estructura de carpetas por responsabilidades.
- `seguridad-http-base`: cabeceras de seguridad HTTP con `helmet` y limitación de tasa global y específica para autenticación.
- `observabilidad-pino`: logging estructurado con `pino`, niveles configurables y prohibición explícita de registrar secretos.
- `manejo-errores-api`: formato JSON de respuestas de error, middleware 404 y normalización centralizada de errores de validación, autenticación, autorización, límite de tasa, conflictos y errores inesperados.

### Modified Capabilities

- Ninguna: no existen specs previas en el proyecto.

## Impact

- Código nuevo en `src/config`, `src/middlewares`, `src/routes`, `src/controllers`, `src/services`, `src/models`, `src/docs`, `src/app.js` y `src/server.js`.
- Archivos de configuración: `.env.example`, `package.json` (scripts de arranque/desarrollo) y `.gitignore` (exclusión de `.env`).
- Dependencias ya presentes que se comienzan a utilizar: `express`, `dotenv`, `helmet`, `express-rate-limit`, `pino`.
- No se modifica el contrato REST de dominio ni se agregan endpoints de negocio en este cambio.
