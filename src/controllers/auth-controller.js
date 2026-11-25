import { env } from '../config/env.js';
import { registrarPaciente, iniciarSesion as iniciarSesionServicio } from '../services/auth-service.js';
import { crearToken, opcionesCookieSesion, opcionesCookieBorrado } from '../services/token-service.js';

export async function registrar(req, res, next) {
  try {
    const usuario = await registrarPaciente(req.body);
    res.status(201).json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
}

export async function iniciarSesion(req, res, next) {
  try {
    const datos = await iniciarSesionServicio(req.body);
    const token = crearToken({ id: datos.id, rol: datos.rol, medicoId: datos.medicoId });
    res.cookie(env.cookie.name, token, opcionesCookieSesion());
    res.status(200).json({ success: true, data: datos });
  } catch (error) {
    next(error);
  }
}

export function cerrarSesion(req, res) {
  res.clearCookie(env.cookie.name, opcionesCookieBorrado());
  res.status(200).json({ success: true, message: 'Sesión cerrada.' });
}
