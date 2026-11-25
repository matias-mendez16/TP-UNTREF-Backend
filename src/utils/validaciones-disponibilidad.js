import { validarFecha, validarHora, aMinutos, diaSemanaDeFecha } from './fechas-disponibilidad.js';
import { HttpError } from '../middlewares/error-handler.js';

const LIMITES = Object.freeze({
  nombre: 150,
  direccion: 255,
  paginaMaxima: 10000,
  limiteMaximo: 100,
});

function fallar(mensaje) {
  throw new HttpError(400, 'VALIDATION_ERROR', mensaje);
}

export function texto(valor, campo, limite) {
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

function convertirEntero(valor, campo) {
  if (typeof valor === 'number' && Number.isSafeInteger(valor)) {
    return valor;
  }
  if (typeof valor === 'string' && /^\d+$/.test(valor.trim())) {
    return Number(valor.trim());
  }
  fallar(`El campo ${campo} debe ser un entero.`);
}

export function entero(valor, campo, minimo = 1, maximo = Number.MAX_SAFE_INTEGER) {
  const numero = convertirEntero(valor, campo);
  if (!Number.isSafeInteger(numero) || numero < minimo || numero > maximo) {
    fallar(`El campo ${campo} debe estar entre ${minimo} y ${maximo}.`);
  }
  return numero;
}

export function enteroOpcional(valor, campo, minimo = 1, maximo = Number.MAX_SAFE_INTEGER) {
  if (valor === undefined || valor === null || valor === '') {
    return undefined;
  }
  return entero(valor, campo, minimo, maximo);
}

export function paginacion(query = {}) {
  return {
    page: entero(query.page ?? 1, 'page', 1, LIMITES.paginaMaxima),
    limit: entero(query.limit ?? 20, 'limit', 1, LIMITES.limiteMaximo),
  };
}

export function validarLugar(datos = {}) {
  return {
    medicoId: enteroOpcional(datos.medicoId, 'medicoId'),
    nombre: texto(datos.nombre, 'nombre', LIMITES.nombre),
    direccion: texto(datos.direccion, 'direccion', LIMITES.direccion),
  };
}

export function validarEdicionLugar(datos = {}) {
  const resultado = {};
  if (datos.nombre !== undefined) {
    resultado.nombre = texto(datos.nombre, 'nombre', LIMITES.nombre);
  }
  if (datos.direccion !== undefined) {
    resultado.direccion = texto(datos.direccion, 'direccion', LIMITES.direccion);
  }
  if (Object.keys(resultado).length === 0) {
    fallar('Se requiere al menos nombre o direccion.');
  }
  return resultado;
}

export function validarBloque(datos = {}) {
  const medicoId = enteroOpcional(datos.medicoId, 'medicoId');
  const lugarId = entero(datos.lugarId, 'lugarId');
  const diaSemana = entero(datos.diaSemana, 'diaSemana', 0, 6);
  const horaInicio = validarHora(datos.horaInicio, 'horaInicio');
  const horaFin = validarHora(datos.horaFin, 'horaFin');
  const duracionMinutos = entero(datos.duracionMinutos, 'duracionMinutos', 1, 1440);
  const minutosTotales = aMinutos(horaFin) - aMinutos(horaInicio);

  if (minutosTotales <= 0) {
    fallar('horaFin debe ser posterior a horaInicio.');
  }
  if (minutosTotales % duracionMinutos !== 0) {
    fallar('La duracionMinutos debe dividir exactamente la duracion del bloque.');
  }

  return { medicoId, lugarId, diaSemana, horaInicio, horaFin, duracionMinutos };
}

export function validarConsultaDisponibilidad(medicoId, fecha) {
  const fechaValidada = fecha === undefined || fecha === null || fecha === ''
    ? undefined
    : validarFecha(fecha, 'fecha');

  return {
    medicoId: entero(medicoId, 'medicoId'),
    fecha: fechaValidada,
    diaSemana: fechaValidada ? diaSemanaDeFecha(fechaValidada) : undefined,
  };
}
