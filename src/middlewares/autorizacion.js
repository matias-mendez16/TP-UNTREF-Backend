import { HttpError } from './error-handler.js';

export function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      next(new HttpError(401, 'UNAUTHORIZED', 'Se requiere sesión válida.'));
      return;
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      next(new HttpError(403, 'FORBIDDEN', 'No tenés permisos para realizar esta operación.'));
      return;
    }

    next();
  };
}
