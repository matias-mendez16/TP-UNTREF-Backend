# Design

## Context

Ver `proposal.md` para la motivación. Estado observado: `sequelize` y `mysql2` ya están en `package.json`, `src/config/env.js` expone `env.db` validado, `src/config/logger.js` provee logging estructurado y `src/models/` está vacío. No existe hoy ningún mecanismo de migraciones ni una instancia de conexión reutilizable. El proyecto es ESM estricto, por lo que cualquier herramienta auxiliar debe poder ejecutarse sin `require` ni `module.exports`.

## Goals / Non-Goals

**Goals:**

- Una única instancia de conexión reutilizable por los futuros servicios de dominio.
- Modelos que representen las cinco tablas con nombres `snake_case` y atributos `camelCase`.
- Asociaciones centralizadas y cargadas desde un único punto de entrada.
- Restricciones reales en MySQL para unicidad, integridad referencial, coherencia médico-lugar-bloque y slot activo.
- Migraciones ejecutables, ordenadas e idempotentes, documentadas en el README.

**Non-Goals:**

- Endpoints, JWT, roles ni validación de propiedad en este cambio.
- Cálculo de disponibilidad, generación de slots ni reserva/cancelación de turnos.
- Seeders con datos sensibles o credenciales de prueba.
- conexión automática al importar el módulo de base de datos durante el arranque HTTP actual.

## Decisions

**1. Instancia única en `src/config/database.js`.** Se crea con `new Sequelize(...)` usando `env.db`, `dialect: 'mysql'`, `timezone: '-03:00'` y `define: { underscored: true, freezeTableName: true, charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }`. Argentina no usa horario de verano desde 2009, por lo que `-03:00` fija la referencia sin depender de la zona del servidor. Se desactiva el logging de SQL de Sequelize: los `INSERT` pueden incluir `passwordHash` u otros datos sensibles. Se exporta `verificarConexion()` que llama a `authenticate()` y registra éxito o error con `logger`, sin credenciales. Alternativa descartada: loguear cada sentencia SQL, porque expondría valores sensibles.

**2. Modelos definidos con `sequelize.define`.** Cada archivo de `src/models/` define un modelo con `tableName` explícito (`usuarios`, `medicos`, `lugares_atencion`, `bloques_disponibilidad`, `turnos`), `timestamps: true` y `id` autoincremental. Los atributos se escriben en `camelCase` y `underscored: true` los mapea a columnas `snake_case`. Los ENUM y defaults se declaran tanto en el modelo como en la migración, pero la migración es la fuente de verdad de la restricción. Alternativa descartada: `sequelize.sync({ alter: true })`, prohibido por `AGENTS.md` y poco defendible en producción.

**3. Asociaciones centralizadas en `src/models/index.js`.** Se importan los cinco modelos, se invoca un método `associate(models)` de cada uno y se exporta un objeto único con modelos e instancia. El paso de `models` como parámetro evita importaciones circulares. Alternativa descartada: distribuir `belongsTo`/`hasMany` entre rutas o servicios, que duplicaría reglas y dificultaría el orden de carga.

**4. Claves foráneas restrictivas y desactivación lógica.** Todas las FK usan `ON DELETE RESTRICT` y `ON UPDATE CASCADE` cuando corresponda. Para impedir turnos incoherentes se agrega un índice único en `bloques_disponibilidad (id, medico_id, lugar_id)` y una FK compuesta desde `turnos (bloque_id, medico_id, lugar_id)`. Usuarios y bloques se desactivan con `activo = false` en lugar de borrarse. Alternativa descartada: confiar solo en la capa de servicio; no resistiría inserciones directas ni concurrencia.

**5. `slotActivoKey` como restricción de base de datos.** La columna es `VARCHAR(120) NULL` con índice `UNIQUE`. Un `CHECK` exige `(estado = 'reservado' AND slot_activo_key IS NOT NULL) OR (estado = 'cancelado' AND slot_activo_key IS NULL)`. MySQL permite varias filas con `NULL`, por lo que los turnos cancelados no bloquean una nueva reserva del mismo horario. El valor se genera en el backend con `medicoId`, `fecha` y `horaInicio` normalizada a `HH:mm`; el cliente nunca lo controla. Alternativa descartada: índice único sobre `medico_id, fecha, hora_inicio` sin columna de control, porque impediría reutilizar el slot cancelado.

**6. Migrador propio en ESM.** `src/scripts/migrate.js` lee archivos `.sql` ordenados por nombre desde `migrations/`, mantiene una tabla `migrations_aplicadas` y ejecuta solo los pendientes. `package.json` expone `npm run migrate`. Se descarta `sequelize-cli` porque su configuración habitual depende de `.sequelizerc`/`module.exports`, incompatible con el requisito ESM estricto, y porque agregaría una dependencia para una necesidad pequeña.

## Risks / Trade-offs

- **[MySQL 5.7 ignora `CHECK`]** → documentar MySQL 8 como requisito y mantener validaciones de modelo como segunda línea, sin reemplazar la restricción real.
- **[DDL de MySQL no es transaccional]** → el migrador aplica un archivo por vez y registra cada éxito; ante fallo se corrige con una migración nueva hacia adelante, no con rollback automático.
- **[Normalización de `horaInicio`]** → centralizar el formato `HH:mm` en un único utilitario del módulo de turnos; probar que `09:30:00` y `09:30` generan la misma clave.
- **[FK compuesta rígida]** → es intencional: evita turnos con lugar ajeno al médico; los futuros servicios deben crear bloques y turnos con el triple coherente.
- **[Conexión no automática]** → los módulos que dependan de BD deberán invocar `verificarConexion()` al arrancar; se documenta para no romper el arranque base verificado sin MySQL.

## Migration Plan

1. Crear la base `turnero_medico` con `utf8mb4` según el README.
2. Ejecutar `npm run migrate` sobre una base vacía; el migrador crea `migrations_aplicadas` y luego las cinco tablas con índices, FK y `CHECK`.
3. Verificar en `INFORMATION_SCHEMA` la existencia del índice único de `slot_activo_key`, del `CHECK` y de las FK compuestas.
4. Ante un cambio de esquema posterior, agregar un nuevo archivo `migrations/NNN_*.sql`; no editar migraciones ya aplicadas.
5. Rollback: no se provee automático; se restaura desde backup en desarrollo o se aplica una migración correctiva hacia adelante.
