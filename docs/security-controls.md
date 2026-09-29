# Controles de seguridad y privacidad — Semana 04

## 1. Objetivo

Esta semana se revisaron y reforzaron los controles relacionados con el manejo de información sensible en CampusOps.

Los controles se enfocan en tres superficies principales:

- almacenamiento y persistencia de información;
- logs y telemetría;
- manejo de errores.

Se utilizaron únicamente datos ficticios para las pruebas. No se utilizaron credenciales, contraseñas ni información personal real.

## 2. Superficies de información revisadas

En el flujo de CampusOps pueden existir datos que requieren protección, entre ellos:

- tokens y credenciales de autenticación;
- correos electrónicos y nombres;
- identificadores de usuarios y técnicos;
- ubicación e información de coordenadas;
- fotografías y evidencias;
- comentarios internos;
- historial de asignaciones.

También se conservaron datos técnicos que permiten diagnosticar el sistema sin exponer información sensible, por ejemplo:

- `incidentId`;
- `correlationId`;
- `status`;
- `attempt`;
- `durationMs`.

## 3. Almacenamiento y persistencia

Durante la revisión de Semana 04 se verificó el código de la aplicación y no se encontró una implementación activa de `AsyncStorage` o `SecureStore` en las rutas revisadas.

El contrato de evaluación contempla información de sesión mediante el campo `persistedToken`, pero la función `coordinateRefresh` correspondiente todavía no forma parte de la implementación de esta semana. Por lo tanto, no se declara un mecanismo de almacenamiento seguro que no esté implementado.

Para las pruebas de esta semana se utilizan únicamente datos ficticios. No se incorporan secretos reales, contraseñas reales ni información personal real al repositorio.

### Riesgo residual

El principal riesgo residual es que una futura implementación de persistencia de sesión debe seleccionar explícitamente un mecanismo adecuado para proteger tokens y otros datos sensibles. Esta decisión debe realizarse antes de almacenar credenciales o tokens reales de manera persistente.

Mientras dicho mecanismo no esté implementado, los datos utilizados por las pruebas permanecen como fixtures sintéticos y no representan credenciales de producción.

## 4. Sanitización de logs y telemetría

Se implementó `redactForTelemetry` en `src/course-evaluation/index.ts` para evitar que información sensible sea conservada en estructuras destinadas a telemetría.

La función normaliza las claves convirtiéndolas a minúsculas y eliminando `_` y `-`. Cuando una clave pertenece al conjunto de campos sensibles definido por el contrato de CampusOps, sustituye su valor completo por:

`[REDACTED]`

Entre los campos protegidos se encuentran:

- `authorization`;
- `password`;
- `token`;
- `accessToken`;
- `refreshToken`;
- `email`;
- `displayName`;
- `name`;
- `userId`;
- `reporterId`;
- `technicianId`;
- `assignedTechnicianId`;
- `location`;
- `latitude`;
- `longitude`;
- `photos`;
- `evidence`;
- `internalComments`;
- `assignmentHistory`.

La sanitización se aplica de forma recursiva tanto a objetos como a listas. Los campos técnicos no sensibles, como `incidentId`, `status` y `durationMs`, se conservan para permitir diagnóstico técnico.

La función construye una nueva estructura y no modifica la entrada original.

