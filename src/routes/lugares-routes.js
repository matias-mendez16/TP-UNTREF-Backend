import { Router } from 'express';

import { autenticar } from '../middlewares/autenticacion.js';
import { autorizarRoles } from '../middlewares/autorizacion.js';
import { verificarPropiedadMedico } from '../middlewares/propiedad.js';
import {
  crearLugarController,
  editarLugarController,
  listarLugaresController,
  obtenerLugarController,
} from '../controllers/lugares-controller.js';

export const lugaresRoutes = Router();

lugaresRoutes.use(autenticar);
lugaresRoutes.post(
  '/',
  autorizarRoles('medico', 'admin'),
  verificarPropiedadMedico(['body']),
  crearLugarController,
);
lugaresRoutes.get('/', autorizarRoles('medico', 'admin'), listarLugaresController);
lugaresRoutes.get('/:id', autorizarRoles('medico', 'admin'), obtenerLugarController);
lugaresRoutes.patch('/:id', autorizarRoles('medico', 'admin'), editarLugarController);
