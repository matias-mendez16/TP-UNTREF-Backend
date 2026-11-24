---
name: turnero-docs-swagger-readme
description: Configura la especificación OpenAPI/Swagger completa de todos los endpoints del proyecto y redacta el README.md con guía de instalación, ejecución y síntesis arquitectónica para defensa oral.
---

# Documentación Swagger y README

Skill para dejar documentada la API REST al 100% con Swagger UI y preparar una guía clara de instalación, uso y defensa técnica para el examen final.

## Cuándo usarla
- Todos los endpoints de autenticación, disponibilidad y turnos ya están implementados y necesitás documentarlos en `/api-docs`.
- Vas a redactar o actualizar `README.md` con instrucciones reproducibles desde cero y notas de arquitectura.

## Pasos del flujo de trabajo

1. **Configuración de Swagger / OpenAPI**:
   - Configurar `src/config/swagger.js` y montar Swagger UI en `/api-docs`.
   - Definir esquema de seguridad `cookieAuth` (`type: apiKey`, `in: cookie`, `name: token`).
   - Documentar cada ruta, método, descripción, `req.params`, `req.query`, `requestBody` y respuestas (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`).

2. **Redacción del `README.md`**:
   - Incluir requisitos previos, instalación (`npm install`), configuración de `.env`, creación de base de datos MySQL y comandos `npm run dev` / `npm start`.
   - Incluir tabla resumen de endpoints, reglas de negocio y explicación breve por capa/módulo para defensa oral sin asistencia.

3. **Revisión de completitud**:
   - Verificar que no falte ningún endpoint en Swagger ni ninguna variable de entorno en `.env.example` y `README.md`.

   Usando el flujo SDD de OpenSpec y la skill turnero-docs-swagger-readme, creá la especificación e implementación de la documentación completa del proyecto.

## Requisitos:
- Configurar Swagger (OpenAPI) documentando todos los endpoints, parámetros (req.params, req.query), cuerpos de petición, autenticación por cookie HTTPOnly y códigos de error.
- Redactar README.md con instrucciones paso a paso para instalar dependencias, configurar .env, levantar MySQL, ejecutar el servidor, probar los endpoints y una guía breve de arquitectura por módulo para defender el proyecto en el examen oral.