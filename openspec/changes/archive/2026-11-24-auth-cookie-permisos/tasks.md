# Tasks: auth-cookie-permisos

## 1. Preparación del pipeline y validación

- [x] 1.1 Registrar `cookie-parser` en `src/app.js` antes de los routers y verificar que `GET /ruta-inexistente` continúa devolviendo `404` con cuerpo JSON estándar.
- [x] 1.2 Crear la utilidad ESM de validación y normalización de `nombre`, `email`, `password`, `especialidad` y `matricula`, y verificar con un script directo que los casos válidos pasan y los inválidos producen `400`.
- [x] 1.3 Crear la utilidad de serialización de usuario y verificar que `password`, `passwordHash` y tokens nunca aparecen en su salida.

## 2. Registro, login y sesión en cookie

- [x] 2.1 Implementar el servicio de registro con hash `bcryptjs` y verificar contra MySQL que la fila persisted contiene un hash y no la contraseña en texto plano.
- [x] 2.2 Implementar `POST /api/auth/register` con su controlador, ruta y `limitadorAutenticacion`, y verificar respuestas `201`, `400` y `409` con el formato JSON existente.
- [x] 2.3 Implementar el servicio de login y verificar `200` con credenciales correctas y `401` con mensaje idéntico para email inexistente, contraseña incorrecta y usuario inactivo.
- [x] 2.4 Implementar emisión de JWT en cookie HTTPOnly y verificar `Set-Cookie` con `HttpOnly`, `SameSite`, `Path`, `Max-Age` y `Secure` según entorno, sin token en el cuerpo JSON.
- [x] 2.5 Implementar `POST /api/auth/logout` y verificar que borra la cookie con atributos coincidentes y que una solicitud protegida posterior sin cookie responde `401`.
- [x] 2.6 Documentar `register`, `login` y `logout` en Swagger y verificar que `/api-docs` enumera los tres endpoints con sus códigos de respuesta.

## 3. Alta de médicos por administrador

- [x] 3.1 Documentar el bootstrap controlado del primer administrador y verificar que permite obtener un admin de prueba sin exponer un endpoint público.
- [x] 3.2 Implementar el servicio transaccional que crea `Usuario` con rol `medico` y su perfil `Medico`, y verificar con rollback que email o matrícula duplicados no dejan filas parciales.
- [x] 3.3 Implementar `POST /api/usuarios/medicos` con control y ruta restringidos a `admin`, y verificar `201` para admin y `403` para paciente y médico.
- [x] 3.4 Documentar el endpoint en Swagger y verificar que la respuesta de ejemplo no contiene `passwordHash`.

## 4. Autenticación y autorización reutilizables

- [x] 4.1 Implementar el middleware que verifica firma y expiración del JWT y expone la identidad validada, y verificar `401` para cookie ausente, inválida, modificada y vencida.
- [x] 4.2 Implementar el middleware de roles y verificar que el alta de médicos solo se autoriza para `admin` y la gestión de disponibilidad para `medico` o `admin`.
- [x] 4.3 Implementar verificaciones de propiedad para `pacienteId` y `medicoId`, y verificar `403` para recursos ajenos y autorización para recursos propios y de administrador.
- [x] 4.4 Verificar que `id`, `rol`, `medicoId` y propiedad enviados en body, query o params no amplían permisos ni sustituyen la identidad de la sesión.

## 5. Integración, errores y documentación general

- [x] 5.1 Ensamblar los routers antes de `middleware404` y verificar que `limitadorAutenticacion` produce `429` solo en rutas de autenticación mientras las demás conservan el límite global.
- [x] 5.2 Verificar que todos los errores `400`, `401`, `403` y `409` usan el formato JSON estándar y que los registros Pino no contienen cookies, tokens, contraseñas ni hashes.
- [x] 5.3 Actualizar `README.md` con las variables JWT/cookie, los cuatro endpoints, el tratamiento de SameSite/Secure como mitigación CSRF, la no revocación del JWT tras logout y ejemplos de uso, y verificar que los comandos documentados se ejecutan.
- [x] 5.4 Ejecutar un flujo extremo a extremo de registro, login, alta de médico por admin, login del médico y acceso a una ruta protegida, verificando estados, cookie y ausencia de datos sensibles en respuestas y logs.
- [x] 5.5 Ejecutar `git diff --check`, comprobar que no existen `require(`, `module.exports` ni `console.` bajo `src/`, y verificar que `openspec validate "auth-cookie-permisos" --strict` finaliza sin errores.

## Workflow follow-up

- Sincronizar los deltas con las specs principales cuando el cambio sea aprobado.
- Archivar el cambio después de completar la revisión y verificación.
