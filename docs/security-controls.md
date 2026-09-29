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