import { Op } from 'sequelize';

import { iniciarTransaccion } from '../config/database.js';
import { HttpError } from '../middlewares/error-handler.js';
import { BloqueDisponibilidad, LugarAtencion, Turno } from '../models/index.js';
import {
  aMinutos,
  generarSlots,
  normalizarHora,
} from '../utils/fechas-disponibilidad.js';
import {
  bloquearMedico,
  obtenerBloque,
  resolverMedicoDestino,
  verificarLugarDelMedico,
  verificarMedicoConsulta,
} from '../utils/propiedad-disponibilidad.js';
import { serializarBloque, serializarLugar } from '../utils/serializacion-disponibilidad.js';
import {
  validarBloque,
  validarConsultaDisponibilidad,
} from '../utils/validaciones-disponibilidad.js';

function conflicto(mensaje) {
  throw new HttpError(409, 'CONFLICT', mensaje);
}

async function verificarSolapamiento(datos, transaccion) {
  const donde = {
    medicoId: datos.medicoId,
    diaSemana: datos.diaSemana,
    activo: true,
  };
  if (datos.excluirId !== undefined) {
    donde.id = { [Op.ne]: datos.excluirId };
  }

  const bloques = await BloqueDisponibilidad.findAll({ where: donde, transaction: transaccion });
  const inicio = aMinutos(datos.horaInicio);
  const fin = aMinutos(datos.horaFin);
  const haySolapamiento = bloques.some((bloque) => {
    const inicioExistente = aMinutos(normalizarHora(bloque.horaInicio));
    const finExistente = aMinutos(normalizarHora(bloque.horaFin));
    return inicio < finExistente && fin > inicioExistente;
  });

  if (haySolapamiento) {
    conflicto('El bloque se solapa con otro bloque activo del médico para ese día.');
  }
}

async function verificarSinReservas(bloqueId, transaccion) {
  const cantidad = await Turno.count({
    where: { bloqueId, estado: 'reservado' },
    transaction: transaccion,
  });
  if (cantidad > 0) {
    conflicto('No se puede modificar un bloque con turnos reservados.');
  }
}

export async function crearBloque(usuario, datos) {
  const validados = validarBloque(datos);
  const medicoId = await resolverMedicoDestino(usuario, validados.medicoId);
  const transaccion = await iniciarTransaccion();

  try {
    await bloquearMedico(medicoId, transaccion);
    await verificarLugarDelMedico(validados.lugarId, medicoId, transaccion);
    await verificarSolapamiento({ ...validados, medicoId }, transaccion);

    const bloque = await BloqueDisponibilidad.create({
      medicoId,
      lugarId: validados.lugarId,
      diaSemana: validados.diaSemana,
      horaInicio: validados.horaInicio,
      horaFin: validados.horaFin,
      duracionMinutos: validados.duracionMinutos,
      activo: true,
    }, { transaction: transaccion });

    await transaccion.commit();
    return serializarBloque(bloque);
  } catch (error) {
    await transaccion.rollback();
    throw error;
  }
}

export async function consultarDisponibilidad(usuario, medicoIdBruto, fechaBruta) {
  const { medicoId, fecha, diaSemana } = validarConsultaDisponibilidad(medicoIdBruto, fechaBruta);
  await verificarMedicoConsulta(medicoId);

  const bloques = await BloqueDisponibilidad.findAll({
    where: { medicoId, activo: true },
    order: [['diaSemana', 'ASC'], ['horaInicio', 'ASC'], ['id', 'ASC']],
  });
  const bloquesDelDia = fecha ? bloques.filter((bloque) => bloque.diaSemana === diaSemana) : bloques;
  const lugarIds = [...new Set(bloquesDelDia.map((bloque) => bloque.lugarId))];
  const lugares = lugarIds.length > 0
    ? await LugarAtencion.findAll({
      where: { id: { [Op.in]: lugarIds }, medicoId },
      order: [['id', 'ASC']],
    })
    : [];

  const reservadasPorBloque = new Map();
  if (fecha) {
    const turnos = await Turno.findAll({
      where: { medicoId, fecha, estado: 'reservado' },
      attributes: ['bloqueId', 'horaInicio'],
    });
    for (const turno of turnos) {
      if (!reservadasPorBloque.has(turno.bloqueId)) {
        reservadasPorBloque.set(turno.bloqueId, new Set());
      }
      reservadasPorBloque.get(turno.bloqueId).add(normalizarHora(turno.horaInicio));
    }
  }

  const bloquesSerializados = bloquesDelDia.map((bloque) => {
    const serializado = serializarBloque(bloque);
    if (fecha) {
      serializado.slots = generarSlots({
        bloque: serializado,
        fecha,
        reservadas: reservadasPorBloque.get(bloque.id) ?? new Set(),
      });
    }
    return serializado;
  });

  return {
    medicoId,
    fecha: fecha ?? null,
    lugares: lugares.map(serializarLugar),
    bloques: bloquesSerializados,
  };
}

export async function editarBloque(usuario, bloqueIdBruto, datos) {
  const existente = await obtenerBloque(usuario, bloqueIdBruto);
  const candidato = validarBloque({
    lugarId: datos.lugarId ?? existente.lugarId,
    diaSemana: datos.diaSemana ?? existente.diaSemana,
    horaInicio: datos.horaInicio ?? normalizarHora(existente.horaInicio),
    horaFin: datos.horaFin ?? normalizarHora(existente.horaFin),
    duracionMinutos: datos.duracionMinutos ?? existente.duracionMinutos,
  });

  const transaccion = await iniciarTransaccion();
  try {
    await bloquearMedico(existente.medicoId, transaccion);
    const bloque = await BloqueDisponibilidad.findOne({
      where: { id: existente.id },
      transaction: transaccion,
    });
    if (!bloque) {
      throw new HttpError(404, 'NOT_FOUND', 'Bloque de disponibilidad no encontrado.');
    }

    await verificarSinReservas(bloque.id, transaccion);
    await verificarLugarDelMedico(candidato.lugarId, bloque.medicoId, transaccion);
    await verificarSolapamiento({
      ...candidato,
      medicoId: bloque.medicoId,
      excluirId: bloque.id,
    }, transaccion);

    Object.assign(bloque, {
      lugarId: candidato.lugarId,
      diaSemana: candidato.diaSemana,
      horaInicio: candidato.horaInicio,
      horaFin: candidato.horaFin,
      duracionMinutos: candidato.duracionMinutos,
    });
    await bloque.save({ transaction: transaccion });
    await transaccion.commit();
    return serializarBloque(bloque);
  } catch (error) {
    await transaccion.rollback();
    throw error;
  }
}

export async function desactivarBloque(usuario, bloqueIdBruto) {
  const existente = await obtenerBloque(usuario, bloqueIdBruto);
  const transaccion = await iniciarTransaccion();

  try {
    await bloquearMedico(existente.medicoId, transaccion);
    const bloque = await BloqueDisponibilidad.findOne({
      where: { id: existente.id },
      transaction: transaccion,
    });
    if (!bloque) {
      throw new HttpError(404, 'NOT_FOUND', 'Bloque de disponibilidad no encontrado.');
    }

    await verificarSinReservas(bloque.id, transaccion);
    bloque.activo = false;
    await bloque.save({ transaction: transaccion });
    await transaccion.commit();
    return serializarBloque(bloque);
  } catch (error) {
    await transaccion.rollback();
    throw error;
  }
}
