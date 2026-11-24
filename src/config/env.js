import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const OBLIGATORIAS = [
  'PORT',
  'NODE_ENV',
  'LOG_LEVEL',
  'DB_HOST',
  'DB_PORT',
  'DB_DATABASE',
  'DB_USER',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'COOKIE_NAME',
  'COOKIE_SAME_SITE',
  'COOKIE_MAX_AGE_MS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'AUTH_RATE_LIMIT_MAX',
];

const faltantes = OBLIGATORIAS.filter((nombre) => {
  const valor = process.env[nombre];
  return valor === undefined || valor.trim() === '';
});

if (faltantes.length > 0) {
  throw new Error(`Variables de entorno requeridas no definidas: ${faltantes.join(', ')}`);
}

function entero(nombre, minimo, maximo = Number.MAX_SAFE_INTEGER) {
  const valor = Number(process.env[nombre]);
  if (!Number.isInteger(valor) || valor < minimo || valor > maximo) {
    throw new Error(`Variable de entorno inválida: ${nombre} debe ser un entero entre ${minimo} y ${maximo}.`);
  }
  return valor;
}

function opcion(nombre, permitidas) {
  const valor = process.env[nombre].trim().toLowerCase();
  if (!permitidas.includes(valor)) {
    throw new Error(`Variable de entorno inválida: ${nombre} debe ser una de ${permitidas.join(', ')}.`);
  }
  return valor;
}

const entorno = opcion('NODE_ENV', ['development', 'test', 'production']);
const nivelLog = opcion('LOG_LEVEL', ['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
const sameSite = opcion('COOKIE_SAME_SITE', ['strict', 'lax', 'none']);
const puerto = entero('PORT', 1, 65535);
const puertoDb = entero('DB_PORT', 1, 65535);
const cookieMaxAge = entero('COOKIE_MAX_AGE_MS', 1);
const rateWindowMs = entero('RATE_LIMIT_WINDOW_MS', 1);
const rateMax = entero('RATE_LIMIT_MAX', 1);
const authRateMax = entero('AUTH_RATE_LIMIT_MAX', 1);

if (authRateMax >= rateMax) {
  throw new Error('Variable de entorno inválida: AUTH_RATE_LIMIT_MAX debe ser menor que RATE_LIMIT_MAX.');
}

const secureTexto = (process.env.COOKIE_SECURE ?? '').trim().toLowerCase();
if (secureTexto !== '' && !['true', 'false'].includes(secureTexto)) {
  throw new Error('Variable de entorno inválida: COOKIE_SECURE debe ser true o false.');
}

const cookiePath = (process.env.COOKIE_PATH ?? '').trim() || '/';
if (!cookiePath.startsWith('/')) {
  throw new Error('Variable de entorno inválida: COOKIE_PATH debe comenzar con /.');
}

export const env = Object.freeze({
  port: puerto,
  nodeEnv: entorno,
  isProduction: entorno === 'production',
  logLevel: nivelLog,
  db: Object.freeze({
    host: process.env.DB_HOST.trim(),
    port: puertoDb,
    database: process.env.DB_DATABASE.trim(),
    user: process.env.DB_USER.trim(),
    password: process.env.DB_PASSWORD ?? '',
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN.trim(),
  }),
  cookie: Object.freeze({
    name: process.env.COOKIE_NAME.trim(),
    httpOnly: true,
    secure: secureTexto === '' ? entorno === 'production' : secureTexto === 'true',
    sameSite,
    maxAge: cookieMaxAge,
    path: cookiePath,
  }),
  rateLimit: Object.freeze({
    windowMs: rateWindowMs,
    max: rateMax,
    authMax: authRateMax,
  }),
});
