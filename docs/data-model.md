# Modelo de Datos y Persistencia Offline - CampusOps

Este documento describe la arquitectura de persistencia local y la gestión de operaciones offline en la aplicación móvil **CampusOps**, garantizando la captura continua de incidencias en campo y la resiliencia operativa ante la pérdida de conectividad.

---

## 1. Almacenamiento Elegido

Se utiliza **`expo-sqlite`**, ya incorporado en el proyecto. 

### Justificación Técnica:
- **Persistencia transaccional**: Permite operaciones ACID sobre SQLite nativo en dispositivos móviles.
- **Soporte relacional**: Facilita consultas estructuradas e integridad referencial (`FOREIGN KEY`) entre incidencias, técnicos, operaciones pendientes y referencias de fotos.
- **Sobrevivencia a ciclos de vida de la app**: Los datos persisten intactos tras reinicios del dispositivo, cierres forzados por el sistema operativo o desbordamientos de memoria.

---

## 2. Versión del Esquema y Control de Versiones

El control de esquema se gestiona mediante la directiva nativa de SQLite `PRAGMA user_version`:

- **Versión inicial**: `schemaVersion: 1`
- **Estrategia de verificación al arranque**:
  1. Al inicializar la conexión con `openDatabaseAsync('campusops.db')`, se ejecuta `PRAGMA user_version`.
  2. Si la versión devuelta es `0`, se ejecutan los scripts DDL correspondientes a la versión 1 y se actualiza con `PRAGMA user_version = 1`.
  3. Si la versión local es menor que la versión esperada por la app, se ejecuta secuencialmente la cadena de migraciones correspondiente dentro de una transacción.

---

## 3. Entidades y Relaciones

El modelo consta de cuatro entidades principales en SQLite:

### Diagrama Lógico Relacional

```text
+-------------------+       1:N       +-------------------------+
|    technicians    | <-------------- |       incidents         |
+-------------------+                 +-------------------------+
| id (PK)           |                 | id (PK)                 |
| name              |                 | title                   |
| email             |                 | description             |
| role              |                 | status                  |
+-------------------+                 | priority                |
                                      | technician_id (FK)      |
                                      | version                 |
                                      | created_at              |
                                      | updated_at              |
                                      +-------------------------+
                                        | 1:N             | 1:N
                                        |                 |
                                        v                 v
                 +------------------------+      +--------------------+
                 |   pending_operations   |      | incident_photos    |
                 +------------------------+      +--------------------+
                 | operation_id (PK)      |      | id (PK)            |
                 | incident_id (FK)       |      | incident_id (FK)   |
                 | author_id (FK)         |      | local_uri          |
                 | base_version           |      | remote_url         |
                 | operation_type         |      | sync_status        |
                 | payload                |      | created_at         |
                 | status                 |      +--------------------+
                 | retry_count            |
                 | created_at             |
                 +------------------------+