---
name: turnero-auth-cookie-permisos
description: Implementa registro de pacientes, alta de médicos por admin, encriptación con bcryptjs, emisión de JWT en cookie HTTPOnly y middlewares de autenticación, control de roles y validación de propiedad de recursos.
---

# Autenticación, Cookie HTTPOnly y Autorización

Skill para gestionar identidades, contraseñas seguras y permisos por rol (`paciente`, `medico`, `admin`) cumpliendo con almacenamiento de JWT en cookie `HTTPOnly` para mitigar ataques XSS.

## Cuándo usarla
- Vas a implementar `register`, `login`, `logout` o el alta de médicos por parte de un administrador.
- Necesitás crear o revisar los middlewares `authenticate` (lectura de cookie JWT), `authorizeRoles` y verificación de propiedad (`ownership`).

## Pasos del flujo de trabajo

1. **Seguridad de contraseñas (`bcryptjs`)**:
   - Hashear contraseñas con `bcryptjs` antes de crear usuarios; nunca guardar ni devolver `passwordHash` en las respuestas JSON.

2. **Endpoints de identidad y alta de usuarios**:
   - `POST /api/auth/register`: auto-registro exclusivo con rol `paciente`.
   - `POST /api/auth/login`: valida credenciales, firma JWT con `{ id, rol, medicoId }` y lo envía mediante `res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: ... })`.
   - `POST /api/auth/logout`: limpia la cookie de sesión (`res.clearCookie`).
   - `POST /api/usuarios/medicos`: protegido para rol `admin`; crea atómicamente el `Usuario` con rol `medico` y su perfil en `Medico`.

3. **Middlewares de autenticación y permisos**:
   - `authenticate`: extrae el token de `req.cookies[COOKIE_NAME]`, verifica firma JWT y adjunta `req.user` (responde `401` si falta o expiró).
   - `authorizeRoles(...roles)`: restringe acceso según el rol en `req.user.rol` (responde `403` si no corresponde).
   - Helpers/middlewares de propiedad para asegurar que cada usuario opere solo sobre sus propios recursos salvo que sea `admin`.

4. **Registro en OpenSpec**:
   - Documentar los contratos y casos borde (`401`, `403`, email duplicado `409`) en OpenSpec antes de cerrar el cambio.
  
   Usando el flujo SDD de OpenSpec y la skill turnero-auth-cookie-permisos, creá la especificación e implementación del módulo de autenticación y autorización.

## Requisitos:

- Hash de contraseñas con bcryptjs en registro y alta de usuarios; verificación segura en login.
- Emisión de JWT almacenado en cookie HTTPOnly en login y limpieza de cookie en logout.
- Endpoints: POST /api/auth/register (solo rol paciente), POST /api/auth/login, POST /api/auth/logout y POST /api/usuarios/medicos (solo rol admin, crea Usuario con rol medico y su perfil Medico).
- Middlewares de autenticación (lee y valida cookie HTTPOnly) y autorización por rol (paciente, medico, admin) y propiedad de recurso.