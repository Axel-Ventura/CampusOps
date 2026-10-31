# Política de resiliencia, geocodificación y reintentos — CampusOps

## 1. Objetivo

Definir cómo CampusOps mantiene sus funcionalidades cuando el servicio de geocodificación falla, responde lentamente o limita las solicitudes, y cuando se pierde la respuesta de una operación que el servidor ya procesó.

La política busca evitar tres problemas:

- Bloquear el registro de incidencias cuando no está disponible el servicio de ubicación.
- Realizar reintentos ilimitados o excesivos.
- Duplicar efectos de operaciones, como resolver o cerrar una incidencia.

Se conservan los mecanismos anteriores de sesión, autorización, cola persistente, conflictos e identidad estable de operaciones.

## 2. Servicio de ubicación y proveedor

CampusOps dispone del endpoint académico `GET /v1/geocoding?q=...`, definido en `docs/CAMPUSOPS_API.md`, que permite simular respuestas del servicio de geocodificación sin consultar ubicaciones reales.

El servicio utilizado durante las pruebas es el backend académico controlado de CampusOps, ejecutado localmente mediante:

```powershell
npm run backend
```

Dirección de desarrollo:

`http://127.0.0.1:4310`

Para acceder a la geocodificación, el backend requiere una sesión autorizada y un actor académico. Durante las pruebas se utilizaron exclusivamente las credenciales sintéticas del curso:

- `Authorization: Bearer course-valid-token`
- `X-Course-Actor: reporter-1`

Estas credenciales se emplean solamente con el entorno de pruebas. El adaptador no fija el token ni el actor en su código: ambos se proporcionan desde las opciones de la solicitud.

La respuesta válida observada durante las pruebas fue:

```json
{
  "label": "Edificio de prueba A",
  "latitude": 0,
  "longitude": 0
}
```

### Implementación

Se creó `src/api/geocoding.ts`, que contiene:

- `lookupIncidentLocation`: consulta el servicio de geocodificación y devuelve una ubicación validada o una alternativa manual.
- `clearGeocodingCache`: elimina las entradas de caché.
- `GeocodingOptions`: permite proporcionar servidor, actor, token, escenario de prueba, timeout y duración de caché.

El adaptador utiliza `fetch`, `AbortController` y la función `selectIncidentLocation` para validar el resultado.

### Alcance del proveedor

El backend académico es un **doble controlado**, útil para ejecutar escenarios reproducibles con datos sintéticos.

No equivale a una consulta exitosa a un proveedor público externo.

**Estado:** la integración con el backend académico está implementada y se realizaron consultas HTTP directas exitosas. La selección, documentación de restricciones y ejecución de una consulta con un proveedor público externo siguen pendientes de verificación.

## 3. Validación de ubicaciones

La función `selectIncidentLocation(provider, manualLabel)`, implementada en `src/course-evaluation/index.ts`, acepta una respuesta del proveedor únicamente cuando:

- El resultado es un objeto válido y no un arreglo.
- `label` es una cadena de texto no vacía.
- `latitude` es un número finito entre -90 y 90.
- `longitude` es un número finito entre -180 y 180.

Las coordenadas `(0, 0)` son válidas y no deben rechazarse por ser cero.

Una ubicación válida devuelve:

```json
{
  "source": "provider",
  "label": "Edificio de prueba A",
  "latitude": 0,
  "longitude": 0
}
```

Si la respuesta es nula, incompleta, malformada o contiene coordenadas inválidas, se selecciona la ubicación manual:

```json
{
  "source": "manual",
  "label": "Edificio manual"
}
```

**Nunca se inventan coordenadas para una ubicación manual.**

La función fue comprobada mediante las pruebas públicas de la Semana 9 y las pruebas del adaptador.

## 4. Política de caché

Se implementó una caché temporal en memoria mediante `Map`, dentro de `src/api/geocoding.ts`.

### Reglas implementadas

1. La consulta se normaliza eliminando espacios exteriores y convirtiéndola a minúsculas.
2. La clave de caché incluye servidor, identificador del actor, escenario académico y consulta normalizada.
3. Antes de solicitar datos al backend, se comprueba si existe una entrada válida.
4. Solo se almacenan respuestas que superan la validación de `selectIncidentLocation` y tienen `source: "provider"`.
5. Las respuestas inválidas, los errores HTTP y las ubicaciones manuales no se almacenan en caché.
6. La duración predeterminada es de **60 000 milisegundos (60 segundos)**.
7. La duración puede configurarse mediante `cacheTtlMs`.
8. Las entradas caducadas se eliminan cuando se vuelven a consultar.
9. La función `clearGeocodingCache()` permite vaciar la caché.

### Seguridad y limitaciones

La caché separa las entradas por actor académico, pero no incorpora el token a la clave para evitar almacenar credenciales allí.

La caché debe limpiarse al cerrar sesión, cambiar de usuario o cambiar de contexto de autorización. Esa llamada desde el ciclo de sesión de la aplicación está pendiente de integración.

La caché es **en memoria**: no sobrevive al reinicio de la aplicación.

Las entradas válidas se reutilizan dentro del tiempo de vigencia configurado. Esto reduce solicitudes repetidas, pero puede mostrar temporalmente un resultado anterior hasta que expire.

### Verificación

Se ejecutó la prueba automatizada:

`reutiliza una respuesta valida desde cache`

El caso realizó dos consultas equivalentes con distintas mayúsculas y espacios, y comprobó que `fetch` se invocó una sola vez.

**Estado:** caché implementada y prueba automatizada aprobada.

## 5. Alternativa manual ante fallos

CampusOps debe permitir continuar usando una descripción textual de la ubicación cuando la geocodificación no está disponible.

Ejemplos de ubicaciones sintéticas:

- Edificio manual.
- Laboratorio de prueba.
- Zona académica ficticia.
- Referencia de acceso simulada.

El adaptador `lookupIncidentLocation` devuelve la alternativa manual cuando ocurre cualquiera de estas situaciones:

- Consulta vacía.
- Falta de credenciales para realizar la consulta.
- Desconexión o error de red.
- Timeout.
- HTTP 401, 403, 429, 500 u otra respuesta HTTP no satisfactoria.
- JSON malformado.
- Respuesta incompleta.
- Coordenadas inválidas.

El timeout predeterminado es de **3 000 milisegundos**, configurable mediante `timeoutMs`.

Se utiliza `AbortController` para cancelar la solicitud cuando transcurre ese tiempo.

### Verificación

Las pruebas automatizadas del adaptador comprobaron:

- Ubicación válida y envío de autorización.
- Fallback manual ante HTTP 429.
- Rechazo de coordenadas inválidas.
- Reutilización de caché.
- Fallback manual cuando vence el timeout.

**Estado:** el fallback está implementado y probado en la capa de selección y adaptador.

**Pendiente:** conectar y comprobar este comportamiento desde la pantalla real de registro de incidencias. Las pruebas actuales no demuestran todavía la interacción completa del usuario con esa pantalla.

## 6. Política de reintentos

La función `planRetry`, implementada en `src/course-evaluation/index.ts`, determina si una solicitud puede reintentarse y cuánto tiempo debe esperar.

### Límites implementados

- No se autorizan nuevos reintentos a partir del intento 4.
- Se rechazan números de intento inválidos.
- Se utiliza una espera progresiva predeterminada de 500 ms, 1 000 ms y 2 000 ms para los intentos 1, 2 y 3.
- La espera progresiva está limitada por una constante máxima de 30 000 ms.
- Un valor finito y no negativo de `retryAfterMs` tiene prioridad sobre la espera progresiva.
- Las solicitudes POST no se reintentan sin una clave de idempotencia no vacía.
- No se reintentan errores que no estén contemplados como transitorios.

Los estados considerados reintentables son:

- `timeout`
- HTTP 429
- HTTP 500
- HTTP 502
- HTTP 503
- HTTP 504

### Solicitudes GET

Una consulta GET puede reintentarse ante fallos temporales, siempre dentro de los límites anteriores.

Ejemplo comprobado por el evaluador público:

- Método: GET.
- Respuesta: HTTP 429.
- Intento: 1.
- `retryAfterMs`: 800.

Resultado:

```json
{
  "retry": true,
  "delayMs": 800,
  "requiresStableIdempotencyKey": false
}
```

### Solicitudes POST

Las operaciones que producen cambios en el servidor necesitan una identidad estable.

Si ocurre un timeout después de enviar una operación POST, el reintento solo se considera seguro cuando conserva la misma clave de idempotencia y el mismo contenido.

Si no existe una clave, `planRetry` devuelve:

```json
{
  "retry": false,
  "delayMs": 0,
  "requiresStableIdempotencyKey": true
}
```

### Alcance y limitaciones

`planRetry` ya calcula la decisión y la demora; las cuatro pruebas públicas de la Semana 9 fueron aprobadas.

Sin embargo, el adaptador actual de geocodificación utiliza una sola solicitud HTTP y recurre directamente al fallback manual ante un error. Todavía no utiliza `planRetry` para ejecutar reintentos reales con esperas.

Además, la constante que limita el backoff progresivo no limita por sí misma un valor válido de `Retry-After` recibido como entrada. Ese valor debe tratarse con cuidado al integrar el planificador con la ejecución HTTP.

**Estado:** planificador implementado y pruebas públicas aprobadas. Ejecutor de reintentos HTTP y métricas integradas pendientes.

## 7. Respuesta perdida después de guardar

CampusOps debe contemplar el siguiente escenario sintético:

1. El usuario solicita resolver o cerrar una incidencia.
2. El cliente envía la operación con una clave de idempotencia.
3. El servidor procesa y guarda el cambio.
4. La respuesta se pierde.
5. El cliente desconoce si la operación se completó.
6. El cliente reintenta con la misma clave y exactamente el mismo contenido.
7. El servidor reconoce la repetición y evita aplicar el mismo efecto dos veces.

Una respuesta perdida no demuestra que la operación haya fallado en el servidor. Por eso no autoriza a generar una nueva identidad de operación.

El backend académico permite reproducir este caso mediante:

`X-Course-Scenario: timeout_after_commit`

El repositorio incluye `course-backend/campusops-self-test.mjs`, que contiene un escenario de respuesta perdida y reenvío con clave estable.

Se ejecutó el comando:

```powershell
node course-backend/campusops-self-test.mjs
```

El proceso terminó con código de salida 0, aunque no mostró un resumen de pruebas en la terminal. Por esa razón, esta ejecución **no se presenta todavía como evidencia suficiente de que todos los escenarios se ejecutaron**.

Para cerrar esta sección se requiere registrar una prueba reproducible que demuestre:

- Misma clave de idempotencia.
- Mismo contenido de solicitud.
- Respuesta de repetición reconocida por el servidor.
- Ausencia de efectos duplicados, incluida la evidencia o las notificaciones cuando corresponda.

Los resultados deberán registrarse en los reportes de la Semana 9.

## 8. Cuándo reintentar, continuar o informar un fallo

| Situación | Decisión |
|---|---|
| Ubicación válida | Utilizar respuesta del proveedor |
| Respuesta incompleta o inválida | Continuar con ubicación manual |
| Geocodificación sin conexión | Continuar con ubicación manual |
| HTTP 429 en el adaptador actual | Continuar con ubicación manual |
| HTTP 429 en una operación con reintentos integrados | Respetar `Retry-After` válido y los límites |
| Timeout en GET | Reintentar solamente cuando exista un ejecutor conectado a `planRetry` |
| Timeout en POST con clave estable | Permitir reintento con la misma identidad y contenido |
| POST sin clave estable | No reintentar automáticamente |
| Intento 4 o superior | Detener los reintentos |
| Conflicto o rechazo de operación | No tratarlo como fallo temporal reintentable sin revisar el estado |

Esta tabla distingue las reglas ya implementadas de los flujos que todavía deben integrarse.

## 9. Seguridad y telemetría

Las pruebas y los registros técnicos deben utilizar únicamente datos sintéticos y sanitizados.

Se pueden registrar:

- Identificadores de correlación no sensibles.
- Estado HTTP.
- Número de intento.
- Duración en milisegundos.
- Decisión de reintento.
- Resultado final.
- Indicación de si se utilizó proveedor, caché o fallback manual.

No deben exponerse:

- Tokens y contraseñas.
- Encabezados de autorización.
- Información personal.
- Ubicaciones sensibles.
- Datos internos de incidencias.
- Evidencia privada de usuarios.

La política de sanitización de la Semana 4 sigue vigente.

La función `redactForTelemetry`, existente en `src/course-evaluation/index.ts`, se conserva sin modificaciones para la Semana 9.


## 10. Decisión técnica y costos

Se adopta una arquitectura donde las responsabilidades se separan en tres niveles:

1. **Validación de ubicación:** `selectIncidentLocation` decide si la información del proveedor es aceptable o si debe utilizarse la alternativa manual.
2. **Adaptador de geocodificación:** `lookupIncidentLocation` controla autorización, timeout, respuesta HTTP, caché y fallback.
3. **Planificación de reintentos:** `planRetry` determina cuándo una operación es reintentable y la espera que corresponde.

### Alternativas consideradas

**Alternativa A: depender completamente del proveedor.** Es más sencilla inicialmente, pero impide continuar cuando el servicio falla.

**Alternativa B: reintentar indefinidamente hasta obtener respuesta.** Puede aumentar la disponibilidad en casos aislados, pero genera esperas excesivas, sobrecarga y riesgo de duplicar operaciones.

**Alternativa C: validación estricta, caché, fallback manual y reintentos acotados.** Es la estrategia elegida porque permite continuar ante fallos y establece límites explícitos.

### Beneficios

- Conserva la funcionalidad de selección de ubicación cuando falla el proveedor.
- Evita utilizar coordenadas inválidas.
- Reduce solicitudes repetidas mediante caché.
- Permite controlar reintentos y prevenir duplicaciones de POST sin identidad.
- Utiliza datos académicos sintéticos durante las pruebas.

### Costos y limitaciones

- La caché requiere control de vigencia e invalidación al cambiar de sesión.
- El fallback manual puede ser menos preciso que una geocodificación válida.
- La integración HTTP de reintentos requiere temporizadores, mediciones y límites.
- Una respuesta perdida requiere verificar la identidad estable de la operación.
- El adaptador todavía debe conectarse con la interfaz real.
- Las pruebas del backend académico no sustituyen la ejecución con un proveedor público externo.

**Conclusión:** CampusOps ya cuenta con una base funcional y comprobada para validar geocodificación, conservar una alternativa manual, reutilizar resultados válidos y planificar reintentos seguros. La integración completa y las evidencias de fallos e idempotencia deberán verificarse antes de declarar terminada la Semana 9.