# Auditoría de Seguridad y Privacidad — Semana 4

## Datos de la actividad

- **Nombre:** Axel
- **Grupo:** Por completar
- **Repositorio:** https://github.com/Axel-Ventura/CampusOps
- **Rama:** `week4/security-audit-axel`
- **Actividad:** Semana 4 — Auditoría de seguridad y privacidad

---

## 1. Objetivo

La auditoría tuvo como objetivo identificar problemas relacionados con seguridad y privacidad dentro del proyecto CampusOps, evaluar el riesgo asociado y aplicar correcciones verificables.

El análisis se realizó sobre el código existente del proyecto, considerando que CampusOps utiliza un backend educativo con datos e identidades sintéticas. Por ello, los hallazgos se diferencian entre problemas corregibles directamente y limitaciones propias del fixture educativo.

Se identificaron tres hallazgos y se corrigieron dos de ellos.

### Resumen

| # | Hallazgo | Riesgo | Acción | Estado |
|---|---|---|---|---|
| 1 | Tokens de acceso y refresh hardcodeados en el código | Exposición de credenciales si el patrón se reutiliza fuera del fixture | Migración a variables de entorno | Corregido |
| 2 | CORS configurado con `*` | Cualquier origen puede recibir permiso CORS | Origen configurable mediante variable de entorno | Corregido |
| 3 | Login basado únicamente en `actorId` sintético | En un sistema real permitiría intentar suplantar otro actor | Se documenta como limitación del fixture educativo | Documentado |

---

## 2. Hallazgo 1 — Tokens hardcodeados

### Problema

El backend contenía valores de token directamente en el código fuente, incluyendo el token de acceso y los refresh tokens utilizados por el fixture.

Aunque los valores utilizados en este proyecto son ficticios y forman parte de una práctica educativa, mantener credenciales o tokens directamente en el código es un patrón inseguro si posteriormente se reutiliza el código en un entorno real.

### Riesgo

Si el mismo patrón se utilizara con credenciales reales, cualquier persona con acceso al repositorio podría obtenerlas.

Además, cambiar una credencial requeriría modificar el código fuente en lugar de cambiar únicamente la configuración del entorno.

### Solución aplicada

Los tokens fueron trasladados a variables de entorno:

- `COURSE_BACKEND_ACCESS_TOKEN`
- `COURSE_BACKEND_REFRESH_TOKEN`
- `COURSE_BACKEND_NEXT_REFRESH_TOKEN`

El backend ahora obtiene estos valores mediante `process.env`.

También se actualizaron los self-tests para utilizar la configuración mediante variables de entorno.

### Before

El backend utilizaba valores directamente escritos en el código:

```js
accessToken: 'course-valid-token'
```

y:

```js
refreshToken: 'course-refresh-0'
```

### After

El backend utiliza variables de entorno:

```js
const accessToken = process.env.COURSE_BACKEND_ACCESS_TOKEN;
```

y:

```js
process.env.COURSE_BACKEND_REFRESH_TOKEN
```

La respuesta de refresh también utiliza:

```js
return send(response, 200, {
  accessToken,
  refreshToken: nextRefreshToken,
  expiresIn: 60
});
```

### Evidencia

- `docs/evidence/hallazgo-1-token-corregido.png`
- Prueba ejecutada:

```
npm run backend:self-test
```

```
CampusOps backend contracts: roles, reassignment conflict, lost response, idempotency, evidence and geocoding PASS.
Controlled backend self-test passed.
```

La evidencia muestra el cambio del código y la sustitución de los valores hardcodeados por variables de entorno.

---

## 3. Hallazgo 2 — CORS demasiado permisivo

### Problema

El servidor utilizaba:

```js
'access-control-allow-origin': '*'
```

Esto permitía que cualquier origen fuera considerado permitido mediante CORS.

### Riesgo

Una política CORS demasiado abierta aumenta la superficie de exposición de una API, especialmente si posteriormente el backend fuera reutilizado en un entorno donde existan datos o sesiones reales.

En este proyecto se trata de un backend educativo, por lo que el riesgo se considera principalmente una debilidad de configuración.

### Solución aplicada

Se sustituyó el origen comodín por un origen configurable mediante una variable de entorno:

```js
const allowedOrigin =
  process.env.COURSE_BACKEND_ALLOWED_ORIGIN ?? 'http://localhost:8081';
```

El servidor utiliza ahora:

```js
'access-control-allow-origin': allowedOrigin
```

De esta forma, el origen permitido puede configurarse sin modificar el código fuente.

### Before

```js
'access-control-allow-origin': '*',
```

### After

```js
const allowedOrigin =
  process.env.COURSE_BACKEND_ALLOWED_ORIGIN ?? 'http://localhost:8081';
```

y:

```js
'access-control-allow-origin': allowedOrigin,
```

### Evidencia

- `docs/evidence/hallazgo-2-cors-corregido.png`
- Comprobación mediante búsqueda del código:

```
course-backend/server.mjs:
'access-control-allow-origin': allowedOrigin,
```

- Prueba de regresión:

```
npm run backend:self-test
```

```
CampusOps backend contracts: roles, reassignment conflict, lost response, idempotency, evidence and geocoding PASS.
Controlled backend self-test passed.
```

---

## 4. Hallazgo 3 — Autenticación basada únicamente en `actorId`

### Problema

El endpoint de login acepta un `actorId` y únicamente comprueba que dicho identificador exista entre los actores sintéticos definidos por el fixture.

El flujo contiene una comprobación similar a:

```js
if (!input || !Object.hasOwn(actors, input.actorId)) {
  return send(response, 401, { code: 'unknown_fixture_actor' });
}
```

Después de comprobar que el identificador existe, se genera una sesión.

### Riesgo

En un sistema institucional real, identificar a un usuario únicamente mediante un identificador enviado por el cliente no sería suficiente para demostrar su identidad.

Una persona podría intentar utilizar el identificador de otro actor si no existiera un mecanismo adicional de autenticación.

### Solución / decisión

Este hallazgo no se modificó porque el backend está diseñado explícitamente como un fixture educativo público, con identidades sintéticas y estado en memoria.

El propio código declara:

```js
// Public, in-memory teaching fixture. Never deploy as institutional authentication.
```

Por lo tanto, modificar este comportamiento para implementar autenticación real cambiaría el contrato de la práctica.

La acción realizada consiste en documentar esta limitación y dejar explícito que el mecanismo no debe utilizarse como autenticación institucional.

### Before

El login utiliza únicamente un `actorId` sintético:

```
POST /v1/session/login

{
  "actorId": "technician-1"
}
```

### After

No se realizó una modificación funcional en este hallazgo debido a que se trata de una característica deliberada del fixture educativo.

La mejora necesaria para un sistema real sería implementar un mecanismo de autenticación apropiado y no confiar únicamente en un identificador enviado por el cliente.

### Evidencia

- `docs/evidence/hallazgo-3-autenticacion-fixture.png`
- Código de `course-backend/campusops.mjs`
- Advertencia incluida en el propio fixture:

```
Public, in-memory teaching fixture.
Never deploy as institutional authentication.
```

---

## 5. Revisión de privacidad y archivos sensibles

Durante la auditoría también se revisaron otros puntos solicitados por la actividad.

### Variables de entorno

El archivo `.gitignore` contiene:

```
.env
```

Además, `.env` no se encuentra registrado por Git.

Los valores utilizados durante las pruebas fueron variables de entorno locales y no fueron escritos como credenciales reales dentro del repositorio.

### Logs

Se revisó el proyecto en busca de:

- `console.log`
- `console.error`
- `console.warn`
- `console.debug`

No se encontraron registros que expusieran contraseñas, tokens o respuestas sensibles.

### Datos personales

Los actores e incidentes utilizados por el backend corresponden a datos sintéticos de la práctica. No se utilizaron credenciales reales, datos bancarios, números telefónicos reales ni información institucional privada.

### Mensajes de error

Los errores revisados utilizan códigos controlados como:

- `unknown_fixture_actor`
- `unauthorized`
- `controlled_failure`
- `rate_limited`

No se identificó exposición de credenciales u otra información sensible en estos mensajes.

---

## 6. Verificación final

Después de aplicar las correcciones se ejecutó:

```
npm run backend:self-test
```

Resultado:

```
CampusOps backend contracts: roles, reassignment conflict, lost response, idempotency, evidence and geocoding PASS.
Controlled backend self-test passed.
```

Esto demuestra que las modificaciones relacionadas con los tokens y CORS no rompieron los contratos existentes del backend.
