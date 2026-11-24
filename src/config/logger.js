import pino from 'pino';
import { env } from './env.js';

const RUTAS_SENSIBLES = [
  'password',
  'passwordHash',
  'token',
  'jwt',
  'secret',
  'jwtSecret',
  'authorization',
  'cookie',
  'headers.cookie',
  'headers.authorization',
  'req.headers.cookie',
  'req.headers.authorization',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.jwt',
  '*.secret',
  '*.cookie',
  '*.authorization',
  '*.*.password',
  '*.*.token',
  '*.*.cookie',
  '*.*.authorization',
];

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: RUTAS_SENSIBLES,
    censor: '[REDACTED]',
  },
});
