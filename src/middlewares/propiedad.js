import { HttpError } from './error-handler.js';

const FUENTES = ['params', 'body', 'query'];

function denegar() {
  throw new HttpError(403, 'FORBIDDEN', 'No tenés permisos sobre el recurso solicitado.');
}

function obtenerId(req, nombre, fuentes) {
  for (const fuente of fuentes) {
    const valor = req[fuente]?.[nombre];
    if (valor === undefined) {
      continue;
    }
    if (typeof valor === 'string' && /^\d+$/.test(valor)) {
      return Number(valor);
    }
    return valor;
  }
  return undefined;
}

function middlewareDePropiedad(nombre, obtenerPermitido) {
  return (fuentes = FUENTES) => (req, res, next) => {
    try {
      if (!req.user) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Se requiere sesión válida.');
      }
      if (req.user.rol === 'admin') {
        next();
        return;
      }

      const idSolicitado = obtenerId(req, nombre, fuentes);
      if (idSolicitado === undefined) {
        next();
        return;
      }

      const permitido = obtenerPermitido(req.user, idSolicitado);
      if (!permitido) {
        denegar();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const verificarPropiedadPaciente = middlewareDePropiedad(
  'pacienteId',
  (usuario, idSolicitado) => usuario.rol === 'paciente' && usuario.id === idSolicitado,
);

export const verificarPropiedadMedico = middlewareDePropiedad(
  'medicoId',
  (usuario, idSolicitado) => usuario.rol === 'medico' && usuario.medicoId === idSolicitado,
);
