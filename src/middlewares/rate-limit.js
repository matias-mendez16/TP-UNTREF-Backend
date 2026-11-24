import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function responderLimite(req, res, next, opciones) {
  res.setHeader('Retry-After', Math.ceil(opciones.windowMs / 1000));
  res.status(opciones.statusCode).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
    },
  });
}

const opcionesComunes = {
  windowMs: env.rateLimit.windowMs,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: responderLimite,
};

export const limitadorGlobal = rateLimit({
  ...opcionesComunes,
  limit: env.rateLimit.max,
});

export const limitadorAutenticacion = rateLimit({
  ...opcionesComunes,
  limit: env.rateLimit.authMax,
});
