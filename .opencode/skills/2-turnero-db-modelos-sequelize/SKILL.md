---
name: turnero-db-modelos-sequelize
description: Diseña e implementa la capa de persistencia en MySQL con mysql2 y Sequelize en ESM, incluyendo modelos, asociaciones relacionales, soporte transaccional y la clave única slotActivoKey para concurrencia y liberación de turnos cancelados.
---

# Modelos MySQL y Relaciones Sequelize

Skill para modelar las entidades del Turnero Médico en MySQL mediante Sequelize (ESM), asegurando integridad referencial y soporte nativo para reservas concurrentes y reutilización de horarios cancelados.

## Cuándo usarla
- Necesitás crear o modificar las tablas `Usuario`, `Medico`, `LugarAtencion`, `BloqueDisponibilidad` y `Turno`.
- Vas a configurar la instancia de Sequelize (`mysql2`), relaciones `hasMany`/`belongsTo` o scripts de sincronización.
- Necesitás garantizar a nivel base de datos que no existan dos turnos activos en el mismo horario sin impedir re-reservas tras una cancelación.

## Pasos del flujo de trabajo

1. **Conexión a MySQL con Sequelize**:
   - Configurar `src/config/database.js` en ESM usando las variables de entorno de MySQL y `mysql2`.
   - Verificar conexión (`authenticate()`) y disponibilidad de transacciones (`sequelize.transaction`).

2. **Definición de Modelos en ESM**:
   - `Usuario`: `id`, `nombre`, `email` (`UNIQUE`), `passwordHash`, `rol` (`ENUM('paciente', 'medico', 'admin')`), `activo`.
   - `Medico`: `id`, `usuarioId` (`FK` única), `especialidad`, `matricula` (`UNIQUE`).
   - `LugarAtencion`: `id`, `medicoId` (`FK`), `nombre`, `direccion`.
   - `BloqueDisponibilidad`: `id`, `medicoId` (`FK`), `lugarId` (`FK`), `diaSemana`, `horaInicio`, `horaFin`, `duracionMinutos`, `activo`.
   - `Turno`: `id`, `medicoId` (`FK`), `pacienteId` (`FK`), `bloqueId` (`FK`), `lugarId` (`FK`), `fecha`, `horaInicio`, `horaFin`, `estado` (`ENUM('reservado', 'cancelado')`), `canceladoPorRol`, `canceladoEn` y `slotActivoKey` (`UNIQUE`, `NULLABLE`).

3. **Regla de integridad `slotActivoKey`**:
   - Configurar `slotActivoKey` con valor `"${medicoId}_${fecha}_${horaInicio}"` cuando `estado === 'reservado'` y `null` cuando `estado === 'cancelado'`.
   - Garantizar que MySQL permita múltiples filas canceladas históricas para el mismo slot pero bloquee dos reservas activas simultáneas.

4. **Asociaciones y OpenSpec**:
   - Definir todas las relaciones en `src/models/index.js` y documentar la spec en OpenSpec.
   
   Usando el flujo SDD de OpenSpec y la skill turnero-db-modelos-sequelize, creá la especificación e implementación del módulo de base de datos con MySQL, mysql2 y Sequelize en ESM.

## Requisitos:

- Modelos: Usuario, Medico, LugarAtencion, BloqueDisponibilidad y Turno, con sus asociaciones (hasMany / belongsTo).
- En Turno, incluir soporte para estado ('reservado', 'cancelado'), datos de cancelación (canceladoPorRol, canceladoEn) y slotActivoKey (único cuando el turno está 'reservado', y NULL cuando está 'cancelado') para permitir reuso del slot tras cancelar e impedir duplicados activos en MySQL.
- Configuración de conexión Sequelize con transacciones habilitadas y scripts/instrucciones claros de sincronización/migración.