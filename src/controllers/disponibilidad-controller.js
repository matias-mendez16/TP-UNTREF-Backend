import {
  consultarDisponibilidad,
  crearBloque,
  desactivarBloque,
  editarBloque,
} from '../services/disponibilidad-service.js';

export async function crearBloqueController(req, res, next) {
  try {
    const bloque = await crearBloque(req.user, req.body);
    res.status(201).json({ success: true, data: bloque });
  } catch (error) {
    next(error);
  }
}

export async function consultarDisponibilidadController(req, res, next) {
  try {
    const disponibilidad = await consultarDisponibilidad(
      req.user,
      req.params.medicoId,
      req.query.fecha,
    );
    res.status(200).json({ success: true, data: disponibilidad });
  } catch (error) {
    next(error);
  }
}

export async function editarBloqueController(req, res, next) {
  try {
    const bloque = await editarBloque(req.user, req.params.bloqueId, req.body);
    res.status(200).json({ success: true, data: bloque });
  } catch (error) {
    next(error);
  }
}

export async function desactivarBloqueController(req, res, next) {
  try {
    const bloque = await desactivarBloque(req.user, req.params.bloqueId);
    res.status(200).json({ success: true, data: bloque });
  } catch (error) {
    next(error);
  }
}
