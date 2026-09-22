# Modelo de Amenazas Inicial — CampusOps

## 1. Objetivo y alcance
En esta sección se analizan las amenazas de seguridad iniciales de la aplicación móvil CampusOps. Nos enfocamos en identificar la información sensible y valiosa que debemos proteger, los puntos donde cambian los niveles de acceso y se explican 4 amenazas principales asociadas con el flujo de incidencias, autenticación y manejo de registros. El alcance se limita a la arquitectura de la app móvil, el manejo de sesión del usuario y las pruebas con el servidor sintético usando datos ficticios.
## 2. Activos
A continuación se detallan los datos y recursos más importantes que la aplicación debe proteger:

| ID | Activo | Descripción | Nivel de Sensibilidad |
|---|---|---|---|
| ACT-01 | Credenciales de usuario y Tokens | Tokens de sesión (JWT) y credenciales almacenadas para autenticación. | Crítico |
| ACT-02 | Información de Incidencias | Datos de reportes, descripciones, categorías, zonas y evidencias fotográficas. | Medio |
| ACT-03 | Datos de Asignación y Control de Flujo | Estado de la incidencia y rol del técnico responsable asignado. | Alto |
| ACT-04 | Registros de Auditoría y Logs | Historial de transacciones de la app y registros de depuración del sistema. | Medio |

## 3. Límites de confianza
Los límites de confianza representan las fronteras donde los datos o las solicitudes pasan entre diferentes niveles de seguridad e inspección:

- **Límite 1 (Dispositivo / UI $\rightarrow$ Almacenamiento Local):** La interfaz de usuario almacena datos locales. Se debe garantizar que la información sensible (como tokens) no sea accesible por otras aplicaciones del sistema operativo.
- **Límite 2 (Cliente Móvil $\rightarrow$ Servicios Cloud / Backend API):** La comunicación entre la app y la API sintética cruza una red no confiable. Toda petición debe ser validada en el servidor; el cliente móvil no puede asumir confianza ciega en las solicitudes.
- **Límite 3 (Aplicación $\rightarrow$ Sistema de Logs / Consola):** La aplicación genera mensajes de diagnóstico. El límite entre el código de negocio y el recolector de logs debe impedir que credenciales o tokens se escriban en texto plano.

## 4. Amenazas

### T-01 — Consultar incidentes de otras personas
- **Qué podría pasar:** Un usuario autenticado con rol de Reportante intenta interceptar o solicitar reportes de incidencias pertenecientes a otros usuarios modificando identificadores en las peticiones.
- **Qué activo afecta:** ACT-02 (Información de Incidencias).
- **Quién podría intentar hacerlo:** Un usuario autenticado con perfil Reportante actuando de manera maliciosa o curiosa.
- **Impacto:** Violación de la privacidad de los reportes del campus y exposición no autorizada del historial de incidencias de terceros.

### T-02 — Alterar asignaciones
- **Qué podría pasar:** Un usuario no autorizado (Reportante o Técnico) intenta modificar la asignación de una incidencia o cambiar su estado directo sin pasar por el flujo formal del Coordinador.
- **Qué activo afecta:** ACT-03 (Datos de Asignación y Control de Flujo).
- **Quién podría intentar hacerlo:** Un usuario con rol Reportante o Técnico buscando evadir o reasignar responsabilidades.
- **Impacto:** Pérdida de integridad en el flujo de trabajo de CampusOps, asignaciones inconsistentes e imposibilidad de dar un seguimiento claro y ordenado a las fallas reportadas.

### T-03 — Filtrar datos mediante logs
- **Qué podría pasar:** Cuando la app presenta un error o maneja excepciones de red, podría guardar datos sensibles (como tokens o contraseñas) directamente en la consola o registros del sistema.
- **Qué activo afecta:** ACT-01 (Credenciales de usuario) y ACT-04 (Registros de Auditoría y Logs).
- **Quién podría intentar hacerlo:** Una persona con acceso al teléfono o aplicaciones con permiso para leer los registros del dispositivo.
- **Impacto:** Exposición no deseada de claves que permite a terceros acceder a la cuenta del usuario.

### T-04 — Exponer credenciales
- **Qué podría pasar:** Que contraseñas, claves de API o tokens de acceso queden escritos directamente en el código fuente, archivos de configuración, comentarios o repositorios de GitHub.
- **Qué activo afecta:** ACT-01 (Credenciales de usuario y Tokens).
- **Quién podría intentar hacerlo:** Un atacante externo que revise el código en GitHub o analice el archivo ejecutable de la app móvil.
- **Impacto:** Compromiso total de la seguridad de la aplicación, acceso no autorizado a los endpoints del servidor y reprobación automática en los controles de CI/CD.

## 5. Priorización

A continuación se priorizan las 4 amenazas identificadas en el punto anterior con base en su impacto en CampusOps:

* **T-04 — Exponer credenciales: ALTA**
  * **Justificación:** La exposición de credenciales o tokens de acceso (ACT-01) en el código, repositorios o ejecutables concede acceso total a la infraestructura y servicios del campus, vulnerando todo el sistema.
* **T-01 — Consultar incidentes de otras personas: ALTA**
  * **Justificación:** Viola directamente la privacidad de los usuarios reportantes al acceder a su información (ACT-02). Al ser un sistema de gestión de incidencias, el control de acceso a recursos ajenos es crítico.
* **T-02 — Alterar asignaciones: MEDIA**
  * **Justificación:** Afecta la integridad del flujo de trabajo y asignaciones (ACT-03). Desorganiza la operación de técnicos y coordinadores, pero no expone directamente datos confidenciales ni claves.
* **T-03 — Filtrar datos mediante logs: MEDIA**
  * **Justificación:** Requiere que un atacante tenga acceso a los archivos o consolas de logs del dispositivo/sistema (ACT-04). Es una vulnerabilidad secundaria pero importante de prevenir.

---

## 6. Controles

### Amenaza: Consultar incidentes de otras personas (T-01)
* **Control:**
  Validación estricta de autorización a nivel de objeto (BOLA) en el servidor/backend. El servidor debe verificar que el `userId` extraído del token JWT sea el propietario legítimo de la incidencia antes de devolver los datos.
* **Justificación:**
  Previene que la simple modificación de los IDs de incidencia en las peticiones HTTP de la app móvil entregue reportes de otros usuarios.

### Amenaza: Alterar asignaciones (T-02)
* **Control:**
  Control de acceso basado en roles (RBAC) en los endpoints de reasignación y cambio de estado, permitiendo la modificación de asignaciones exclusivamente a usuarios autenticados con el rol `Coordinador`.
* **Justificación:**
  Garantiza la integridad del flujo de trabajo impidiendo que los roles `Reportante` o `Técnico` se asignen casos o evadan responsabilidades sin autorización.

### Amenaza: Filtrar datos mediante logs (T-03)
* **Control:**
  Implementación de un interceptor/middleware de logging que aplique máscaras de privacidad (`[REDACTED]`) a cabeceras de autorización (`Authorization: Bearer`), contraseñas y datos sensibles antes de imprimirlos en la consola o almacenamiento.
* **Justificación:**
  Asegura que los registros de depuración o fallos de red no expongan tokens de sesión almacenados localmente en el dispositivo.

### Amenaza: Exponer credenciales (T-04)
* **Control:**
  Uso de variables de entorno mediante archivos `.env` ignorados en `.gitignore`, acompañado de linters y hooks de pre-commit con `gitleaks` para detectar e impedir la subida de secretos al repositorio de GitHub.
* **Justificación:**
  Evita que claves de API o tokens queden fijados (*hardcoded*) en el código fuente de la app móvil o expuestos públicamente en el historial de control de versiones.

---

## 7. Pruebas de verificación

| Amenaza | Control | Prueba |
| :--- | :--- | :--- |
| **T-01** | Control de autorización BOLA/IDOR | **Ejecutar** una petición `GET /incidents/{id_ajeno}` usando el token JWT de un usuario con rol `Reportante` y verificar que la API retorne un código `403 Forbidden`. |
| **T-02** | RBAC para flujo de asignaciones | **Intentar** enviar una petición `PATCH /incidents/{id}/assign` con el token de un rol `Técnico` o `Reportante` y comprobar que la respuesta sea `403 Forbidden`. |
| **T-03** | Interceptor / Sanitización de logs | **Revisar** los registros de la consola del dispositivo/simulador tras forzar un error de red o autenticación, confirmando que las claves y tokens aparezcan como `[REDACTED]`. |
| **T-04** | Hooks de seguridad y `.gitignore` | **Ejecutar** el comando `gitleaks detect --verbose` en la raíz del proyecto para verificar que no existan secretos expuestos en el código o commits locales. |

---

## 8. Riesgo residual

Después de aplicar los controles definidos, permanecen riesgos relacionados con la **extracción física de datos mediante el rooteo/jailbreak del dispositivo móvil**, **ataques de ingeniería social (phishing) para obtener credenciales de usuarios del campus** o **vulnerabilidades de día cero (*zero-day*) en dependencias externas del proyecto**. 

Estos riesgos no se consideran completamente eliminados porque los controles de software aplicados a la app móvil no pueden evitar el compromiso físico total del sistema operativo del usuario ni el engaño directo fuera de la plataforma.