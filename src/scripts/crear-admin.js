import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Usuario, sequelize } from '../models/index.js';
import { HttpError } from '../middlewares/error-handler.js';
import { validarAltaAdmin } from '../utils/validaciones-auth.js';
import { esErrorDuplicado } from '../utils/errores-db.js';
import { hashearPassword } from '../services/password-service.js';

async function main() {
  const datos = validarAltaAdmin({
    nombre: process.env.ADMIN_NOMBRE,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  const existente = await Usuario.findOne({ where: { email: datos.email } });
  if (existente) {
    if (existente.rol !== 'admin') {
      throw new HttpError(409, 'CONFLICT', 'El email ya pertenece a un usuario no administrador.');
    }
    logger.info({ id: existente.id, email: datos.email }, 'El administrador ya existe');
    return;
  }

  const passwordHash = await hashearPassword(datos.password);
  const administrador = await Usuario.create({
    nombre: datos.nombre,
    email: datos.email,
    passwordHash,
    rol: 'admin',
    activo: true,
  });

  logger.info({ id: administrador.id, email: datos.email }, 'Administrador creado');
}

try {
  await main();
} catch (error) {
  if (esErrorDuplicado(error)) {
    logger.warn('El administrador ya existe');
  } else {
    logger.error({ status: error.status, code: error.code }, 'No se pudo crear el administrador');
    process.exitCode = 1;
  }
} finally {
  await sequelize.close();
}
