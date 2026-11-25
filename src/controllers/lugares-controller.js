import {
  crearLugar,
  editarLugar,
  listarLugares,
  obtenerDetalleLugar,
} from '../services/lugares-service.js';

export async function crearLugarController(req, res, next) {
  try {
    const lugar = await crearLugar(req.user, req.body);
    res.status(201).json({ success: true, data: lugar });
  } catch (error) {
    next(error);
  }
}

export async function listarLugaresController(req, res, next) {
  try {
    const resultado = await listarLugares(req.user, req.query);
    res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
}

export async function obtenerLugarController(req, res, next) {
  try {
    const lugar = await obtenerDetalleLugar(req.user, req.params.id);
    res.status(200).json({ success: true, data: lugar });
  } catch (error) {
    next(error);
  }
}

export async function editarLugarController(req, res, next) {
  try {
    const lugar = await editarLugar(req.user, req.params.id, req.body);
    res.status(200).json({ success: true, data: lugar });
  } catch (error) {
    next(error);
  }
}
