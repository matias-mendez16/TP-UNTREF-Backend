import { especificacionOpenApi } from '../docs/openapi.js';

export const especificacionSwagger = especificacionOpenApi;

export const opcionesSwaggerUi = Object.freeze({
  customSiteTitle: 'Turnero Médico — Documentación API',
  explorer: true,
  deepLinking: true,
  displayRequestDuration: true,
  persistAuthorization: false,
});
