import { Usuario, Medico } from '../models/index.js';
import { HttpError } from '../middlewares/error-handler.js';
import { validarRegistroPaciente, validarCredenciales } from '../utils/validaciones-auth.js';
import { serializarUsuario, serializarSesion } from '../utils/serializacion-auth.js';
import { esErrorDuplicado } from '../utils/errores-db.js';
import { hashearPassword, compararPassword } from './password-service.js';

const MENSAJE_CREDENCIALES_INVALIDAS = 'Credenciales inválidas.';

export async function registrarPaciente(datos) {
  const { nombre, email, password } = validarRegistroPaciente(datos);
  const passwordHash = await hashearPassword(password);

  try {
    const usuario = await Usuario.create({
      nombre,
      email,
      passwordHash,
      rol: 'paciente',
      activo: true,
    });
    return serializarUsuario(usuario);
  } catch (error) {
    if (esErrorDuplicado(error)) {
      throw new HttpError(409, 'CONFLICT', 'El email ya está registrado.');
    }
    throw error;
  }
}

export async function iniciarSesion(datos) {
  const { email, password } = validarCredenciales(datos);
  const usuario = await Usuario.findOne({ where: { email } });

  if (!usuario || !usuario.activo) {
    throw new HttpError(401, 'UNAUTHORIZED', MENSAJE_CREDENCIALES_INVALIDAS);
  }

  const credencialValida = await compararPassword(password, usuario.passwordHash);
  if (!credencialValida) {
    throw new HttpError(401, 'UNAUTHORIZED', MENSAJE_CREDENCIALES_INVALIDAS);
  }

  const perfilMedico = usuario.rol === 'medico'
    ? await Medico.findOne({ where: { usuarioId: usuario.id } })
    : null;

  return serializarSesion(usuario, perfilMedico?.id ?? null);
}
