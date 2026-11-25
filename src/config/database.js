import { Sequelize } from 'sequelize';

import { env } from './env.js';
import { logger } from './logger.js';

export const sequelize = new Sequelize(env.db.database, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: '-03:00',
  logging: false,
  define: {
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

export async function verificarConexion() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida');
    return true;
  } catch (error) {
    const codigo = error.original?.code ?? error.code ?? error.name;
    logger.error({ codigo }, 'No se pudo conectar a la base de datos');
    return false;
  }
}

export function iniciarTransaccion(opciones = {}) {
  return sequelize.transaction(opciones);
}
