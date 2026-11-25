import { normalizarHora } from './fechas-disponibilidad.js';

export function serializarLugar(lugar) {
  return {
    id: lugar.id,
    medicoId: lugar.medicoId,
    nombre: lugar.nombre,
    direccion: lugar.direccion,
  };
}

export function serializarBloque(bloque) {
  return {
    id: bloque.id,
    medicoId: bloque.medicoId,
    lugarId: bloque.lugarId,
    diaSemana: bloque.diaSemana,
    horaInicio: normalizarHora(bloque.horaInicio),
    horaFin: normalizarHora(bloque.horaFin),
    duracionMinutos: bloque.duracionMinutos,
    activo: Boolean(bloque.activo),
  };
}
