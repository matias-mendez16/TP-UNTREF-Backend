import {
  cancelarTurno,
  crearTurno,
  listarTurnos,
  obtenerTurnoPorId,
} from '../services/turnos-service.js';

export async function crearTurnoController(req, res, next) {
  try {
    const turno = await crearTurno(req.user, req.body);
    res.status(201).json({ success: true, data: turno });
  } catch (error) {
    next(error);
  }
}

export async function listarTurnosController(req, res, next) {
  try {
    const turnos = await listarTurnos(req.user, req.query);
    res.status(200).json({ success: true, data: turnos });
  } catch (error) {
    next(error);
  }
}

export async function obtenerTurnoController(req, res, next) {
  try {
    const turno = await obtenerTurnoPorId(req.user, req.params.id);
    res.status(200).json({ success: true, data: turno });
  } catch (error) {
    next(error);
  }
}

export async function cancelarTurnoController(req, res, next) {
  try {
    const turno = await cancelarTurno(req.user, req.params.id);
    res.status(200).json({ success: true, data: turno });
  } catch (error) {
    next(error);
  }
}
