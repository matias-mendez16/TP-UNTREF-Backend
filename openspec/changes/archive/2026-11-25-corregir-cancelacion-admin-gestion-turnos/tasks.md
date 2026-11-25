# Tasks

## 1. Auditoría del contrato actual

- [x] 1.1 Confirmar que `verificarPropiedadTurno` en `src/services/turnos-service.js` retorna sin `denegar()` para `rol === 'admin'` y que `cancelarTurno` actualiza `estado`, `slotActivoKey`, `canceladoPorRol` y `canceladoEn` en una sola transacción; verificar con lectura del archivo y sin cambios en código de runtime.
- [x] 1.2 Revisar que `specs/gestion-turnos/spec.md` del change contenga el bloque `MODIFIED Requirements` completo de `Cancelación con liberación inmediata`, con los cinco escenarios y sin sección `Purpose`; verificar con `openspec validate "corregir-cancelacion-admin-gestion-turnos" --strict`.

## 2. Sincronización de la spec principal

- [x] 2.1 Reemplazar en `openspec/specs/gestion-turnos/spec.md` el requisito `Cancelación con liberación inmediata` por la versión corregida del delta; verificar que no quede el texto “administrador sin relación” y que `openspec validate --specs --strict` termine sin errores.
- [x] 2.2 Confirmar que la capability conserva sus seis requisitos y que los cinco no modificados mantienen nombre y texto; verificar con `openspec show "gestion-turnos" --type spec --json --no-scenarios` y comparación contra la versión previa.

## 3. Coherencia documental

- [x] 3.1 Confirmar que `README.md` y `src/docs/openapi.js` describen al administrador con alcance global para cancelación y que no requieren cambios; verificar con búsqueda de “admin”/“administrador” en ambos archivos y con `git status --short` sin archivos de runtime modificados.

## Workflow follow-up

- Archivar el change correctivo después de completar y validar las tareas anteriores.
- Verificar el resultado archivado con `openspec list --json` antes de reanudar `documentacion-swagger-readme`.
