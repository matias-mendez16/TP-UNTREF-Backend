# Design

## Context

Ver `proposal.md` para la motivación. El esquema ya contiene `lugares_atencion`, `bloques_disponibilidad` y `turnos`, con constraints de rango de día, duración positiva, orden horario, integridad referencial y `slot_activo_key` única. La app ya tiene autenticación por cookie, middlewares de roles/propiedad, manejo centralizado de errores, Pino y Swagger. No existe todavía capa HTTP de disponibilidad ni cálculo de slots.

## Goals / Non-Goals

**Goals:**

- Mantener la separación `routes → controllers → services → models` sin lógica de negocio en controladores ni consultas en rutas.
- Reutilizar la identidad del JWT para decidir propiedad; nunca tomar `medicoId` del body para un médico.
- Garantizar que la disponibilidad publicada sea coherente, no solapada y no modifyable mientras tenga turnos reservados.
- Calcular slots dinámicamente para una fecha concreta sin almacenarlos.
- Documentar y validar los contratos HTTP con los códigos `400`, `401`, `403`, `404` y `409`.

**Non-Goals:**

- No implementar reserva ni cancelación de turnos; esos flujos pertenecen al módulo posterior de turnos.
- No crear una migración nueva ni una tabla de slots.
- No permitir que un médico administre lugares o bloques de otro médico.
- No alterar datos históricos ya almacenados en `turnos`.

## Decisions

- **Capas y archivos**: crear nuevos módulos `lugares` y `disponibilidad` con route/controller/service; `src/app.js` solo los monta. Alternativa rechazada: poner validaciones en las rutas, porque rompe la separación por capas exigida.
- **Propiedad**: el `medicoId` de un médico se obtiene de `req.user.medicoId`; para admin se acepta `medicoId` en el body/params y se valida que exista. Alternativa rechazada: confiar en IDs enviados por el cliente para todos los roles.
- **Regla semanal**: se usa `diaSemana` `0..6` ya modelado; la fecha concreta solo existe en la consulta y en el turno. Alternativa rechazada: guardar una fila por fecha, que duplicaría datos y complicaría el historial.
- **Validación horaria**: convertir `HH:mm` a minutos desde medianoche en el service; verificar fin mayor que inicio, duración positiva y `(fin - inicio) % duracion === 0`. MySQL ya valida los casos simples; el service agrega la regla de divisibilidad.
- **Fechas y zona horaria**: interpretar `YYYY-MM-DD` como fecha civil usando medianoche UTC para derivar `diaSemana`, y usar `America/Argentina/Buenos_Aires` para comparar la hora actual. Alternativa rechazada: depender de la zona horaria del proceso Node o del servidor MySQL.
- **Solapamiento concurrente**: crear, editar y desactivar bloques dentro de una transacción y bloquear la fila del médico con `SELECT ... FOR UPDATE` antes de buscar bloques activos del mismo día. Alternativa rechazada: solo consultar antes de insertar sin bloqueo, que deja una ventana de carrera. MySQL no provee una exclusion constraint nativa para intervalos; el bloqueo por médico serializa las escrituras relevantes.
- **Slots libres**: generarlos en memoria desde cada bloque activo y descontar turnos con `estado = 'reservado'` para `(bloqueId, fecha, horaInicio)`. Alternativa rechazada: tabla de slots, por duplicación y necesidad de sincronización.
- **Eliminación**: `DELETE /api/disponibilidad/bloques/:id` hace `activo = false`. Alternativa rechazada: borrado físico, porque las FK con `RESTRICT` y el historial de turnos lo vuelven inviable.
- **Errores**: validación de entrada → `400`; falta de sesión → `401`; propiedad/rol → `403`; recurso inexistente → `404`; solapamiento o turnos reservados → `409`. Un lugar ajeno al médico se traduce a `403`.
- **Paginación**: `/api/lugares` usa `page` por defecto `1`, `limit` por defecto `20`, máximo `100`, orden estable por `id ASC`. `/api/disponibilidad/medicos/:medicoId` no pagina porque devuelve la agenda completa del médico.

## Risks / Trade-offs

- [No hay restricción de base de datos para solapamiento de intervalos] → mitigado con transacción y bloqueo de la fila del médico antes de validar.
- [El bloqueo por médico serializa escrituras] → acceptable para el volumen académico; evita duplicar reglas en MySQL sin agregar dependencias.
- [Cálculo de slots depende de acertar la zona horaria] → se centraliza la conversión en una utilidad y se documenta `America/Argentina/Buenos_Aires`.
- [Un bloque editado no debe cambiar turnos históricos] → los turnos ya guardan `bloqueId`, `lugarId`, `fecha`, `horaInicio` y `horaFin` propios.
- [Desactivar no libera físicamente espacio] → es deliberado para conservar integridad referencial e historial.
- [La respuesta sin `fecha` no puede saber qué slots están ocupados] → se devuelven lugares y bloques; los slots con estado de ocupación se calculan solo cuando llega `fecha`.

## Migration Plan

- No requiere migración: el esquema de `migrations/001_crear_esquema_turnero.sql` ya soporta todas las reglas persistentes del cambio.
- Verificar que la base tenga aplicada esa migración antes de desplegar el código.
- Rollback: revertir los archivos del módulo y desmontar sus rutas; los datos permanecen intactos porque no hay cambios de esquema.
