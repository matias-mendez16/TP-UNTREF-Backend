# runtime-config-esm Specification

## Purpose

Define el contrato de arranque del backend: ejecución en módulos ESM, carga validada de configuración desde variables de entorno y una estructura de carpetas que separa responsabilidades antes de incorporar lógica de dominio.

## Requirements

### Requirement: Ejecución ESM estricta

El proyecto MUST ejecutarse como ECMAScript Module y todo su código MUST usar únicamente `import` y `export`. El proyecto MUST NOT utilizar `require` ni `module.exports`.

#### Scenario: Declaración del tipo de módulo

- **WHEN** se inspecciona `package.json`
- **THEN** contiene `"type": "module"`

#### Scenario: Archivos fuente del proyecto

- **WHEN** se inspeccionan los archivos JavaScript bajo `src/`
- **THEN** ninguno contiene `require(` ni `module.exports`

### Requirement: Estructura por responsabilidades

El código base MUST organizarse en las carpetas `config`, `middlewares`, `routes`, `controllers`, `services`, `models` y `docs` dentro de `src/`, de modo que cada capa tenga una responsabilidad diferenciada.

#### Scenario: Carpetas base disponibles

- **WHEN** se clona el proyecto y se lista `src/`
- **THEN** existen las carpetas `config`, `middlewares`, `routes`, `controllers`, `services`, `models` y `docs`

#### Scenario: Sin lógica de negocio en la base

- **WHEN** se revisa el contenido inicial de `src/routes`, `src/controllers` y `src/services`
- **THEN** no existen endpoints ni reglas de negocio de turnos, disponibilidad ni autenticación

#### Scenario: Separación con endpoints de autenticación presentes

- **WHEN** se revisan `src/routes`, `src/controllers` y `src/services` después de incorporar el módulo de autenticación
- **THEN** las rutas solo declaran endpoints y middlewares, los controladores orquestan solicitudes y respuestas, y las reglas de negocio y consultas permanecen en servicios

### Requirement: Configuración exclusivamente desde entorno

El servidor MUST tomar toda configuración sensible y operativa de variables de entorno cargadas desde `.env` (o del entorno del proceso en producción). El código fuente MUST NOT contener credenciales, secretos ni valores operativos hardcodeados.

#### Scenario: Carga de variables

- **WHEN** el proceso inicia con un archivo `.env` presente
- **THEN** la configuración expuesta al servidor refleja los valores de ese archivo

#### Scenario: Plantilla sin credenciales reales

- **WHEN** se inspecciona `.env.example`
- **THEN** contiene todas las variables requeridas con valores ilustrativos y sin credenciales reales

#### Scenario: Repository limpio

- **WHEN** se inspecciona `.gitignore`
- **THEN** `.env` está excluido del repositorio y `.env.example` permanece versionado

### Requirement: Validación de variables críticas al iniciar

Antes de abrir el puerto de escucha, el servidor MUST validar la presencia y el formato de las variables críticas. Si alguna falta o es inválida, MUST detener el inicio y emitir un mensaje que identifique la variable afectada.

#### Scenario: Variable JWT_SECRET ausente

- **WHEN** se inicia el servidor sin `JWT_SECRET`
- **THEN** el proceso no abre el puerto y el mensaje de error menciona `JWT_SECRET`

#### Scenario: Puerto inválido

- **WHEN** se inicia el servidor con `PORT` no numérico o fuera de rango
- **THEN** el proceso no abre el puerto y el mensaje de error identifica `PORT`

#### Scenario: Configuración completa

- **WHEN** todas las variables críticas están presentes y son válidas
- **THEN** el servidor continúa con la secuencia de arranque

### Requirement: Arranque y apagado controlados

El servidor MUST exponer un único punto de entrada que inicia la escucha en el puerto configurado y MUST registrar el inicio y el cierre del proceso.

#### Scenario: Inicio correcto

- **WHEN** el proceso arranca con configuración válida
- **THEN** comienza a escuchar en el `PORT` configurado y registra el evento de inicio

#### Scenario: Señal de apagado

- **WHEN** el proceso recibe una señal de terminación
- **THEN** cierra el servidor de forma ordenada y registra el evento de cierre
