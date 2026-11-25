import { HttpError } from '../middlewares/error-handler.js';
import { validarFecha, validarHora } from './fechas-disponibilidad.js';
import { entero, paginacion } from './validaciones-disponibilidad.js';

const ESTADOS_TURNO = new Set(['reservado', 'cancelado']);

function fallar(mensaje) {
  throw new HttpError(400, 'VALIDATION_ERROR', mensaje);
}

function valorOpcional(valor) {
  return valor !== undefined && valor !== null && valor !== '';
}

export function validarReserva(datos = {}) {
  return {
    medicoId: entero(datos.medicoId, 'medicoId'),
    bloqueId: entero(datos.bloqueId, 'bloqueId'),
    lugarId: entero(datos.lugarId, 'lugarId'),
    fecha: validarFecha(datos.fecha, 'fecha'),
    horaInicio: validarHora(datos.horaInicio, 'horaInicio'),
  };
}

export function validarFiltrosTurnos(query = {}) {
  const filtros = {};

  if (valorOpcional(query.fecha)) {
    filtros.fecha = validarFecha(query.fecha, 'fecha');
  }

  if (valorOpcional(query.estado)) {
    if (typeof query.estado !== 'string' || !ESTADOS_TURNO.has(query.estado)) {
      fallar('El campo estado debe ser reservado o cancelado.');
    }
    filtros.estado = query.estado;
  }

  if (valorOpcional(query.medicoId)) {
    filtros.medicoId = entero(query.medicoId, 'medicoId');
  }

  if (valorOpcional(query.pacienteId)) {
    filtros.pacienteId = entero(query.pacienteId, 'pacienteId');
  }

  return { ...filtros, ...paginacion(query) };
}

export { entero, paginacion };
