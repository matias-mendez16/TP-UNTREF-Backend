import { Op } from 'sequelize';

import { iniciarTransaccion } from '../config/database.js';
import { HttpError } from '../middlewares/error-handler.js';
import {
  BloqueDisponibilidad,
  LugarAtencion,
  Medico,
  Turno,
  Usuario,
} from '../models/index.js';
import { esErrorDuplicado } from '../utils/errores-db.js';
import {
  aMinutos,
  desdeMinutos,
  diaSemanaDeFecha,
  esSlotPasado,
  normalizarHora,
} from '../utils/fechas-disponibilidad.js';
import { serializarTurno } from '../utils/serializacion-turnos.js';
import {
  entero,
  validarFiltrosTurnos,
  validarReserva,
} from '../utils/validaciones-turnos.js';

function denegar() {
  throw new HttpError(403, 'FORBIDDEN', 'No tenés permisos sobre el turno solicitado.');
}

function noEncontrado() {
  throw new HttpError(404, 'NOT_FOUND', 'Turno no encontrado.');
}

function conflicto(mensaje) {
  throw new HttpError(409, 'CONFLICT', mensaje);
}

function incluirRelacionesTurno() {
  return [
    {
      model: Medico,
      as: 'medico',
      attributes: ['id', 'especialidad', 'matricula'],
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email'],
      }],
    },
    {
      model: LugarAtencion,
      as: 'lugar',
      attributes: ['id', 'medicoId', 'nombre', 'direccion'],
    },
    {
      model: Usuario,
      as: 'paciente',
      attributes: ['id', 'nombre', 'email'],
    },
  ];
}

function verificarPropiedadTurno(usuario, turno) {
  if (usuario.rol === 'admin') {
    return;
  }
  if (usuario.rol === 'paciente' && turno.pacienteId === usuario.id) {
    return;
  }
  if (usuario.rol === 'medico' && turno.medicoId === usuario.medicoId) {
    return;
  }
  denegar();
}

function verificarFiltrosDeAlcance(usuario, filtros) {
  if (usuario.rol === 'paciente'
    && filtros.pacienteId !== undefined
    && filtros.pacienteId !== usuario.id) {
    denegar();
  }
  if (usuario.rol === 'medico'
    && filtros.medicoId !== undefined
    && filtros.medicoId !== usuario.medicoId) {
    denegar();
  }
}

function wherePorRol(usuario) {
  if (usuario.rol === 'paciente') {
    return { pacienteId: usuario.id };
  }
  if (usuario.rol === 'medico') {
    return { medicoId: usuario.medicoId };
  }
  return {};
}

function wherePorFiltros(filtros) {
  const condiciones = [];
  if (filtros.fecha !== undefined) {
    condiciones.push({ fecha: { [Op.eq]: filtros.fecha } });
  }
  if (filtros.estado !== undefined) {
    condiciones.push({ estado: { [Op.eq]: filtros.estado } });
  }
  if (filtros.medicoId !== undefined) {
    condiciones.push({ medicoId: { [Op.eq]: filtros.medicoId } });
  }
  if (filtros.pacienteId !== undefined) {
    condiciones.push({ pacienteId: { [Op.eq]: filtros.pacienteId } });
  }
  return condiciones;
}

export async function crearTurno(usuario, datos) {
  const validados = validarReserva(datos);
  const transaccion = await iniciarTransaccion();

  try {
    const bloque = await BloqueDisponibilidad.findOne({
      where: {
        id: validados.bloqueId,
        medicoId: validados.medicoId,
        activo: true,
      },
      transaction: transaccion,
    });
    if (!bloque) {
      throw new HttpError(404, 'NOT_FOUND', 'Bloque de disponibilidad no encontrado o inactivo.');
    }

    const lugar = await LugarAtencion.findOne({
      where: { id: validados.lugarId, medicoId: validados.medicoId },
      transaction: transaccion,
    });
    if (!lugar || lugar.id !== bloque.lugarId) {
      denegar();
    }

    if (bloque.diaSemana !== diaSemanaDeFecha(validados.fecha)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'La fecha no corresponde al día del bloque.');
    }
    if (esSlotPasado(validados.fecha, validados.horaInicio)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No se puede reservar una fecha o hora pasada.');
    }

    const inicioBloque = aMinutos(normalizarHora(bloque.horaInicio));
    const finBloque = aMinutos(normalizarHora(bloque.horaFin));
    const inicioSolicitado = aMinutos(validados.horaInicio);
    const duracion = bloque.duracionMinutos;

    if (
      inicioSolicitado < inicioBloque
      || inicioSolicitado >= finBloque
      || (inicioSolicitado - inicioBloque) % duracion !== 0
    ) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'El horario no es un slot válido del bloque.');
    }

    const turno = await Turno.create({
      medicoId: validados.medicoId,
      pacienteId: usuario.id,
      bloqueId: bloque.id,
      lugarId: lugar.id,
      fecha: validados.fecha,
      horaInicio: validados.horaInicio,
      horaFin: desdeMinutos(inicioSolicitado + duracion),
      estado: 'reservado',
      canceladoPorRol: null,
      canceladoEn: null,
      slotActivoKey: `${validados.medicoId}_${validados.fecha}_${validados.horaInicio}`,
    }, { transaction: transaccion });

    const creado = await Turno.findByPk(turno.id, {
      include: incluirRelacionesTurno(),
      transaction: transaccion,
    });
    await transaccion.commit();
    return serializarTurno(creado);
  } catch (error) {
    await transaccion.rollback();
    if (esErrorDuplicado(error)) {
      throw new HttpError(409, 'CONFLICT', 'El horario ya está reservado.');
    }
    throw error;
  }
}

export async function listarTurnos(usuario, query) {
  const filtros = validarFiltrosTurnos(query);
  verificarFiltrosDeAlcance(usuario, filtros);

  const condiciones = [wherePorRol(usuario), ...wherePorFiltros(filtros)];
  const where = condiciones.length > 0 ? { [Op.and]: condiciones } : {};
  const offset = (filtros.page - 1) * filtros.limit;

  const { rows, count } = await Turno.findAndCountAll({
    where,
    include: incluirRelacionesTurno(),
    order: [['fecha', 'ASC'], ['horaInicio', 'ASC'], ['id', 'ASC']],
    offset,
    limit: filtros.limit,
    distinct: true,
  });

  return {
    items: rows.map(serializarTurno),
    pagination: {
      page: filtros.page,
      limit: filtros.limit,
      total: count,
      totalPages: Math.ceil(count / filtros.limit),
    },
  };
}

export async function obtenerTurnoPorId(usuario, valorId) {
  const id = entero(valorId, 'id');
  const turno = await Turno.findByPk(id, { include: incluirRelacionesTurno() });
  if (!turno) {
    noEncontrado();
  }
  verificarPropiedadTurno(usuario, turno);
  return serializarTurno(turno);
}

export async function cancelarTurno(usuario, valorId) {
  const id = entero(valorId, 'id');
  const transaccion = await iniciarTransaccion();

  try {
    const turno = await Turno.findByPk(id, { transaction: transaccion });
    if (!turno) {
      noEncontrado();
    }
    verificarPropiedadTurno(usuario, turno);
    if (turno.estado !== 'reservado') {
      conflicto('El turno ya se encuentra cancelado.');
    }

    const [afectadas] = await Turno.update({
      estado: 'cancelado',
      slotActivoKey: null,
      canceladoPorRol: usuario.rol,
      canceladoEn: new Date(),
    }, {
      where: { id, estado: 'reservado' },
      transaction: transaccion,
    });

    if (afectadas !== 1) {
      conflicto('El turno ya se encuentra cancelado.');
    }

    const cancelado = await Turno.findByPk(id, {
      include: incluirRelacionesTurno(),
      transaction: transaccion,
    });
    await transaccion.commit();
    return serializarTurno(cancelado);
  } catch (error) {
    await transaccion.rollback();
    throw error;
  }
}
