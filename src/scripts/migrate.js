import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { logger } from '../config/logger.js';
import { sequelize, verificarConexion } from '../config/database.js';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const DIRECTORIO_MIGRACIONES = path.join(RAIZ, 'migrations');

function dividirSentencias(sql) {
  return sql
    .split(';')
    .map((sentencia) => sentencia.trim())
    .filter((sentencia) => sentencia.length > 0);
}

async function asegurarTablaMigraciones() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
      nombre VARCHAR(255) NOT NULL PRIMARY KEY,
      aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function obtenerAplicadas() {
  const [filas] = await sequelize.query('SELECT nombre FROM migraciones_aplicadas ORDER BY nombre');
  return new Set(filas.map((fila) => fila.nombre));
}

async function main() {
  if (!(await verificarConexion())) {
    logger.error('No se pudieron aplicar las migraciones');
    process.exitCode = 1;
    return;
  }

  try {
    await asegurarTablaMigraciones();
    const aplicadas = await obtenerAplicadas();
    const archivos = (await readdir(DIRECTORIO_MIGRACIONES))
      .filter((nombre) => nombre.endsWith('.sql'))
      .sort();

    for (const nombre of archivos) {
      if (aplicadas.has(nombre)) {
        logger.info({ migracion: nombre }, 'Migración ya aplicada');
        continue;
      }

      const sql = await readFile(path.join(DIRECTORIO_MIGRACIONES, nombre), 'utf8');
      try {
        for (const sentencia of dividirSentencias(sql)) {
          await sequelize.query(sentencia);
        }
        await sequelize.query('INSERT INTO migraciones_aplicadas (nombre) VALUES (:nombre)', {
          replacements: { nombre },
        });
        logger.info({ migracion: nombre }, 'Migración aplicada');
      } catch (error) {
        const codigo = error.original?.code ?? error.code ?? error.name;
        logger.error({ migracion: nombre, codigo }, 'No se pudo aplicar la migración');
        process.exitCode = 1;
        return;
      }
    }

    logger.info('Migraciones finalizadas');
  } catch (error) {
    const codigo = error.original?.code ?? error.code ?? error.name;
    logger.error({ codigo }, 'No se pudo preparar la ejecución de migraciones');
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

await main();
