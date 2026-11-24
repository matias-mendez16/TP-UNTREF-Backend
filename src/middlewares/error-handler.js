import { logger } from '../config/logger.js';

const ESTADOS_POR_CODIGO = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT_EXCEEDED: 429,
};

const CODIGOS_POR_ESTADO = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'INTERNAL_SERVER_ERROR',
};

const MENSAJES_POR_ESTADO = {
  400: 'Datos inválidos.',
  401: 'No autorizado.',
  403: 'Acceso denegado.',
  404: 'Recurso no encontrado.',
  409: 'Conflicto con el estado actual del recurso.',
  429: 'Demasiadas solicitudes.',
  500: 'Error interno del servidor.',
};

const ESTADOS_POR_CODIGO_DB = {
  ER_DUP_ENTRY: 409,
  ER_NO_REFERENCED_ROW_2: 409,
};

function estadoValido(valor) {
  return Number.isInteger(valor) && valor >= 400 && valor <= 599;
}

function estadoDelError(err) {
  if (!err || typeof err !== 'object') {
    return 500;
  }
  if (estadoValido(err.status)) {
    return err.status;
  }
  if (estadoValido(err.statusCode)) {
    return err.statusCode;
  }
  if (estadoValido(ESTADOS_POR_CODIGO[err.code])) {
    return ESTADOS_POR_CODIGO[err.code];
  }
  if (estadoValido(ESTADOS_POR_CODIGO_DB[err.code])) {
    return ESTADOS_POR_CODIGO_DB[err.code];
  }
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    return 400;
  }
  if (['JsonWebTokenError', 'TokenExpiredError', 'UnauthorizedError'].includes(err.name)) {
    return 401;
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return 409;
  }
  if (err.name === 'RateLimitExceededError') {
    return 429;
  }
  return 500;
}

function codigoDelError(err, estado) {
  const codigo = err?.code;
  if (typeof codigo === 'string' && ESTADOS_POR_CODIGO[codigo] === estado) {
    return codigo;
  }
  return CODIGOS_POR_ESTADO[estado];
}

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message ?? MENSAJES_POR_ESTADO[status] ?? MENSAJES_POR_ESTADO[500]);
    this.name = 'HttpError';
    this.status = status;
    this.code = code ?? CODIGOS_POR_ESTADO[status] ?? CODIGOS_POR_ESTADO[500];
  }
}

export function middleware404(req, res, next) {
  next(new HttpError(404, 'NOT_FOUND', MENSAJES_POR_ESTADO[404]));
}

export function manejadorErrores(err, req, res, next) {
  const estado = estadoDelError(err);
  const codigo = codigoDelError(err, estado);
  const mensaje = estado === 500
    ? MENSAJES_POR_ESTADO[500]
    : (typeof err?.message === 'string' && err.message.trim() !== ''
      ? err.message
      : MENSAJES_POR_ESTADO[estado]);

  logger.error(
    { method: req?.method, path: req?.originalUrl ?? req?.path, status: estado, code: codigo },
    'Error al procesar la solicitud',
  );

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(estado).json({ success: false, error: { code: codigo, message: mensaje } });
}
