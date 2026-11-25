import { env } from '../config/env.js';

const respuestaError = (descripcion) => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
});

const respuesta = (descripcion, esquema, ejemplo) => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${esquema}` },
      ...(ejemplo ? { example: ejemplo } : {}),
    },
  },
});

const respuestas = Object.freeze({
  validacion: respuestaError('Datos de entrada inválidos.'),
  autenticacion: respuestaError('Credencial de sesión ausente, inválida o vencida.'),
  autorizacion: respuestaError('El rol autenticado no puede ejecutar esta operación.'),
  noEncontrado: respuestaError('Recurso no encontrado.'),
  conflicto: respuestaError('Conflicto con el estado actual del recurso.'),
  limite: respuestaError('Límite de solicitudes excedido.'),
  interno: respuestaError('Error interno del servidor.'),
});

const conRespuestasGlobales = (respuestasOperacion) => ({
  ...respuestasOperacion,
  429: respuestas.limite,
  500: respuestas.interno,
});

const parametroEntero = (nombre, descripcion) => ({
  in: 'path',
  name: nombre,
  required: true,
  description: descripcion,
  schema: { type: 'integer', minimum: 1 },
});

const parametrosPaginacion = [
  {
    in: 'query',
    name: 'page',
    required: false,
    description: 'Número de página, empezando en 1.',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    in: 'query',
    name: 'limit',
    required: false,
    description: 'Cantidad máxima de resultados por página.',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];

const cuerpo = (esquema, ejemplo) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${esquema}` },
      example: ejemplo,
    },
  },
});

const protegida = [{ cookieAuth: [] }];

export const especificacionOpenApi = {
  openapi: '3.0.3',
  info: {
    title: 'Turnero Médico API',
    version: '1.0.0',
    description: 'API REST del turnero médico. La sesión se transporta en una cookie HTTPOnly; la identidad, el rol y la propiedad se resuelven siempre en el backend.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Autenticación', description: 'Registro, inicio y cierre de sesión.' },
    { name: 'Usuarios', description: 'Administración de cuentas según rol.' },
    { name: 'Lugares', description: 'Lugares de atención de los médicos.' },
    { name: 'Disponibilidad', description: 'Bloques horarios semanales y slots calculados.' },
    { name: 'Turnos', description: 'Reserva, consulta y cancelación de turnos.' },
    { name: 'Documentación', description: 'Interfaz interactiva del contrato REST.' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar paciente',
        description: 'Operación pública. Crea un usuario con rol `paciente`; cualquier rol enviado por el cliente se ignora y la contraseña se almacena con hash.',
        requestBody: cuerpo('RegistroPaciente', {
          nombre: 'Paciente Ejemplo',
          email: 'paciente@example.com',
          password: 'Clave123',
        }),
        responses: conRespuestasGlobales({
          201: respuesta('Paciente creado', 'RespuestaUsuario', {
            success: true,
            data: { id: 23, nombre: 'Paciente Ejemplo', email: 'paciente@example.com', rol: 'paciente' },
          }),
          400: respuestas.validacion,
          409: respuestas.conflicto,
        }),
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: `Operación pública. Verifica credenciales y emite una cookie de sesión HTTPOnly llamada \`${env.cookie.name}\` con SameSite, Path, Max-Age y Secure según entorno. La credencial no se devuelve en el cuerpo.`,
        requestBody: cuerpo('Credenciales', {
          email: 'paciente@example.com',
          password: 'Clave123',
        }),
        responses: conRespuestasGlobales({
          200: {
            description: 'Sesión iniciada y cookie emitida',
            headers: {
              'Set-Cookie': {
                description: 'Cookie de sesión HTTPOnly con los atributos configurados.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaSesion' },
                example: {
                  success: true,
                  data: { id: 23, nombre: 'Paciente Ejemplo', email: 'paciente@example.com', rol: 'paciente' },
                },
              },
            },
          },
          400: respuestas.validacion,
          401: respuestas.autenticacion,
        }),
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar sesión',
        description: `Operación pública. Elimina la cookie \`${env.cookie.name}\` usando los mismos atributos con que se creó. No revoca criptográficamente una credencial emitida antes de su vencimiento.`,
        responses: conRespuestasGlobales({
          200: respuesta('Cookie eliminada', 'RespuestaMensaje', {
            success: true,
            message: 'Sesión cerrada.',
          }),
        }),
      },
    },
    '/api/usuarios/medicos': {
      post: {
        tags: ['Usuarios'],
        summary: 'Crear médico',
        description: 'Solo administradores. Crea el usuario con rol `medico` y su perfil profesional en una sola transacción.',
        security: protegida,
        requestBody: cuerpo('AltaMedico', {
          nombre: 'Dra. Ana Pérez',
          email: 'ana@example.com',
          password: 'Clave123',
          especialidad: 'Clínica General',
          matricula: 'MAT-1234',
        }),
        responses: conRespuestasGlobales({
          201: respuesta('Médico creado', 'RespuestaMedico', {
            success: true,
            data: { id: 12, nombre: 'Dra. Ana Pérez', email: 'ana@example.com', rol: 'medico', medicoId: 4 },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          409: respuestas.conflicto,
        }),
      },
    },
    '/api/lugares': {
      post: {
        tags: ['Lugares'],
        summary: 'Crear lugar de atención',
        description: 'Médico o administrador. El médico usa su propio perfil; el administrador puede indicar `medicoId`. Un `medicoId` enviado por un médico se ignora.',
        security: protegida,
        requestBody: cuerpo('CrearLugar', {
          nombre: 'Consultorio Centro',
          direccion: 'Calle 1',
        }),
        responses: conRespuestasGlobales({
          201: respuesta('Lugar creado', 'RespuestaLugar', {
            success: true,
            data: { id: 8, medicoId: 4, nombre: 'Consultorio Centro', direccion: 'Calle 1' },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
        }),
      },
      get: {
        tags: ['Lugares'],
        summary: 'Listar lugares',
        description: 'Médico o administrador. El médico ve solo sus lugares; el administrador ve todos. Orden estable por `id`.',
        security: protegida,
        parameters: parametrosPaginacion,
        responses: conRespuestasGlobales({
          200: respuesta('Listado paginado', 'RespuestaListaLugares', {
            success: true,
            data: {
              items: [{ id: 8, medicoId: 4, nombre: 'Consultorio Centro', direccion: 'Calle 1' }],
              pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
        }),
      },
    },
    '/api/lugares/{id}': {
      parameters: [parametroEntero('id', 'Identificador del lugar de atención.')],
      get: {
        tags: ['Lugares'],
        summary: 'Detalle de lugar',
        description: 'Solo el médico propietario o un administrador pueden consultarlo.',
        security: protegida,
        responses: conRespuestasGlobales({
          200: respuesta('Lugar encontrado', 'RespuestaLugar', {
            success: true,
            data: { id: 8, medicoId: 4, nombre: 'Consultorio Centro', direccion: 'Calle 1' },
          }),
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
        }),
      },
      patch: {
        tags: ['Lugares'],
        summary: 'Editar lugar',
        description: 'Médico propietario o administrador. Modifica nombre y dirección sin alterar los datos históricos de turnos reservados.',
        security: protegida,
        requestBody: cuerpo('EditarLugar', {
          nombre: 'Consultorio Centro Actualizado',
          direccion: 'Calle 2',
        }),
        responses: conRespuestasGlobales({
          200: respuesta('Lugar actualizado', 'RespuestaLugar', {
            success: true,
            data: { id: 8, medicoId: 4, nombre: 'Consultorio Centro Actualizado', direccion: 'Calle 2' },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
        }),
      },
    },
    '/api/disponibilidad/bloques': {
      post: {
        tags: ['Disponibilidad'],
        summary: 'Crear bloque horario',
        description: 'Médico o administrador. Crea una regla semanal recurrente: `horaFin` debe ser posterior a `horaInicio`, `duracionMinutos` debe dividir exactamente el bloque y no se permiten solapamientos del mismo médico y día, incluso en otro lugar.',
        security: protegida,
        requestBody: cuerpo('CrearBloque', {
          lugarId: 8,
          diaSemana: 1,
          horaInicio: '09:00',
          horaFin: '10:00',
          duracionMinutos: 30,
        }),
        responses: conRespuestasGlobales({
          201: respuesta('Bloque creado', 'RespuestaBloque', {
            success: true,
            data: {
              id: 15,
              medicoId: 4,
              lugarId: 8,
              diaSemana: 1,
              horaInicio: '09:00',
              horaFin: '10:00',
              duracionMinutos: 30,
              activo: true,
            },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
          409: respuestas.conflicto,
        }),
      },
    },
    '/api/disponibilidad/medicos/{medicoId}': {
      parameters: [
        parametroEntero('medicoId', 'Identificador del perfil médico.'),
        {
          in: 'query',
          name: 'fecha',
          required: false,
          description: 'Fecha concreta en formato `YYYY-MM-DD`. Si se envía, filtra por `diaSemana` y calcula slots libres u ocupados.',
          schema: { type: 'string', format: 'date' },
        },
      ],
      get: {
        tags: ['Disponibilidad'],
        summary: 'Consultar disponibilidad de un médico',
        description: 'Paciente, médico o administrador autenticados. Devuelve lugares y bloques activos; con `fecha`, agrega slots calculados y marca `disponible` en `true` o `false`. La zona horaria de referencia es `America/Argentina/Buenos_Aires`.',
        security: protegida,
        responses: conRespuestasGlobales({
          200: respuesta('Disponibilidad del médico', 'RespuestaDisponibilidad', {
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
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
        }),
      },
    },
    '/api/disponibilidad/bloques/{bloqueId}': {
      parameters: [parametroEntero('bloqueId', 'Identificador del bloque de disponibilidad.')],
      patch: {
        tags: ['Disponibilidad'],
        summary: 'Editar bloque',
        description: 'Solo el médico propietario o un administrador. Se rechaza con `409` si el bloque tiene turnos en estado `reservado`.',
        security: protegida,
        requestBody: cuerpo('EditarBloque', {
          lugarId: 8,
          diaSemana: 1,
          horaInicio: '09:30',
          horaFin: '11:00',
          duracionMinutos: 30,
        }),
        responses: conRespuestasGlobales({
          200: respuesta('Bloque actualizado', 'RespuestaBloque', {
            success: true,
            data: {
              id: 15,
              medicoId: 4,
              lugarId: 8,
              diaSemana: 1,
              horaInicio: '09:30',
              horaFin: '11:00',
              duracionMinutos: 30,
              activo: true,
            },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
          409: respuestas.conflicto,
        }),
      },
      delete: {
        tags: ['Disponibilidad'],
        summary: 'Desactivar bloque',
        description: 'Médico propietario o administrador. Hace desactivación lógica con `activo = false` para conservar el historial. Se rechaza con `409` si existen turnos reservados vinculados.',
        security: protegida,
        responses: conRespuestasGlobales({
          200: respuesta('Bloque desactivado', 'RespuestaBloque', {
            success: true,
            data: {
              id: 15,
              medicoId: 4,
              lugarId: 8,
              diaSemana: 1,
              horaInicio: '09:30',
              horaFin: '11:00',
              duracionMinutos: 30,
              activo: false,
            },
          }),
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
          409: respuestas.conflicto,
        }),
      },
    },
    '/api/turnos': {
      post: {
        tags: ['Turnos'],
        summary: 'Reservar turno',
        description: 'Solo pacientes. Valida dentro de una transacción que el bloque esté activo, que la fecha corresponda a su día, que la hora sea un slot generado por su duración y que el lugar pertenezca al médico y al bloque. `pacienteId` y `slotActivoKey` enviados por el cliente se ignoran; una colisión de reserva activa responde `409`.',
        security: protegida,
        requestBody: cuerpo('CrearTurno', {
          medicoId: 4,
          bloqueId: 15,
          lugarId: 8,
          fecha: '2030-06-03',
          horaInicio: '09:30',
        }),
        responses: conRespuestasGlobales({
          201: respuesta('Turno reservado', 'RespuestaTurno', {
            success: true,
            data: {
              id: 101,
              medicoId: 4,
              pacienteId: 23,
              bloqueId: 15,
              lugarId: 8,
              fecha: '2030-06-03',
              horaInicio: '09:30',
              horaFin: '10:00',
              estado: 'reservado',
              canceladoPorRol: null,
              canceladoEn: null,
              slotActivoKey: '4_2030-06-03_09:30',
            },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
          409: respuestas.conflicto,
        }),
      },
      get: {
        tags: ['Turnos'],
        summary: 'Listar turnos',
        description: 'Paciente, médico o administrador autenticados. El paciente ve solo sus turnos, el médico solo los asignados a su perfil y el administrador ve todos. Los filtros nunca amplían el alcance del rol; intentar hacerlo responde `403`. Orden estable por `fecha`, `horaInicio` e `id`.',
        security: protegida,
        parameters: [
          {
            in: 'query',
            name: 'fecha',
            required: false,
            description: 'Filtrar por fecha concreta en formato `YYYY-MM-DD`.',
            schema: { type: 'string', format: 'date' },
          },
          {
            in: 'query',
            name: 'estado',
            required: false,
            description: 'Filtrar por estado del turno.',
            schema: { type: 'string', enum: ['reservado', 'cancelado'] },
          },
          {
            in: 'query',
            name: 'medicoId',
            required: false,
            description: 'Filtrar por médico; los roles no administradores solo pueden usar su propio identificador.',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            in: 'query',
            name: 'pacienteId',
            required: false,
            description: 'Filtrar por paciente; los pacientes solo pueden usar su propio identificador.',
            schema: { type: 'integer', minimum: 1 },
          },
          ...parametrosPaginacion,
        ],
        responses: conRespuestasGlobales({
          200: respuesta('Listado paginado según rol', 'RespuestaListaTurnos', {
            success: true,
            data: {
              items: [{
                id: 101,
                medicoId: 4,
                pacienteId: 23,
                fecha: '2030-06-03',
                horaInicio: '09:30',
                estado: 'reservado',
              }],
              pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            },
          }),
          400: respuestas.validacion,
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
        }),
      },
    },
    '/api/turnos/{id}': {
      parameters: [parametroEntero('id', 'Identificador del turno.')],
      get: {
        tags: ['Turnos'],
        summary: 'Detalle de turno',
        description: 'Solo el paciente propietario, el médico asignado o un administrador. Un turno ajeno responde `403` sin datos; uno inexistente responde `404`. La respuesta no incluye hashes, credenciales ni secretos.',
        security: protegida,
        responses: conRespuestasGlobales({
          200: respuesta('Turno encontrado', 'RespuestaTurno', {
            success: true,
            data: {
              id: 101,
              medicoId: 4,
              pacienteId: 23,
              bloqueId: 15,
              lugarId: 8,
              fecha: '2030-06-03',
              horaInicio: '09:30',
              horaFin: '10:00',
              estado: 'reservado',
              slotActivoKey: '4_2030-06-03_09:30',
            },
          }),
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
        }),
      },
    },
    '/api/turnos/{id}/cancelar': {
      parameters: [parametroEntero('id', 'Identificador del turno a cancelar.')],
      patch: {
        tags: ['Turnos'],
        summary: 'Cancelar turno',
        description: 'Paciente propietario, médico asignado o administrador. Solo opera sobre turnos `reservado`: en una transacción fija `cancelado`, deja `slotActivoKey` en `NULL` y registra `canceladoPorRol` y `canceladoEn`. El horario queda libre de inmediato y la fila histórica se conserva.',
        security: protegida,
        responses: conRespuestasGlobales({
          200: respuesta('Turno cancelado y slot liberado', 'RespuestaTurno', {
            success: true,
            data: {
              id: 101,
              estado: 'cancelado',
              canceladoPorRol: 'paciente',
              canceladoEn: '2030-05-20T14:35:00.000Z',
              slotActivoKey: null,
            },
          }),
          401: respuestas.autenticacion,
          403: respuestas.autorizacion,
          404: respuestas.noEncontrado,
          409: respuestas.conflicto,
        }),
      },
    },
    '/api-docs': {
      get: {
        tags: ['Documentación'],
        summary: 'Documentación interactiva',
        description: 'Operación pública que sirve la interfaz Swagger UI con el contrato completo de la API. No exige cookie de sesión.',
        responses: conRespuestasGlobales({
          200: {
            description: 'Interfaz HTML de documentación',
            content: {
              'text/html': {
                schema: { type: 'string' },
              },
            },
          },
        }),
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: env.cookie.name,
        description: 'Cookie de sesión HTTPOnly configurada en el entorno. La identidad y el rol se obtienen del servidor, no del cliente.',
      },
    },
    schemas: {
      RegistroPaciente: {
        type: 'object',
        required: ['nombre', 'email', 'password'],
        properties: {
          nombre: { type: 'string', maxLength: 120 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72, description: 'Valor ficticio de ejemplo; reemplazar por una contraseña real.' },
        },
      },
      Credenciales: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', description: 'Valor ficticio de ejemplo; reemplazar por una contraseña real.' },
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
          password: { type: 'string', minLength: 8, maxLength: 72, description: 'Valor ficticio de ejemplo; reemplazar por una contraseña real.' },
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
          medicoId: { type: 'integer', description: 'Obligatorio para administrador; ignorado para médico.' },
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
          medicoId: { type: 'integer', description: 'Obligatorio para administrador; ignorado para médico.' },
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
          pacienteId: { type: 'integer', description: 'Ignorado: la identidad surge de la sesión.' },
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
