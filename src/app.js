import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { limitadorGlobal } from './middlewares/rate-limit.js';
import { middleware404, manejadorErrores } from './middlewares/error-handler.js';
import { authRoutes } from './routes/auth-routes.js';
import { usuariosRoutes } from './routes/usuarios-routes.js';
import { especificacionOpenApi } from './docs/openapi.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(limitadorGlobal);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(especificacionOpenApi));
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use(middleware404);
app.use(manejadorErrores);
