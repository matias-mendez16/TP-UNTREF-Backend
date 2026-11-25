import { Usuario, Medico } from '../models/index.js';
import { iniciarTransaccion } from '../config/database.js';
import { HttpError } from '../middlewares/error-handler.js';
import { validarAltaMedico } from '../utils/validaciones-auth.js';
import { serializarMedico } from '../utils/serializacion-auth.js';
import { esErrorDuplicado } from '../utils/errores-db.js';
import { hashearPassword } from './password-service.js';

export async function crearMedico(datos) {
  const validados = validarAltaMedico(datos);
  const passwordHash = await hashearPassword(validados.password);
  const transaccion = await iniciarTransaccion();

  try {
    const usuario = await Usuario.create({
      nombre: validados.nombre,
      email: validados.email,
      passwordHash,
      rol: 'medico',
      activo: true,
    }, { transaction: transaccion });

    const medico = await Medico.create({
      usuarioId: usuario.id,
      especialidad: validados.especialidad,
      matricula: validados.matricula,
    }, { transaction: transaccion });

    await transaccion.commit();
    return serializarMedico(usuario, medico);
  } catch (error) {
    await transaccion.rollback();
    if (esErrorDuplicado(error)) {
      throw new HttpError(409, 'CONFLICT', 'El email o la matrícula ya están registrados.');
    }
    throw error;
  }
}
