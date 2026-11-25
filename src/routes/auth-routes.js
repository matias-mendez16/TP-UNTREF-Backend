import { Router } from 'express';

import { limitadorAutenticacion } from '../middlewares/rate-limit.js';
import { registrar, iniciarSesion, cerrarSesion } from '../controllers/auth-controller.js';

export const authRoutes = Router();

authRoutes.use(limitadorAutenticacion);
authRoutes.post('/register', registrar);
authRoutes.post('/login', iniciarSesion);
authRoutes.post('/logout', cerrarSesion);
