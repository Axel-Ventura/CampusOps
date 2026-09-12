# ADR-001 — Arquitectura interna de CampusOps

- **Estado:** Propuesta
- **Fecha:** 2026-09-11
- **Semana:** 2

## Contexto

CampusOps es una aplicación móvil desarrollada con React Native, Expo y TypeScript para gestionar incidencias universitarias.

La aplicación tendrá tres perfiles: reportante, técnico y coordinador. A futuro incorporará sesión, persistencia, funcionamiento sin conexión y servicios de ubicación.

En Semana 2 se construirá un esqueleto funcional con una lista y detalle de incidencias utilizando datos ficticios.

La UI no debe depender directamente de infraestructura, proveedores o almacenamiento.

## Alternativas

### Alternativa 1 — Arquitectura por capas

Separar el sistema en:

UI → Application → Domain ← Infrastructure

Cada capa tiene una responsabilidad específica y la infraestructura implementa los contratos definidos por el dominio.

### Alternativa 2 — Organización por funcionalidad

Organizar el código principalmente por funcionalidades:

incidents/  
session/  
persistence/  
location/

Esta opción tiene menos estructura inicial, pero puede facilitar que las pantallas terminen dependiendo directamente de servicios o implementaciones concretas.

## Decisión

Elegimos la **arquitectura por capas**:

UI → Application → Domain ← Infrastructure

La UI utilizará casos de uso de Application. Application dependerá de los contratos definidos en Domain, mientras que Infrastructure implementará esos contratos.

Para Semana 2 utilizaremos un repositorio falso en memoria con datos ficticios.

## Justificación

La arquitectura por capas facilita las pruebas porque permite utilizar implementaciones controladas sin depender de servicios externos.

También reduce el acoplamiento: si posteriormente cambia el backend, almacenamiento o proveedor de ubicación, se puede sustituir la implementación correspondiente sin modificar directamente la UI.

El costo es tener más archivos y contratos que una solución directa, pero se considera aceptable porque CampusOps crecerá posteriormente con nuevas responsabilidades.

## Trade-off

| Aspecto | Decisión |
|---|---|
| Testabilidad | Se facilita mediante implementaciones falsas |
| Complejidad | Aumenta por la separación de responsabilidades |
| Cambio de proveedor | Se facilita mediante contratos |

Aceptamos mayor estructura a cambio de facilitar las pruebas y reducir el acoplamiento.

## Consecuencias

**Positivas:**

- UI desacoplada de infraestructura.
- Casos de uso fáciles de probar.
- Implementaciones sustituibles.
- Separación clara de responsabilidades.

**Negativas:**

- Mayor cantidad de archivos y abstracciones.
- El equipo debe respetar los límites de dependencia.

## Alcance de Semana 2

Se implementará únicamente:

- lista de incidencias;
- detalle de incidencia;
- datos ficticios;
- repositorio falso en memoria;
- contrato para acceder a las incidencias;
- separación UI, Application, Domain e Infrastructure.

Sesión, persistencia real, sincronización offline, geolocalización y proveedores externos quedan para semanas posteriores.