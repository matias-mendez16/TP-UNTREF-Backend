import { env } from '../config/env.js';

const errorResponse = {
  description: 'Respuesta de error estándar',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};

const validacionResponse = {
  description: 'Datos inválidos',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};

export const especificacionOpenApi = {
  openapi: '3.0.3',
  info: {
    title: 'Turnero Médico API',
    version: '1.0.0',
    description: 'API REST del turnero médico con autenticación mediante JWT en cookie HTTPOnly.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Autenticación', description: 'Registro, inicio y cierre de sesión.' },
    { name: 'Usuarios', description: 'Administración de cuentas según rol.' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar paciente',
        description: 'Crea un usuario con rol paciente. El rol enviado por el cliente se ignora.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegistroPaciente' },
            },
          },
        },
        responses: {
          201: {
            description: 'Paciente creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaUsuario' },
              },
            },
          },
          400: validacionResponse,
          409: errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: `Emite un JWT en la cookie ${env.cookie.name} con HttpOnly, SameSite y Secure según entorno. El token no se devuelve en el cuerpo.`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Credenciales' },
            },
          },
        },
        responses: {
          200: {
            description: 'Sesión iniciada y cookie emitida',
            headers: {
              'Set-Cookie': {
                description: 'Cookie de sesión HTTPOnly.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaSesion' },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar sesión',
        description: 'Elimina la cookie de sesión. No revoca criptográficamente un JWT emitido previamente.',
        responses: {
          200: {
            description: 'Cookie eliminada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaMensaje' },
              },
            },
          },
        },
      },
    },
    '/api/usuarios/medicos': {
      post: {
        tags: ['Usuarios'],
        summary: 'Crear médico',
        description: 'Crea un usuario con rol medico y su perfil profesional en una sola transacción. Solo administradores.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AltaMedico' },
            },
          },
        },
        responses: {
          201: {
            description: 'Médico creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaMedico' },
                example: {
                  success: true,
                  data: {
                    id: 12,
                    nombre: 'Dra. Ana Pérez',
                    email: 'ana@example.com',
                    rol: 'medico',
                    medicoId: 4,
                  },
                },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
          403: errorResponse,
          409: errorResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: env.cookie.name,
      },
    },
    schemas: {
      RegistroPaciente: {
        type: 'object',
        required: ['nombre', 'email', 'password'],
        properties: {
          nombre: { type: 'string', maxLength: 120 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      Credenciales: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      UsuarioPublico: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          rol: { type: 'string', enum: ['paciente', 'medico', 'admin'] },
          medicoId: { type: 'integer', nullable: true },
        },
      },
      RespuestaUsuario: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/UsuarioPublico' },
        },
      },
      RespuestaSesion: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/UsuarioPublico' },
        },
      },
      AltaMedico: {
        type: 'object',
        required: ['nombre', 'email', 'password', 'especialidad', 'matricula'],
        properties: {
          nombre: { type: 'string', maxLength: 120 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
          especialidad: { type: 'string', maxLength: 150 },
          matricula: { type: 'string', maxLength: 60 },
        },
      },
      RespuestaMedico: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            allOf: [
              { $ref: '#/components/schemas/UsuarioPublico' },
              {
                type: 'object',
                properties: {
                  medicoId: { type: 'integer' },
                },
              },
            ],
          },
        },
      },
      RespuestaMensaje: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
