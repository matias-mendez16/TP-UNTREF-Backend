import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { app } from './app.js';

const servidor = app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Servidor iniciado');
});

servidor.on('error', (error) => {
  logger.error({ code: error.code }, 'No se pudo iniciar el servidor');
  process.exitCode = 1;
});

function cerrar(senal) {
  logger.info({ signal: senal }, 'Cerrando servidor');
  servidor.close(() => {
    logger.info('Servidor cerrado');
  });
}

process.on('SIGINT', () => cerrar('SIGINT'));
process.on('SIGTERM', () => cerrar('SIGTERM'));
