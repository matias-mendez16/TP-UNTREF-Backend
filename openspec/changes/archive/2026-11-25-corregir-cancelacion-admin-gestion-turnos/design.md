# Design

## Context

La implementación de `cancelarTurno` ya resuelve la identidad desde el JWT y permite a `admin` sin restricción de propiedad; la spec sincronizada conserva un escenario heredado que niega ese permiso. Ver `proposal.md` para la motivación y la spec delta para el contrato corregido. El change `documentacion-swagger-readme` está en curso y su tarea 3.5 depende de esta corrección.

## Goals / Non-Goals

**Goals:**
- Dejar una única fuente de verdad para la autorización de cancelación: paciente propietario, médico asignado o cualquier administrador.
- Conservar la redacción de los otros cinco requisitos de `gestion-turnos`.
- Permitir que la documentación Swagger/README se verifique sin contradicciones normativas.

**Non-Goals:**
- Cambiar rutas, servicios, modelos, migraciones ni respuesta HTTP en runtime.
- Modificar las reglas de reserva, listado o detalle.
- Agregar dependencias o nueva configuración.

## Decisions

- **Corregir la spec y no el código.** La implementación coincide con `AGENTS.md` y RF-10; cambiarla para exigir relación del administrador sería una regresión funcional. Alternativa descartada: agregar una verificación de propiedad para admin, porque rompería el alcance global definido para ese rol.
- **Usar `## MODIFIED Requirements` con el bloque completo.** El workflow de OpenSpec reemplaza el requisito final al sincronizar; copiar solo el párrafo editado perdería escenarios. Alternativa descartada: editar directamente la spec principal sin delta, porque salta el registro SDD del cambio.
- **Sincronizar y archivar antes de retomar el README.** Así la verificación de 3.5 compara contra la spec ya corregida. Alternativa descartada: marcar 3.5 con excepción, porque dejaría documentación y spec divergentes.

## Risks / Trade-offs

- [El sync sobrescribe otros requisitos de la capability] → Verificar con `openspec validate --specs --strict` y revisar el diff de `openspec/specs/gestion-turnos/spec.md` antes de archivar.
- [Dos changes activos pueden interferir en el estado de OpenSpec] → Trabajar el change correctivo hasta su archivo y recién después reanudar `documentacion-swagger-readme`.
- [La corrección parezca un cambio de negocio] → Dejar explícito en proposal, design y tasks que el comportamiento de runtime no cambia.

## Migration Plan

1. Verificar que el delta y el código coinciden en la autorización de administrador.
2. Sincronizar el delta a `openspec/specs/gestion-turnos/spec.md`.
3. Validar el cambio y las specs con modo estricto.
4. Archivar el change correctivo.
5. Reanudar `documentacion-swagger-readme` desde la tarea 3.5.

Si la validación falla, restaurar la spec principal desde control de versiones y no archivar el change.
