import { crearMedico } from '../services/usuarios-service.js';

export async function crearMedicoController(req, res, next) {
  try {
    const medico = await crearMedico(req.body);
    res.status(201).json({ success: true, data: medico });
  } catch (error) {
    next(error);
  }
}
