import express from 'express';
import helmet from 'helmet';
import { limitadorGlobal } from './middlewares/rate-limit.js';
import { middleware404, manejadorErrores } from './middlewares/error-handler.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(limitadorGlobal);
app.use(middleware404);
app.use(manejadorErrores);
