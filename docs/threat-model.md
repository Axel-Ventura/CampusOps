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