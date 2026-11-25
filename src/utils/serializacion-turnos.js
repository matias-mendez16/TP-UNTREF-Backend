import { normalizarHora } from './fechas-disponibilidad.js';

export function serializarUsuarioPublico(usuario) {
  if (!usuario) {
    return null;
  }
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
  };
}

export function serializarMedico(medico) {
  if (!medico) {
    return null;
  }
  return {
    id: medico.id,
    especialidad: medico.especialidad,
    matricula: medico.matricula,
    usuario: serializarUsuarioPublico(medico.usuario),
  };
}

export function serializarLugar(lugar) {
  if (!lugar) {
    return null;
  }
  return {
    id: lugar.id,
    medicoId: lugar.medicoId,
    nombre: lugar.nombre,
    direccion: lugar.direccion,
  };
}

export function serializarTurno(turno) {
  return {
    id: turno.id,
    medicoId: turno.medicoId,
    pacienteId: turno.pacienteId,
    bloqueId: turno.bloqueId,
    lugarId: turno.lugarId,
    fecha: turno.fecha,
    horaInicio: normalizarHora(turno.horaInicio),
    horaFin: normalizarHora(turno.horaFin),
    estado: turno.estado,
    canceladoPorRol: turno.canceladoPorRol ?? null,
    canceladoEn: turno.canceladoEn ? new Date(turno.canceladoEn).toISOString() : null,
    slotActivoKey: turno.slotActivoKey ?? null,
    createdAt: turno.createdAt ? new Date(turno.createdAt).toISOString() : null,
    updatedAt: turno.updatedAt ? new Date(turno.updatedAt).toISOString() : null,
    medico: serializarMedico(turno.medico),
    paciente: serializarUsuarioPublico(turno.paciente),
    lugar: serializarLugar(turno.lugar),
  };
}
