import { LugarAtencion } from '../models/index.js';
import {
  obtenerLugar,
  resolverMedicoDestino,
} from '../utils/propiedad-disponibilidad.js';
import {
  paginacion,
  validarEdicionLugar,
  validarLugar,
} from '../utils/validaciones-disponibilidad.js';
import { serializarLugar } from '../utils/serializacion-disponibilidad.js';

export async function crearLugar(usuario, datos) {
  const validados = validarLugar(datos);
  const medicoId = await resolverMedicoDestino(usuario, validados.medicoId);
  const lugar = await LugarAtencion.create({
    medicoId,
    nombre: validados.nombre,
    direccion: validados.direccion,
  });
  return serializarLugar(lugar);
}

export async function listarLugares(usuario, query) {
  const { page, limit } = paginacion(query);
  const where = usuario.rol === 'medico' ? { medicoId: usuario.medicoId } : {};
  const { rows, count } = await LugarAtencion.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    offset: (page - 1) * limit,
    limit,
  });

  return {
    items: rows.map(serializarLugar),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function obtenerDetalleLugar(usuario, id) {
  const lugar = await obtenerLugar(usuario, id);
  return serializarLugar(lugar);
}

export async function editarLugar(usuario, id, datos) {
  const lugar = await obtenerLugar(usuario, id);
  const cambios = validarEdicionLugar(datos);
  Object.assign(lugar, cambios);
  await lugar.save();
  return serializarLugar(lugar);
}
