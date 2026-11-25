import { env } from '../config/env.js';
import { verificarToken } from '../services/token-service.js';
import { HttpError } from './error-handler.js';

const ROLES = ['paciente', 'medico', 'admin'];

export function autenticar(req, res, next) {
  const token = req.cookies?.[env.cookie.name];

  if (!token) {
    next(new HttpError(401, 'UNAUTHORIZED', 'Se requiere sesión válida.'));
    return;
  }

  try {
    const payload = verificarToken(token);
    const medicoId = payload.medicoId ?? null;

    if (
      !Number.isInteger(payload.id)
      || !ROLES.includes(payload.rol)
      || (medicoId !== null && !Number.isInteger(medicoId))
    ) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Sesión inválida o vencida.');
    }

    req.user = { id: payload.id, rol: payload.rol, medicoId };
    next();
  } catch (error) {
    next(error);
  }
}
