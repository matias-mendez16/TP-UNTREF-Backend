# Tasks

## 1. Configuración de persistencia

- [x] 1.1 Crear `src/config/database.js` en ESM con instancia única de Sequelize usando `env.db`, `dialect: 'mysql'`, `timezone: '-03:00'`, `define` con `underscored`, `freezeTableName`, `charset` y `collate`, y `logging: false`; verificar importándolo con `node --input-type=module -e "import('./src/config/database.js')"` y comprobando que no contiene host, usuario ni contraseña literales.
- [x] 1.2 Exportar `verificarConexion()` y un acceso a transacciones, registrando éxito y fallo con `logger` sin SQL sensible; verificar que un fallo de conexión produce un registro estructurado sin contraseñas y que el módulo puede importarse sin abrir conexión.

## 2. Modelos del dominio

- [x] 2.1 Implementar `src/models/usuario.js` y `src/models/medico.js` con los atributos, ENUM, defaults y unicidades de email, matrícula y `usuarioId`; verificar con un script ESM que `rawAttributes` expone los campos y que no se usa `require` ni `module.exports`.
- [x] 2.2 Implementar `src/models/lugar-atencion.js` y `src/models/bloque-disponibilidad.js` con `tableName` explícito, FK a médico, FK de bloque a lugar, `diaSemana`, horarios, duración y `activo`; verificar que las referencias y nombres de tabla coinciden con la migración.
- [x] 2.3 Implementar `src/models/turno.js` con FK a médico, paciente, bloque y lugar, `fecha`, `horaInicio`, `horaFin`, `estado`, metadata de cancelación y `slotActivoKey` único y nullable; verificar que el ENUM de estado es `['reservado', 'cancelado']` y que la columna de clave es nullable.
- [x] 2.4 Crear `src/models/index.js` que cargue los cinco modelos, ejecute las asociaciones `hasMany`/`belongsTo` y exporte modelos e instancia; verificar que `import('./src/models/index.js')` funciona sin conectar a MySQL y que `Medico.associations` incluye lugares, bloques y turnos.

## 3. Migraciones e integridad en MySQL

- [x] 3.1 Crear `migrations/001_crear_esquema_turnero.sql` con las cinco tablas, índices únicos, FK con `RESTRICT`/`CASCADE`, índice único de `slotActivoKey`, `CHECK` estado-clave y FK compuesta bloque-lugar-médico; verificar ejecutándolo sobre MySQL 8 y consultando `INFORMATION_SCHEMA` para tablas, índices, CHECK y restricciones.
- [x] 3.2 Crear `src/scripts/migrate.js` en ESM que lea archivos `.sql` ordenados, registre aplicaciones en `migrations_aplicadas` y omita los ya ejecutados, y agregar el script `migrate` a `package.json` sin nuevas dependencias; verificar que `npm run migrate` funciona y que una segunda ejecución no duplica estructura.
- [x] 3.3 Verificar restricciones críticas con inserciones directas: segundo turno reservado con igual clave rechazado, dos cancelados con igual médico/fecha/hora aceptados, turno con lugar de otro médico rechazado y borrado de bloque con turnos rechazado.

## 4. Documentación y observabilidad

- [x] 4.1 Corregir `.env.example` y `README.md` para usar `DB_DATABASE` y documentar creación de base MySQL 8, `npm run migrate` y el significado de `slotActivoKey`; verificar ejecutando literalmente los comandos documentados sobre una base local.
- [x] 4.2 Verificar que los logs de conexión y fallos de migración no incluyen contraseñas, JWT ni SQL con valores, usando una conexión inválida controlada y revisando la salida estructurada.

## 5. Verificación de integración

- [x] 5.1 Verificar una reserva y cancelación atómicas con `sequelize.transaction`: la reserva crea la clave, la cancelación la deja en `NULL` y conserva la fila con metadata; verificar que luego puede existir una nueva reserva activa para el mismo slot.
- [x] 5.2 Verificar que `npm start` sigue arrancando sin MySQL disponible y que la configuración base del change anterior no se rompe.
- [x] 5.3 Ejecutar `openspec validate \"db-modelos-sequelize\" --strict`, `git diff --check` y una búsqueda de `require(`, `module.exports` y `console.` en `src/`; verificar que no hay hallazgos y que el estado de OpenSpec muestra todos los artefactos listos.

## Workflow follow-up

- Solicitar revisión de los artefactos antes de apply.
- Aplicar el cambio con `/opsx-apply` previa autorización explícita.
- Sincronizar specs y archivar el change cuando la implementación esté verificada.
