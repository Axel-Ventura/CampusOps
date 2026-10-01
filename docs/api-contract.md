# CampusOps — Contrato de API y cliente

## 1. Propósito

Este documento define el contrato que utiliza el cliente de CampusOps para recibir y validar respuestas del backend didáctico durante la Semana 5.

El cliente debe validar los datos recibidos antes de utilizarlos en la aplicación.

La validación del sobre remoto se realiza mediante:

```ts
parseRemoteResource(input)
```

El contrato distingue entre datos válidos y respuestas que no cumplen la estructura esperada.

---

## 2. Backend didáctico

El backend de pruebas se ejecuta mediante:

```
make run-backend
```

La comprobación del backend se realiza mediante:

```
npm run backend:self-test
```

La dirección predeterminada es:

```
http://127.0.0.1:4310
```

Para un emulador Android:

```
http://10.0.2.2:4310
```

El backend utiliza datos e identidades sintéticas y no requiere Internet pública ni proveedores externos.

Las variantes de prueba se seleccionan mediante:

```
X-Course-Scenario
```

Entre las variantes disponibles se encuentran:

- `success`
- `nullable`
- `server_error`
- `rate_limited`
- `malformed`
- `slow`
- `timeout_after_commit`

---

## 3. Endpoints utilizados

CampusOps cuenta con los siguientes endpoints relacionados con incidencias:

### Listar incidencias

```
GET /v1/incidents
```

La respuesta utiliza la forma:

```json
{
  "items": []
}
```

El contenido depende del actor que realiza la consulta.

### Obtener una incidencia

```
GET /v1/incidents/:id
```

Devuelve el DTO de una incidencia visible para el actor.

### Crear una incidencia

```
POST /v1/incidents
```

La creación requiere:

- categoría válida;
- descripción no vacía;
- `location` textual;
- `Idempotency-Key` estable.

> Las pantallas no deben realizar directamente la interpretación de las respuestas del servidor. La comunicación debe pasar por la capa cliente.

---

## 4. Contrato de `parseRemoteResource`

`parseRemoteResource` valida el sobre de un recurso remoto.

La estructura esperada es:

```ts
{
  id: string;
  version: number;
  status: string;
  payload: JsonObject | null;
}
```

El resultado de la función está definido por `ParseResult`:

### Respuesta válida

```ts
{
  ok: true,
  value: {
    id: string;
    version: number;
    status: string;
    payload: JsonObject | null;
  }
}
```

### Respuesta inválida

```ts
{
  ok: false,
  error: 'contract'
}
```

La función debe aceptar campos adicionales en el objeto recibido para mantener compatibilidad hacia adelante.

---

## 5. Reglas de validación

El sobre remoto debe cumplir las siguientes reglas:

| Campo | Regla |
|---|---|
| `id` | Debe ser `string` y no estar vacío |
| `version` | Debe ser un entero no negativo |
| `status` | Debe ser `string` y no estar vacío |
| `payload` | Debe ser un objeto o `null` |

Un `payload` con valor `null` es válido y no debe considerarse automáticamente como un error.

El cliente no debe inventar información para sustituir un `payload` `null`.

**Ejemplo válido:**

```json
{
  "id": "r-2",
  "version": 3,
  "status": "closed",
  "payload": null,
  "ignored": "forward-compatible"
}
```

**Ejemplos inválidos:**

```json
{
  "id": "",
  "version": 1,
  "status": "open",
  "payload": null
}
```

```json
{
  "id": "r-3",
  "version": "3",
  "status": "open",
  "payload": null
}
```

Una entrada que no sea un objeto válido, como `null`, también debe ser rechazada.

---

## 6. DTO y datos de aplicación

El cliente debe separar los datos recibidos del backend de los datos utilizados por la aplicación.

El flujo esperado es:

```
Backend
   ↓
Cliente
   ↓
parseRemoteResource
   ↓
Validación
   ↓
Datos de aplicación
   ↓
UI
```

`parseRemoteResource` valida el límite del contrato remoto, pero no sustituye la validación específica del dominio.

Por ejemplo, que `payload` sea un objeto válido no significa que todos sus campos internos sean automáticamente válidos para la aplicación.

> La interfaz de usuario no debe trabajar directamente con respuestas HTTP sin validar.

---

## 7. Respuestas y errores

El cliente debe distinguir entre los principales resultados de una operación.

### Respuesta válida

El servidor respondió y los datos cumplen el contrato.

```ts
{
  ok: true,
  value: ...
}
```

### Error de contrato

El servidor respondió, pero la estructura no cumple el contrato.

```ts
{
  ok: false,
  error: 'contract'
}
```

### Error del servidor

El backend puede producir una respuesta HTTP 500 mediante la variante:

```
server_error
```

### Rate limit

El backend puede responder 429 mediante:

```
rate_limited
```

### Timeout

La variante:

```
slow
```

permite probar respuestas lentas.

También existe:

```
timeout_after_commit
```

para comprobar el caso en que una escritura puede haberse guardado en el servidor aunque el cliente no reciba la respuesta.

Los diferentes casos no deben tratarse como un único error genérico.

---

## 8. Pruebas del contrato

La prueba pública de Week 5 verifica el comportamiento de `parseRemoteResource`.

Los casos establecidos son:

| Entrada | Resultado esperado |
|---|---|
| `id` válido, `version` válida, `status` válido y `payload` objeto | `true` |
| `payload: null` con campo adicional | `true` |
| `id: ""` | `false` |
| `version: "3"` | `false` |
| `null` | `false` |

La prueba verifica:

```ts
parseRemoteResource(input).ok
```

Estos casos comprueban específicamente el límite del contrato remoto.

Las pruebas adicionales de Week 5 deben comprobar también las variantes del backend, incluyendo respuestas exitosas, payloads inválidos, timeout y errores del servidor.

Los resultados esperados y observados deberán conservarse en:

```
reports/week-05/contract-tests.json
reports/week-05/failure-matrix.json
```

La evidencia de ingeniería deberá relacionar estas pruebas con la implementación realizada.