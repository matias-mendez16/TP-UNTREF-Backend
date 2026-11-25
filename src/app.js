import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { limitadorGlobal } from './middlewares/rate-limit.js';
import { middleware404, manejadorErrores } from './middlewares/error-handler.js';
import { authRoutes } from './routes/auth-routes.js';
import { usuariosRoutes } from './routes/usuarios-routes.js';
import { lugaresRoutes } from './routes/lugares-routes.js';
import { disponibilidadRoutes } from './routes/disponibilidad-routes.js';
import { turnosRoutes } from './routes/turnos-routes.js';
import { especificacionSwagger, opcionesSwaggerUi } from './config/swagger.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(limitadorGlobal);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(especificacionSwagger, opcionesSwaggerUi));
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/turnos', turnosRoutes);
app.use(middleware404);
app.use(manejadorErrores);
