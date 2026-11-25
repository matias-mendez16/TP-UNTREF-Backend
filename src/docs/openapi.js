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
    { name: 'Turnos', description: 'Reserva, consulta y cancelación de turnos.' },
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
    '/api/turnos': {
      post: {
        tags: ['Turnos'],
        summary: 'Reservar turno',
        description: 'Solo pacientes. Valida bloque activo, día, slot y lugar dentro de una transacción. `slotActivoKey` se genera en el backend y la restricción UNIQUE de MySQL traduce colisiones a 409. Los campos `pacienteId` y `slotActivoKey` enviados por el cliente se ignoran.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearTurno' },
              example: {
                medicoId: 4,
                bloqueId: 15,
                lugarId: 8,
                fecha: '2030-06-03',
                horaInicio: '09:00',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Turno reservado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaTurno' },
                example: {
                  success: true,
                  data: {
                    id: 101,
                    medicoId: 4,
                    pacienteId: 23,
                    bloqueId: 15,
                    lugarId: 8,
                    fecha: '2030-06-03',
                    horaInicio: '09:00',
                    horaFin: '09:30',
                    estado: 'reservado',
                    canceladoPorRol: null,
                    canceladoEn: null,
                    slotActivoKey: '4_2030-06-03_09:00',
                    medico: { id: 4, especialidad: 'Clínica General', matricula: 'MAT-1234' },
                    paciente: { id: 23, nombre: 'Paciente Ejemplo', email: 'paciente@example.com' },
                    lugar: { id: 8, medicoId: 4, nombre: 'Consultorio Centro', direccion: 'Calle 1' },
                  },
                },
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
      get: {
        tags: ['Turnos'],
        summary: 'Listar turnos',
        description: 'El paciente ve solo sus turnos, el médico solo los asignados a su perfil y el admin ve todos. Los filtros nunca amplían el alcance del rol; si intentan hacerlo se responde 403.',
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: 'query', name: 'fecha', required: false, schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'estado', required: false, schema: { type: 'string', enum: ['reservado', 'cancelado'] } },
          { in: 'query', name: 'medicoId', required: false, schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'pacienteId', required: false, schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'page', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          200: {
            description: 'Listado paginado con visibilidad según rol',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaListaTurnos' },
                examples: {
                  Paciente: {
                    summary: 'Paciente: solo sus turnos',
                    value: { success: true, data: { items: [{ id: 101, pacienteId: 23, medicoId: 4, estado: 'reservado' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } },
                  },
                  Medico: {
                    summary: 'Médico: su agenda con datos del paciente',
                    value: { success: true, data: { items: [{ id: 101, medicoId: 4, paciente: { id: 23, nombre: 'Paciente Ejemplo', email: 'paciente@example.com' }, fecha: '2030-06-03', horaInicio: '09:00' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } },
                  },
                  Admin: {
                    summary: 'Administrador: todos los turnos',
                    value: { success: true, data: { items: [{ id: 101, medicoId: 4, pacienteId: 23, estado: 'reservado' }, { id: 102, medicoId: 5, pacienteId: 24, estado: 'cancelado' }], pagination: { page: 1, limit: 20, total: 2, totalPages: 1 } } },
                  },
                },
              },
            },
          },
          400: validacionResponse,
          401: errorResponse,
          403: errorResponse,
        },
      },
    },
    '/api/turnos/{id}': {
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
      ],
      get: {
        tags: ['Turnos'],
        summary: 'Detalle de turno',
        description: 'Solo el paciente propietario, el médico asignado o un administrador. Un turno ajeno responde 403 sin datos; uno inexistente responde 404.',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Turno encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaTurno' },
              },
            },
          },
          401: errorResponse,
          403: errorResponse,
          404: errorResponse,
        },
      },
    },
    '/api/turnos/{id}/cancelar': {
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
      ],
      patch: {
        tags: ['Turnos'],
        summary: 'Cancelar turno',
        description: 'Paciente propietario, médico asignado o administrador. Solo opera sobre turnos reservado: en una transacción fija estado cancelado, deja slotActivoKey en NULL y registra canceladoPorRol y canceladoEn. El horario queda libre de inmediato y la fila histórica se conserva.',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Turno cancelado y slot liberado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaTurno' },
                example: {
                  success: true,
                  data: {
                    id: 101,
                    estado: 'cancelado',
                    canceladoPorRol: 'paciente',
                    canceladoEn: '2030-05-20T14:35:00.000Z',
                    slotActivoKey: null,
                  },
                },
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
      CrearTurno: {
        type: 'object',
        required: ['medicoId', 'bloqueId', 'lugarId', 'fecha', 'horaInicio'],
        properties: {
          medicoId: { type: 'integer', minimum: 1 },
          bloqueId: { type: 'integer', minimum: 1 },
          lugarId: { type: 'integer', minimum: 1 },
          fecha: { type: 'string', format: 'date' },
          horaInicio: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          pacienteId: { type: 'integer', description: 'Ignorado: la identidad surge del JWT.' },
          slotActivoKey: { type: 'string', description: 'Ignorado: la clave se genera en el backend.' },
        },
      },
      Turno: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          medicoId: { type: 'integer' },
          pacienteId: { type: 'integer' },
          bloqueId: { type: 'integer' },
          lugarId: { type: 'integer' },
          fecha: { type: 'string', format: 'date' },
          horaInicio: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          horaFin: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          estado: { type: 'string', enum: ['reservado', 'cancelado'] },
          canceladoPorRol: { type: 'string', enum: ['paciente', 'medico', 'admin'], nullable: true },
          canceladoEn: { type: 'string', format: 'date-time', nullable: true },
          slotActivoKey: { type: 'string', nullable: true, description: 'NULL cuando el turno está cancelado.' },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
          updatedAt: { type: 'string', format: 'date-time', nullable: true },
          medico: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer' },
              especialidad: { type: 'string' },
              matricula: { type: 'string' },
              usuario: { $ref: '#/components/schemas/UsuarioPublico' },
            },
          },
          paciente: { $ref: '#/components/schemas/UsuarioPublico' },
          lugar: { $ref: '#/components/schemas/LugarAtencion' },
        },
      },
      RespuestaTurno: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/Turno' },
        },
      },
      RespuestaListaTurnos: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/Turno' },
              },
              pagination: { $ref: '#/components/schemas/Paginacion' },
            },
          },
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
