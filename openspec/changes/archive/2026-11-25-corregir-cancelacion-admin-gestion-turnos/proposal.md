# Proposal

## Why

La spec `gestion-turnos` contradice a `AGENTS.md`, RF-10 y a la implementación actual: su escenario de cancelación trata a un administrador “sin relación” como no autorizado, cuando el rol administrador tiene alcance global. Esa divergencia bloquea la verificación del README y debilita la defensa oral porque el contrato escrito no coincide con el comportamiento observable.

## What Changes

- Corregir el requisito `Cancelación con liberación inmediata` para declarar explícitamente que el administrador puede cancelar cualquier turno `reservado`, sin necesidad de relación adicional con paciente, médico, lugar o bloque.
- Reemplazar el escenario ambiguo `Cancelación por usuario no propietario` por dos escenarios precisos:
  - paciente o médico sin relación recibe `403` y el turno permanece reservado;
  - administrador cancela un turno de cualquier paciente o médico y recibe `200`.
- Mantener sin cambios la transacción, la liberación de `slotActivoKey`, los metadatos de cancelación, el historial y los códigos `404`/`409`.
- No modificar código de rutas, servicios, modelos ni migraciones: la implementación ya respeta la regla correcta.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `gestion-turnos`: requisito `Cancelación con liberación inmediata` y sus escenarios de autorización.

## Impact

- Specs: `openspec/specs/gestion-turnos/spec.md` después de aplicar y sincronizar el delta.
- Documentación: el README de `documentacion-swagger-readme` podrá verificarse sin contradicciones con las specs de dominio.
- Código: sin cambios; `src/services/turnos-service.js` ya permite administradores en `verificarPropiedadTurno` y cancela dentro de transacción.
- Dependencias: ninguna.
