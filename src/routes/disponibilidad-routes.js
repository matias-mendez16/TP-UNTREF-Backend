import { Router } from 'express';

import { autenticar } from '../middlewares/autenticacion.js';
import { autorizarRoles } from '../middlewares/autorizacion.js';
import { verificarPropiedadMedico } from '../middlewares/propiedad.js';
import {
  consultarDisponibilidadController,
  crearBloqueController,
  desactivarBloqueController,
  editarBloqueController,
} from '../controllers/disponibilidad-controller.js';

export const disponibilidadRoutes = Router();

disponibilidadRoutes.use(autenticar);
disponibilidadRoutes.post(
  '/bloques',
  autorizarRoles('medico', 'admin'),
  verificarPropiedadMedico(['body']),
  crearBloqueController,
);
disponibilidadRoutes.get(
  '/medicos/:medicoId',
  autorizarRoles('paciente', 'medico', 'admin'),
  consultarDisponibilidadController,
);
disponibilidadRoutes.patch(
  '/bloques/:bloqueId',
  autorizarRoles('medico', 'admin'),
  editarBloqueController,
);
disponibilidadRoutes.delete(
  '/bloques/:bloqueId',
  autorizarRoles('medico', 'admin'),
  desactivarBloqueController,
);
