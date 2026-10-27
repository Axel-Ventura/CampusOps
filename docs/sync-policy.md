# Política de sincronización y conflictos — CampusOps

Reglas de sincronización de la Semana 8. En cada punto se indica lo que esta implementado en esta versión del repositorio y que sigue pendiente.

## 1. Trabajo del técnico sin conexión

El técnico puede consultar lo que ya tiene guardado, iniciar una atención y agregar notas o referencias a fotografías. Cada cambio se guarda como una operación pendiente en la tabla `pending_operations` de SQLite (`src/persistence/database.ts`) con `operation_id` (clave primaria), `incident_id`, `author_id`, `base_version` y `payload_json` (estado, nota o referencia de foto). Como la cola vive en SQLite y no en memoria, sobrevive al reinicio de la app. La referencia de una foto identifica un recurso pendiente: no significa que la imagen ya se subió.

Estado: `enqueueOperation` y `getPendingOperations` están implementadas y `App.tsx` las usa. Las pruebas de reinicio, migración y rollback siguen pendientes.

## 2. Cómo se detecta una reasignación de coordinación

La reasignación llega del servidor como un registro remoto con una versión mayor que la base y otro técnico asignado. Para detectarla se comparan tres versiones del mismo registro: la base (el último estado que ambos conocían), la local (con el cambio del técnico) y la remota. En CampusOps el campo `work` agrupa `assignedTechnicianId` y `status`, así que un inicio de atención local (`in_progress`) y una reasignación remota (`technician-2`) cambian el mismo campo. Además, el servidor rechaza con 409 una acción enviada con una `baseVersion` obsoleta.

Estado: `resolveSync` (`src/course-evaluation/index.ts`) hace la comparación. Todavía no hay código en la app que traiga el registro remoto al reconectar ni que maneje el 409.

## 3. Cómo se combinan los cambios independientes

`resolveSync` revisa cada campo contra la base y compara su contenido con `JSON.stringify`, no la identidad del objeto. Si solo un lado cambió el campo, se toma ese valor. Si ninguno lo cambió, queda el valor remoto, que es igual al de la base. Si los dos lo cambiaron al mismo valor, tampoco es conflicto. Las entradas no se modifican. Ejemplo de la prueba pública: el local cambia `title` y el remoto cambia `priority`, y el resultado es `merged` con los dos cambios.

Estado: implementado.

## 4. Cuándo se declara un conflicto y cómo se informa

Hay conflicto cuando local y remoto cambian el mismo campo a valores distintos. `resolveSync` devuelve `{ kind: 'conflict', fields }` con los nombres de los campos en orden alfabético. Ejemplo: un inicio de atención local contra una reasignación remota da `['work']`. Ante un conflicto no se sobrescribe la asignación remota y la operación local no se borra de la cola: sigue pendiente. Como la incidencia ya fue reasignada, el técnico no la modifica por su cuenta, y la decisión se revisa con coordinación. Al usuario se le informa con los nombres de los campos en conflicto.

Estado: la detección está implementada. Mostrar el aviso en la pantalla sigue pendiente.

## 5. Cómo se usa operationId para evitar duplicaciones

Cada operación tiene un `operationId` estable, que se genera una vez y no cambia en los reintentos. En la cola es clave primaria y se inserta con `INSERT OR IGNORE`, así que un `operationId` repetido se ignora y queda la primera. `deduplicateOperations` hace lo mismo con una lista: conserva la primera operación de cada `operationId`, en orden y sin modificar la entrada. Al enviarla al servidor, la operación debe llevar una clave de idempotencia (`Idempotency-Key`) estable: repetir la misma clave con el mismo contenido no duplica el efecto, y usarla con otro contenido devuelve 409.

Estado: implementado en el cliente. La idempotencia del servidor la cubre el backend didáctico (`npm run backend:self-test`).

## 6. Cuándo se reintenta y cuándo se elimina de la cola

Se reintenta una operación que no se confirmó (timeout, error de red o respuesta perdida), siempre con la misma identidad. Un timeout no prueba que el servidor no la ejecutó, por eso el reintento conserva la misma clave y el servidor evita duplicarla. Solo se elimina de la cola una operación confirmada por el servidor (`confirmOperation` borra por `operation_id`). Un error o un conflicto no autoriza a descartarla.

Estado: `confirmOperation` existe, pero todavía ningún código la llama. El reintento automático con límites (`planRetry`) está pendiente para la Semana 9.

## 7. Permisos por perfil (Semana 6)

La sincronización no cambia las reglas de permisos. El servidor valida el rol y la asignación (responde 403 si no corresponden), y ocultar un botón no sustituye esa validación. El selector de actor del backend es una ayuda de prueba, no autenticación de producción. Un técnico no modifica una incidencia reasignada a otra persona, y solo coordinación reasigna, cierra o reabre. Una operación rechazada no se confirma ni se aplica, y queda en la cola para revisarse en vez de descartarse sin aviso.

Estado: el cliente de esta versión todavía no maneja el 403 ni el 409. El control lo hace el backend didáctico.

## Pruebas relacionadas

| Regla | Prueba |
|---|---|
| Inicio local contra reasignación remota da conflicto `['work']` sin mutar los registros | primera prueba de `course-tests/public/week-08.test.ts` |
| Cambios independientes se combinan y el mismo campo da conflicto | segunda prueba |
| Un `operationId` repetido conserva la primera operación | tercera prueba |
| Idempotencia y permisos del backend | `npm run backend:self-test` |

Comando: `npm test -- --runInBand course-tests/public/week-08.test.ts`