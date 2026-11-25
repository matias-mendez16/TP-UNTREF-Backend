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
    { name: 'Lugares', description: 'Lugares de atención de los médicos.' },
    { name: 'Disponibilidad', description: 'Bloques horarios semanales y slots libres.' },
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
    '/api/lugares': {
      post: {
        tags: ['Lugares'],
        summary: 'Crear lugar de atención',
        description: 'Un médico crea lugares solo para su perfil; un admin puede indicar medicoId. El medicoId del body nunca modifica la identidad de un médico autenticado.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearLugar' },
            },
          },
        },
        responses: {
          201: {
            description: 'Lugar creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaLugar' },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
          403: errorResponse,
        },
      },
      get: {
        tags: ['Lugares'],
        summary: 'Listar lugares',
        description: 'El médico ve solo sus lugares; el admin ve todos. Parámetros page y limit con máximo 100.',
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          200: {
            description: 'Listado paginado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaListaLugares' },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
          403: errorResponse,
        },
      },
    },
    '/api/lugares/{id}': {
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
      ],
      get: {
        tags: ['Lugares'],
        summary: 'Detalle de lugar',
        description: 'Solo el médico propietario o un administrador pueden consultarlo.',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Lugar encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaLugar' },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
      patch: {
        tags: ['Lugares'],
        summary: 'Editar lugar',
        description: 'Modifica nombre y direccion sin alterar los datos históricos de turnos ya reservados.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EditarLugar' },
            },
          },
        },
        responses: {
          200: {
            description: 'Lugar actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaLugar' },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/api/disponibilidad/bloques': {
      post: {
        tags: ['Disponibilidad'],
        summary: 'Crear bloque horario',
        description: 'Crea una regla semanal recurrente. Requiere horaFin posterior a horaInicio, duracionMinutos divisor exacto y ausencia de solapamiento con otros bloques activos del mismo médico y día, incluso en otro lugar.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearBloque' },
            },
          },
        },
        responses: {
          201: {
            description: 'Bloque creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaBloque' },
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
    '/api/disponibilidad/medicos/{medicoId}': {
      parameters: [
        { in: 'path', name: 'medicoId', required: true, schema: { type: 'integer' } },
        { in: 'query', name: 'fecha', required: false, schema: { type: 'string', format: 'date' } },
      ],
      get: {
        tags: ['Disponibilidad'],
        summary: 'Consultar disponibilidad de un médico',
        description: 'Devuelve lugares y bloques activos. Con fecha, filtra por diaSemana y calcula slots con disponible en true o false. Fecha y hora se interpretan en America/Argentina/Buenos_Aires.',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Disponibilidad del médico',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaDisponibilidad' },
                example: {
                  success: true,
                  data: {
                    medicoId: 4,
                    fecha: '2030-06-03',
                    lugares: [{ id: 8, medicoId: 4, nombre: 'Consultorio Centro', direccion: 'Calle 1' }],
                    bloques: [{
                      id: 15,
                      medicoId: 4,
                      lugarId: 8,
                      diaSemana: 1,
                      horaInicio: '09:00',
                      horaFin: '10:00',
                      duracionMinutos: 30,
                      activo: true,
                      slots: [
                        { horaInicio: '09:00', horaFin: '09:30', disponible: false },
                        { horaInicio: '09:30', horaFin: '10:00', disponible: true },
                      ],
                    }],
                  },
                },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/api/disponibilidad/bloques/{bloqueId}': {
      parameters: [
        { in: 'path', name: 'bloqueId', required: true, schema: { type: 'integer' } },
      ],
      patch: {
        tags: ['Disponibilidad'],
        summary: 'Editar bloque',
        description: 'Solo el médico propietario o un admin. Se rechaza con 409 si existe un turno reservado vinculado al bloque.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EditarBloque' },
            },
          },
        },
        responses: {
          200: {
            description: 'Bloque actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaBloque' },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
          409: errorResponse,
        },
      },
      delete: {
        tags: ['Disponibilidad'],
        summary: 'Desactivar bloque',
        description: 'No elimina físicamente el bloque: setea activo=false para conservar el historial. Se rechaza con 409 si existe un turno reservado.',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Bloque desactivado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaBloque' },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
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
      CrearLugar: {
        type: 'object',
        required: ['nombre', 'direccion'],
        properties: {
          medicoId: { type: 'integer', description: 'Obligatorio para admin; ignorado para médico.' },
          nombre: { type: 'string', maxLength: 150 },
          direccion: { type: 'string', maxLength: 255 },
        },
      },
      EditarLugar: {
        type: 'object',
        properties: {
          nombre: { type: 'string', maxLength: 150 },
          direccion: { type: 'string', maxLength: 255 },
        },
      },
      LugarAtencion: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          medicoId: { type: 'integer' },
          nombre: { type: 'string' },
          direccion: { type: 'string' },
        },
      },
      Paginacion: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      CrearBloque: {
        type: 'object',
        required: ['lugarId', 'diaSemana', 'horaInicio', 'horaFin', 'duracionMinutos'],
        properties: {
          medicoId: { type: 'integer', description: 'Obligatorio para admin; ignorado para médico.' },
          lugarId: { type: 'integer' },
          diaSemana: { type: 'integer', minimum: 0, maximum: 6 },
          horaInicio: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          horaFin: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          duracionMinutos: { type: 'integer', minimum: 1, maximum: 1440 },
        },
      },
      EditarBloque: {
        type: 'object',
        properties: {
          lugarId: { type: 'integer' },
          diaSemana: { type: 'integer', minimum: 0, maximum: 6 },
          horaInicio: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          horaFin: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          duracionMinutos: { type: 'integer', minimum: 1, maximum: 1440 },
        },
      },
      Slot: {
        type: 'object',
        properties: {
          horaInicio: { type: 'string' },
          horaFin: { type: 'string' },
          disponible: { type: 'boolean' },
        },
      },
      BloqueDisponibilidad: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          medicoId: { type: 'integer' },
          lugarId: { type: 'integer' },
          diaSemana: { type: 'integer', minimum: 0, maximum: 6 },
          horaInicio: { type: 'string' },
          horaFin: { type: 'string' },
          duracionMinutos: { type: 'integer' },
          activo: { type: 'boolean' },
          slots: {
            type: 'array',
            items: { $ref: '#/components/schemas/Slot' },
            description: 'Presente solo cuando se consulta con fecha.',
          },
        },
      },
      Disponibilidad: {
        type: 'object',
        properties: {
          medicoId: { type: 'integer' },
          fecha: { type: 'string', format: 'date', nullable: true },
          lugares: {
            type: 'array',
            items: { $ref: '#/components/schemas/LugarAtencion' },
          },
          bloques: {
            type: 'array',
            items: { $ref: '#/components/schemas/BloqueDisponibilidad' },
          },
        },
      },
      RespuestaLugar: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/LugarAtencion' },
        },
      },
      RespuestaListaLugares: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/LugarAtencion' },
              },
              pagination: { $ref: '#/components/schemas/Paginacion' },
            },
          },
        },
      },
      RespuestaBloque: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/BloqueDisponibilidad' },
        },
      },
      RespuestaDisponibilidad: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/Disponibilidad' },
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
