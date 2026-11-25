# sesion-cookie-jwt Specification

## Purpose

Define cómo el turnero transporta, verifica y retira la sesión de un usuario mediante un JWT en cookie HTTPOnly, con atributos explícitos y sin exponer secretos al cliente.

## Requirements

### Requirement: Sesión transportada en cookie HTTPOnly

El sistema MUST emitir el JWT de sesión en una cookie con `httpOnly: true`. La cookie MUST usar `sameSite`, `path` y `maxAge` definidos en la configuración, y `secure` MUST ser `true` en producción. El cuerpo JSON de las respuestas MUST NO contener el token.

#### Scenario: Inicio de sesión correcto

- **WHEN** un usuario válido inicia sesión
- **THEN** la respuesta incluye una cookie de sesión con `HttpOnly` y no incluye el JWT en su cuerpo

#### Scenario: Atributos de la cookie

- **WHEN** se inspeccionan los atributos de la cookie emitida
- **THEN** `SameSite`, `Path` y `Max-Age` reflejan la configuración declarada y no son valores implícitos del framework

#### Scenario: Entorno de producción

- **WHEN** una sesión se emite con el entorno de producción
- **THEN** la cookie se emite con la bandera `Secure`

#### Scenario: Token alternativo ignorado

- **WHEN** un cliente envía un token en el cuerpo, en la query o en una cabecera distinta de la cookie configurada
- **THEN** ese valor no se usa para autenticar la solicitud

### Requirement: Contenido mínimo del token

El JWT MUST identificar al usuario con `id`, `rol` y `medicoId`, derivados exclusivamente del backend. `medicoId` MUST ser `null` cuando el usuario no tiene perfil médico. El payload MUST NO contener contraseñas, hashes ni secretos de configuración.

#### Scenario: Sesión de paciente

- **WHEN** se inspecciona el payload del token emitido para un paciente
- **THEN** contiene su `id`, `rol: "paciente"` y `medicoId: null`

#### Scenario: Sesión de médico

- **WHEN** se inspecciona el payload del token emitido para un médico
- **THEN** contiene su `id`, `rol: "medico"` y el `medicoId` resuelto desde su perfil

#### Scenario: Datos sensibles ausentes

- **WHEN** se inspecciona el payload del token
- **THEN** no aparece `password`, `passwordHash`, `JWT_SECRET` ni ningún secreto

### Requirement: Verificación de vigencia en cada solicitud protegida

El sistema MUST verificar la firma y la expiración del JWT en cada solicitud protegida. Un token ausente, modificado, mal formado o vencido MUST producir `401` antes de ejecutar cualquier lógica de autorización o de dominio.

#### Scenario: Token vencido

- **WHEN** se envía una cookie con un JWT cuya fecha de expiración ya pasó
- **THEN** la respuesta es `401` y la operación solicitada no se ejecuta

#### Scenario: Token modificado

- **WHEN** se envía una cookie con un JWT cuya firma no coincide
- **THEN** la respuesta es `401`

#### Scenario: Token ausente

- **WHEN** se solicita una ruta protegida sin cookie de sesión
- **THEN** la respuesta es `401`

### Requirement: Cierre de sesión

El sistema MUST permitir cerrar sesión mediante `POST /api/auth/logout`, responder `200` y eliminar la cookie usando los mismos atributos de `SameSite`, `Path` y `Secure` empleados al crearla. Después del cierre, una solicitud protegida que dependa de esa cookie MUST ser rechazada con `401`.

#### Scenario: Logout correcto

- **WHEN** un usuario autenticado envía `POST /api/auth/logout`
- **THEN** la respuesta es `200` y la cookie de sesión queda eliminada

#### Scenario: Coincidencia de atributos al eliminar

- **WHEN** se comparan los atributos de creación y eliminación de la cookie
- **THEN** `SameSite`, `Path` y `Secure` coinciden

#### Scenario: Solicitud posterior

- **WHEN** se realiza una solicitud protegida después del logout sin reenviar una cookie válida
- **THEN** la respuesta es `401`
