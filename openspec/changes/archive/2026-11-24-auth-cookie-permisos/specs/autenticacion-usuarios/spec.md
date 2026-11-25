# Spec Delta: autenticacion-usuarios

## Purpose

Define el comportamiento observable del alta de identidades del turnero: quién puede crear cada tipo de usuario, qué datos se validan, cómo se protege la contraseña y qué información puede devolverse al cliente.

## ADDED Requirements

### Requirement: Registro público de pacientes

El sistema MUST permitir que un visitante cree una cuenta con rol `paciente` a partir de `nombre`, `email` y `password`. El servicio MUST ignorar cualquier `rol` enviado por el cliente, crear el usuario activo y responder `201` con `id`, `nombre`, `email` y `rol`.

#### Scenario: Registro válido

- **WHEN** un visitante envía nombre, email y contraseña válidos a `POST /api/auth/register`
- **THEN** se crea un usuario con rol `paciente` y `activo = true`, y la respuesta es `201` sin `passwordHash`

#### Scenario: Rol manipulado en el registro

- **WHEN** el cuerpo del registro incluye `rol: "admin"` o `rol: "medico"`
- **THEN** el usuario creado conserva el rol `paciente`

#### Scenario: Email ya registrado

- **WHEN** se intenta registrar un email que ya existe
- **THEN** la respuesta es `409` con el formato JSON estándar de error

### Requirement: Validación de datos de identidad

El sistema MUST validar y normalizar los datos recibidos antes de crear credenciales. `nombre` MUST ser no vacío, `email` MUST tener formato válido y `password` MUST tener entre 8 y 72 caracteres con al menos una letra y un dígito. Los datos inválidos MUST responderse con `400`.

#### Scenario: Nombre vacío

- **WHEN** se envía un nombre vacío o compuesto solo por espacios
- **THEN** la respuesta es `400` y no se crea el usuario

#### Scenario: Email con formato inválido

- **WHEN** se envía un email sin formato de dirección válido
- **THEN** la respuesta es `400` y no se crea el usuario

#### Scenario: Contraseña que no cumple la política

- **WHEN** se envía una contraseña con menos de 8 caracteres, más de 72 o sin letras o sin dígitos
- **THEN** la respuesta es `400` y no se crea el usuario

#### Scenario: Credenciales de inicio incompletas

- **WHEN** se llama a `POST /api/auth/login` sin email o sin contraseña
- **THEN** la respuesta es `400` con un error de validación

### Requirement: Protección de la contraseña almacenada

El sistema MUST almacenar la contraseña únicamente como un hash irreversible y MUST NO persistir ni devolver texto plano. Ninguna respuesta JSON MUST incluir `passwordHash`, aun en altas correctas o errores.

#### Scenario: Usuario creado correctamente

- **WHEN** se crea un paciente con una contraseña válida
- **THEN** la fila persistida contiene un hash de esa contraseña y no el texto plano

#### Scenario: Respuesta de alta

- **WHEN** se inspecciona el cuerpo de una respuesta de registro o de alta de médico
- **THEN** no aparece `password`, `passwordHash` ni otro campo equivalente

### Requirement: Inicio de sesión por credenciales

El sistema MUST autenticar comparando la contraseña recibida con el hash almacenado. Con credenciales válidas MUST responder `200` con los datos básicos del usuario; con credenciales inválidas o usuario inactivo MUST responder `401` con un mensaje genérico que no revele qué dato falló.

#### Scenario: Credenciales válidas

- **WHEN** un usuario activo envía su email y contraseña correctos a `POST /api/auth/login`
- **THEN** la respuesta es `200` e incluye `id`, `nombre`, `email` y `rol`

#### Scenario: Contraseña incorrecta

- **WHEN** se envía un email existente con una contraseña incorrecta
- **THEN** la respuesta es `401` con un mensaje genérico

#### Scenario: Email inexistente

- **WHEN** se envía un email no registrado
- **THEN** la respuesta es `401` con el mismo mensaje genérico que para contraseña incorrecta

#### Scenario: Usuario inactivo

- **WHEN** un usuario desactivado intenta iniciar sesión con credenciales correctas
- **THEN** la respuesta es `401`

### Requirement: Alta de médicos restringida a administración

El sistema MUST permitir la creación de cuentas con rol `medico` únicamente a usuarios autenticados con rol `admin`. La operación MUST crear el `Usuario` y su perfil `Medico` como una sola unidad atómica y MUST responder `201` con `id`, `nombre`, `email`, `rol` y `medicoId`.

#### Scenario: Administrador crea un médico

- **WHEN** un administrador autenticado envía nombre, email, contraseña, especialidad y matrícula válidos
- **THEN** se crean el usuario con rol `medico` y su perfil, y la respuesta es `201` sin `passwordHash`

#### Scenario: Paciente intenta crear un médico

- **WHEN** un paciente autenticado llama a `POST /api/usuarios/medicos`
- **THEN** la respuesta es `403` y no se crea ningún usuario

#### Scenario: Médico intenta crear otro médico

- **WHEN** un médico autenticado llama a `POST /api/usuarios/medicos`
- **THEN** la respuesta es `403` y no se crea ningún usuario

#### Scenario: Matrícula duplicada

- **WHEN** un administrador envía una matrícula ya existente con un email nuevo
- **THEN** la respuesta es `409` y no queda creado el usuario nuevo

#### Scenario: Email duplicado en alta de médico

- **WHEN** un administrador envía un email ya existente con una matrícula nueva
- **THEN** la respuesta es `409` y no queda creado el perfil médico
