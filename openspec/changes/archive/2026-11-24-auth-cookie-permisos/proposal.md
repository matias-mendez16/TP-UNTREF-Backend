# Proposal: auth-cookie-permisos

## Why

El proyecto ya tiene configuración, modelos, manejo de errores y limitación de tasa, pero todavía no puede identificar a quién sirve ni decidir qué operaciones le corresponden. Sin autenticación ni autorización, los futuros endpoints de disponibilidad y turnos no podrían proteger la propiedad de los recursos ni cumplir las reglas de roles del turnero.

Este cambio incorpora la identidad de pacientes, médicos y administradores antes de sumar lógica de dominio, usando las dependencias ya instaladas y sin secretos en el código.

## What Changes

- Agregar `POST /api/auth/register` para auto-registro de pacientes, con validación de campos, política mínima de contraseña y hash con `bcryptjs`.
- Agregar `POST /api/auth/login` para validar credenciales, resolver `medicoId` desde el perfil `Medico` cuando corresponda y emitir un JWT firmado.
- Agregar `POST /api/auth/logout` para eliminar la cookie de sesión con opciones idénticas a las usadas al crearla.
- Agregar `POST /api/usuarios/medicos`, restringido a `admin`, para crear en una sola transacción el `Usuario` con rol `medico` y su perfil `Medico`.
- Enviar el JWT en una cookie con `httpOnly: true`, `sameSite` y `path` configurables, `secure` automático en producción y `maxAge` definido; nunca devolver el token ni el hash en el cuerpo JSON.
- Incorporar `cookie-parser` al pipeline de Express y aplicar `limitadorAutenticacion` a las rutas de autenticación.
- Crear middlewares de autenticación y autorización que validen el JWT en cada solicitud protegida, adjunten `req.user = { id, rol, medicoId }` y apliquen reglas por rol y propiedad.
- Rechazar con `401` la ausencia, invalidez o expiración del token; rechazar con `403` un rol o una propiedad no autorizada; traducir duplicados de email o matrícula a `409`.
- Documentar los endpoints y las reglas de sesión en Swagger y en el README.
- Ajustar las specs base de seguridad HTTP y de configuración ESM para reflejar que ahora existen rutas de autenticación y que la separación por capas se conserva con lógica de negocio presente.

**Supuestos registrados:** la contraseña debe tener entre 8 y 72 caracteres y contar con al menos una letra y un dígito; el `rol` enviado por el cliente se ignora en registro público; el logout elimina la cookie pero no revoca criptográficamente un JWT ya emitido; la protección CSRF se apoya en `SameSite` explícito y `Secure` en producción, sin incorporar una nueva dependencia.

Fuera de alcance: administración genérica de usuarios, endpoints de lugares, bloques o turnos, revocación de tokens mediante blacklist y un endpoint público de bootstrap de administrador; el primer admin se obtendrá mediante una operación controlada documentada.

## Capabilities

### New Capabilities

- `autenticacion-usuarios`: registro de pacientes, alta de médicos por administrador, validación de credenciales, hashing de contraseñas y respuestas de identidad seguras.
- `sesion-cookie-jwt`: emisión, transporte y borrado de la sesión mediante JWT en cookie HTTPOnly, con configuración explícita de banderas y ausencia de secretos en respuestas.
- `autorizacion-roles-propiedad`: verificación del usuario autenticado, control por roles y comprobaciones de propiedad reutilizables por los módulos posteriores.

### Modified Capabilities

- `seguridad-http-base`: la política de limitación independiente deja de ser preventiva y pasa a aplicarse a rutas de autenticación reales.
- `runtime-config-esm`: se actualiza la descripción del estado inicial de `routes`, `controllers` y `services` para reflejar que la separación por capas continúa vigente cuando se incorporan endpoints.

## Impact

- `src/app.js`: registro de `cookie-parser`, routers de autenticación y usuarios, antes del middleware 404.
- `src/routes/`, `src/controllers/`, `src/services/`, `src/middlewares/`: nuevos archivos del módulo, respetando ESM y la separación por capas.
- `src/models/usuario.js` y `src/models/medico.js`: reutilización sin cambios de esquema; la alta de médicos usa `iniciarTransaccion()`.
- `src/config/env.js` y `.env.example`: ya contienen `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_*` y `AUTH_RATE_LIMIT_MAX`; se verifica su uso y se documenta su significado, sin agregar variables nuevas.
- `src/docs/` y `README.md`: contrato OpenAPI y guía de uso de las nuevas rutas.
- Dependencias: no se agrega ninguna; `bcryptjs`, `jsonwebtoken`, `cookie-parser` y `express-rate-limit` ya están declaradas.
- Base de datos: no requiere migración nueva; se apoya en las restricciones de unicidad ya aplicadas.
