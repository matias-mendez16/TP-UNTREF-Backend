# Design: auth-cookie-permisos

## Context

Ver `proposal.md` para la motivación. El proyecto ya valida variables de entorno, expone `env.jwt` y `env.cookie`, tiene `helmet`, limitadores global y de autenticación, logger Pino redactado, manejador 404/errores y modelos `Usuario`/`Medico` con unicidades. `src/routes`, `src/controllers`, `src/services` y `src/middlewares` están vacíos; `src/app.js` aún no registra `cookie-parser`. No hay migración nueva: la base ya soporta `email` y `matricula` únicos.

## Goals / Non-Goals

**Goals:**

- Mantener la separación por capas con lógica de negocio en servicios y decisiones de acceso en middlewares reutilizables.
- Implementar el módulo usando solo dependencias ya declaradas en `package.json`.
- Producir respuestas y errores compatibles con el contrato JSON existente.
- Dejar helpers de autorización listos para los módulos de disponibilidad y turnos.

**Non-Goals:**

- Administración CRUD genérica de usuarios.
- Alta inicial de administrador mediante endpoint público; se resuelve con una operación controlada de base y se documenta, sin ampliar el contrato REST.
- Revocación criptográfica de JWT mediante blacklist o rotación de secretos.
- Token CSRF de doble envío ni cambio del contrato del cliente.
- Endpoints de lugares, bloques, disponibilidad o turnos.

## Decisions

### ESM y separación por capas

Las rutas declaran paths, middlewares y contratos Swagger; los controladores solo leen/validan entradas y devuelven respuestas; los servicios contienen hashes, transacciones, consultas y reglas. Los middlewares agrupan autenticación, roles y propiedad.

*Alternativa descartada:* concentrar consultas y reglas en rutas o controladores. Se rechaza porque rompe `AGENTS.md`, dificulta reutilización y es difícil de defender en una revisión oral.

### Hash de contraseñas con bcryptjs

Se usa `bcryptjs` para derivar `passwordHash` antes de persistir y `compare` para validar login. La política se aplica en validación: 8-72 caracteres, al menos una letra y un dígito. El límite superior evita el truncamiento de bcrypt más allá de 72 bytes.

*Alternativa descartada:* guardar contraseñas cifradas o en texto plano. No cumple la consigna y expone credenciales. Tampoco se incorpora `scrypt` nativo porque agregaría otra curva de complejidad sin beneficio académico frente a la librería ya instalada.

### JWT en cookie HTTPOnly

El token se firma con `JWT_SECRET`, usa `JWT_EXPIRES_IN` y lleva `{ id, rol, medicoId }`. `medicoId` se resuelve en backend desde `Medico.usuarioId`; para paciente y admin es `null`. La cookie se crea con `httpOnly: true`, `sameSite`, `path` y `maxAge` desde `env.cookie`, y `secure` según entorno. El borrado reutiliza exactamente la misma configuración.

*Alternativa descartada:* `Authorization: Bearer` o almacenamiento en `localStorage`. Queda expuesto a XSS o contradice el requisito de cookie HTTPOnly.

### Alta de médico como transacción

El servicio valida datos, calcula el hash fuera de la transacción para no mantenerla abierta durante CPU, y dentro de `iniciarTransaccion()` crea `Usuario` con rol `medico` y luego `Medico`. Las unicidades de BD son la garantía final ante concurrencia; cualquier duplicado se traduce a `409` y la transacción se revierte.

*Alternativa descartada:* crear usuario y perfil en dos operaciones separadas. Podría dejar un usuario médico sin perfil si falla el segundo insert.

### Autenticación y autorización en middlewares

`authenticate` lee la cookie configurada, verifica firma y expiración y expone la identidad validada para el resto del pipeline. `authorizeRoles` verifica el rol de la sesión. Las comprobaciones de propiedad se implementan como middlewares/fábricas reutilizables que comparan la identidad de la sesión con `pacienteId` o `medicoId` del recurso. Todas se montan después de `authenticate` y antes del controlador.

*Alternativa descartada:* repetir condicionales de rol y propiedad en cada controlador. Generaría divergencias y permitiría olvidar verificaciones en módulos futuros.

### Errores y logging

Se lanzan `HttpError` de `400`, `401`, `403` y `409` y se deja que `manejadorErrores` produzca la respuesta estándar. Login usa el mismo mensaje para email inexistente, contraseña incorrecta y usuario inactivo. No se registran cookies, tokens, contraseñas ni hashes; el logger existente ya redacta esos paths.

*Alternativa descartada:* responder errores dentro de cada servicio o incluir el motivo exacto del fallo de credenciales. Rompe uniformidad y permite enumeración de usuarios.

### Mitigación CSRF sin nueva dependencia

La sesión se protege con `SameSite` explícito, `HttpOnly` y `Secure` en producción, apoyándose en el comportamiento del navegador para bloquear envíos cross-site. No se agrega un token CSRF porque cambiaría el contrato del cliente y requeriría una dependencia o un endpoint adicional no previsto en la skill.

*Alternativa descartada:* doble submit CSRF. Se rechaza por alcance; si se requiere para un frontend cross-site, debe aprobarse como cambio separado.

### Limiting y ensamblado

`cookie-parser` se registra antes de las rutas. `limitadorAutenticacion` se monta solo en auth; el limitador global permanece en todo el servidor. Los routers se registran antes de `middleware404`.

*Alternativa descartada:* aplicar el umbral estricto a todas las rutas. Penalizaría consultas públicas y violaría la spec base de seguridad HTTP.

## Risks / Trade-offs

- **Cookie mitigada con SameSite pero sin token CSRF** → Mantener `SameSite` y `Secure` configurados y documentar la limitación; cualquier frontend cross-site requiere decisión aprobada.
- **Logout no revoca JWT ya emitido** → La cookie se elimina y el token expira por `JWT_EXPIRES_IN`; documentar explícitamente en README y Swagger.
- **`medicoId` del token puede quedar desactualizado** → Se resuelve al login; cambios de perfil futuros exigirán nuevo inicio de sesión o una política de refresco aprobada por separado.
- **Concurrencia en alta de médicos** → Unicidad real de `email`, `matricula` y `usuarioId` en MySQL, con conversión de duplicados a `409`.
- **Límite de tasa en memoria** → Aceptable para una instancia; si se escala a múltiples procesos, migrar la política a un store compartido en otro cambio.
- **bcrypt trunca entradas largas** → Validación de longitud máxima 72 en registro y alta de médicos.

## Migration Plan

1. Verificar que `.env` contiene todas las variables ya declaradas y ejecutar `npm run migrate` para confirmar esquema vigente.
2. Incorporar los archivos de rutas, controladores, servicios y middlewares, y ajustar `src/app.js`.
3. Actualizar Swagger y README con los cuatro endpoints, la cookie y las reglas de roles.
4. Reiniciar el servidor y verificar registros, login, cookie, autorización y errores con solicitudes controladas.
5. Rollback: revertir los cambios de código y documentación; no hay cambios de esquema ni datos que revertir. Los tokens emitidos dejan de ser aceptados al retirar el módulo.
