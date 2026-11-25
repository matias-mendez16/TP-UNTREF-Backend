import { Router } from 'express';

import { autenticar } from '../middlewares/autenticacion.js';
import { autorizarRoles } from '../middlewares/autorizacion.js';
import {
  cancelarTurnoController,
  crearTurnoController,
  listarTurnosController,
  obtenerTurnoController,
} from '../controllers/turnos-controller.js';

export const turnosRoutes = Router();

turnosRoutes.use(autenticar);
turnosRoutes.post('/', autorizarRoles('paciente'), crearTurnoController);
turnosRoutes.get('/', autorizarRoles('paciente', 'medico', 'admin'), listarTurnosController);
turnosRoutes.get('/:id', autorizarRoles('paciente', 'medico', 'admin'), obtenerTurnoController);
turnosRoutes.patch(
  '/:id/cancelar',
  autorizarRoles('paciente', 'medico', 'admin'),
  cancelarTurnoController,
);
