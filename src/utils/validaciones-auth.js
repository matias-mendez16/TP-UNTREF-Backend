import { HttpError } from '../middlewares/error-handler.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETRA = /[A-Za-zÁÉÍÓÚáéíóúÑñ]/;
const DIGITO = /\d/;

const LIMITES = Object.freeze({
  nombre: 120,
  email: 180,
  passwordMin: 8,
  passwordMax: 72,
  especialidad: 150,
  matricula: 60,
});

function fallar(mensaje) {
  throw new HttpError(400, 'VALIDATION_ERROR', mensaje);
}

function texto(valor, campo, limite) {
  if (typeof valor !== 'string') {
    fallar(`El campo ${campo} es obligatorio.`);
  }
  const normalizado = valor.trim();
  if (normalizado.length === 0) {
    fallar(`El campo ${campo} es obligatorio.`);
  }
  if (normalizado.length > limite) {
    fallar(`El campo ${campo} no puede superar ${limite} caracteres.`);
  }
  return normalizado;
}

function email(valor) {
  const normalizado = texto(valor, 'email', LIMITES.email).toLowerCase();
  if (!EMAIL.test(normalizado)) {
    fallar('El email no tiene un formato válido.');
  }
  return normalizado;
}

function passwordNueva(valor) {
  if (typeof valor !== 'string') {
    fallar('La contraseña es obligatoria.');
  }
  if (valor.length < LIMITES.passwordMin || valor.length > LIMITES.passwordMax) {
    fallar(`La contraseña debe tener entre ${LIMITES.passwordMin} y ${LIMITES.passwordMax} caracteres.`);
  }
  if (!LETRA.test(valor) || !DIGITO.test(valor)) {
    fallar('La contraseña debe contener al menos una letra y un dígito.');
  }
  return valor;
}

function passwordIngreso(valor) {
  if (typeof valor !== 'string' || valor.length === 0) {
    fallar('La contraseña es obligatoria.');
  }
  if (valor.length > LIMITES.passwordMax) {
    fallar(`La contraseña no puede superar ${LIMITES.passwordMax} caracteres.`);
  }
  return valor;
}

export function validarRegistroPaciente(body = {}) {
  return {
    nombre: texto(body.nombre, 'nombre', LIMITES.nombre),
    email: email(body.email),
    password: passwordNueva(body.password),
  };
}

export function validarCredenciales(body = {}) {
  return { email: email(body.email), password: passwordIngreso(body.password) };
}

export function validarAltaMedico(body = {}) {
  return {
    nombre: texto(body.nombre, 'nombre', LIMITES.nombre),
    email: email(body.email),
    password: passwordNueva(body.password),
    especialidad: texto(body.especialidad, 'especialidad', LIMITES.especialidad),
    matricula: texto(body.matricula, 'matricula', LIMITES.matricula),
  };
}

export function validarAltaAdmin(body = {}) {
  return {
    nombre: texto(body.nombre, 'nombre', LIMITES.nombre),
    email: email(body.email),
    password: passwordNueva(body.password),
  };
}
