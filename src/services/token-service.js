import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error-handler.js';

export function crearToken(datos) {
  return jwt.sign(datos, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch (error) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Sesión inválida o vencida.');
  }
}

export function opcionesCookieSesion() {
  return {
    httpOnly: true,
    sameSite: env.cookie.sameSite,
    secure: env.cookie.secure,
    path: env.cookie.path,
    maxAge: env.cookie.maxAge,
  };
}

export function opcionesCookieBorrado() {
  return {
    httpOnly: true,
    sameSite: env.cookie.sameSite,
    secure: env.cookie.secure,
    path: env.cookie.path,
  };
}
