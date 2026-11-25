import { BloqueDisponibilidad, LugarAtencion, Medico } from '../models/index.js';
import { HttpError } from '../middlewares/error-handler.js';
import { entero, enteroOpcional } from '../utils/validaciones-disponibilidad.js';

function denegar() {
  throw new HttpError(403, 'FORBIDDEN', 'No tenés permisos sobre el recurso solicitado.');
}

function noEncontrado(recurso) {
  throw new HttpError(404, 'NOT_FOUND', `${recurso} no encontrado.`);
}

export async function resolverMedicoDestino(usuario, valorSolicitado) {
  if (!['medico', 'admin'].includes(usuario?.rol)) {
    denegar();
  }

  if (usuario.rol === 'medico') {
    const solicitado = enteroOpcional(valorSolicitado, 'medicoId');
    if (solicitado !== undefined && solicitado !== usuario.medicoId) {
      denegar();
    }
    const medico = await Medico.findByPk(usuario.medicoId);
    if (!medico) {
      noEncontrado('Perfil médico');
    }
    return usuario.medicoId;
  }

  const medicoId = entero(valorSolicitado, 'medicoId');
  const medico = await Medico.findByPk(medicoId);
  if (!medico) {
    noEncontrado('Médico');
  }
  return medicoId;
}

export async function verificarMedicoConsulta(medicoId) {
  const medico = await Medico.findByPk(medicoId);
  if (!medico) {
    noEncontrado('Médico');
  }
  return medico;
}

export function asegurarPropiedad(usuario, medicoId) {
  if (usuario.rol === 'medico' && usuario.medicoId !== medicoId) {
    denegar();
  }
}

export async function obtenerLugar(usuario, valorId) {
  const id = entero(valorId, 'id');
  const lugar = await LugarAtencion.findByPk(id);
  if (!lugar) {
    noEncontrado('Lugar de atención');
  }
  asegurarPropiedad(usuario, lugar.medicoId);
  return lugar;
}

export async function obtenerBloque(usuario, valorId) {
  const id = entero(valorId, 'bloqueId');
  const bloque = await BloqueDisponibilidad.findByPk(id);
  if (!bloque) {
    noEncontrado('Bloque de disponibilidad');
  }
  asegurarPropiedad(usuario, bloque.medicoId);
  return bloque;
}

export async function verificarLugarDelMedico(lugarId, medicoId, transaccion) {
  const lugar = await LugarAtencion.findOne({
    where: { id: lugarId, medicoId },
    transaction: transaccion,
  });
  if (!lugar) {
    denegar();
  }
  return lugar;
}

export async function bloquearMedico(medicoId, transaccion) {
  const medico = await Medico.findByPk(medicoId, {
    transaction: transaccion,
    lock: transaccion.LOCK.UPDATE,
  });
  if (!medico) {
    noEncontrado('Médico');
  }
  return medico;
}
