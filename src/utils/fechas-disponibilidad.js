import { HttpError } from '../middlewares/error-handler.js';

export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
export const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FORMATO_HORA_BD = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

const formateadorFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const formateadorHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function fallar(mensaje) {
  throw new HttpError(400, 'VALIDATION_ERROR', mensaje);
}

function partesFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const normalizada = new Date(Date.UTC(anio, mes - 1, dia));
  const coincide = normalizada.getUTCFullYear() === anio
    && normalizada.getUTCMonth() === mes - 1
    && normalizada.getUTCDate() === dia;
  if (!coincide) {
    fallar('La fecha no es válida.');
  }
  return { anio, mes, dia, normalizada };
}

export function validarFecha(valor, campo = 'fecha') {
  if (typeof valor !== 'string' || !FORMATO_FECHA.test(valor)) {
    fallar(`El campo ${campo} debe tener formato YYYY-MM-DD.`);
  }
  partesFecha(valor);
  return valor;
}

export function validarHora(valor, campo = 'hora') {
  if (typeof valor !== 'string' || !FORMATO_HORA.test(valor)) {
    fallar(`El campo ${campo} debe tener formato HH:mm.`);
  }
  return valor;
}

export function normalizarHora(valor) {
  if (typeof valor !== 'string') {
    fallar('El horario almacenado no tiene un formato válido.');
  }
  const coincidencia = FORMATO_HORA_BD.exec(valor.trim());
  if (!coincidencia) {
    fallar('El horario almacenado no tiene un formato válido.');
  }
  return `${coincidencia[1]}:${coincidencia[2]}`;
}

export function aMinutos(hora) {
  const [horas, minutos] = normalizarHora(hora).split(':').map(Number);
  return horas * 60 + minutos;
}

export function desdeMinutos(total) {
  const horas = Math.floor(total / 60);
  const minutos = total % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

export function diaSemanaDeFecha(fecha) {
  const { normalizada } = partesFecha(validarFecha(fecha));
  return normalizada.getUTCDay();
}

export function fechaActual() {
  const partes = Object.fromEntries(
    formateadorFecha.formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}`;
}

export function horaActual() {
  const partes = Object.fromEntries(
    formateadorHora.formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return `${partes.hour}:${partes.minute}`;
}

export function esSlotPasado(fecha, horaInicio, ahora = {}) {
  const fechaHoy = ahora.fecha ?? fechaActual();
  const horaHoy = ahora.hora ?? horaActual();
  if (fecha < fechaHoy) {
    return true;
  }
  if (fecha > fechaHoy) {
    return false;
  }
  return aMinutos(horaInicio) <= aMinutos(horaHoy);
}

export function generarSlots({ bloque, fecha, reservadas = new Set(), ahora = {} }) {
  const inicio = aMinutos(bloque.horaInicio);
  const fin = aMinutos(bloque.horaFin);
  const duracion = bloque.duracionMinutos;
  const ocupadas = new Set([...reservadas].map(normalizarHora));
  const slots = [];

  for (let actual = inicio; actual < fin; actual += duracion) {
    const horaInicio = desdeMinutos(actual);
    slots.push({
      horaInicio,
      horaFin: desdeMinutos(actual + duracion),
      disponible: !ocupadas.has(horaInicio) && !esSlotPasado(fecha, horaInicio, ahora),
    });
  }

  return slots;
}
