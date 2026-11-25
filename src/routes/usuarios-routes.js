import { Router } from 'express';

import { autenticar } from '../middlewares/autenticacion.js';
import { autorizarRoles } from '../middlewares/autorizacion.js';
import { crearMedicoController } from '../controllers/usuarios-controller.js';

export const usuariosRoutes = Router();

usuariosRoutes.use(autenticar);
usuariosRoutes.use(autorizarRoles('admin'));
usuariosRoutes.post('/medicos', crearMedicoController);
