# Definición del problema — CampusOps

## Problema

<<<<<<< Updated upstream
En un campus, los estudiantes y el personal reportan constantemente fallas de infraestructura: problemas eléctricos, fugas de agua, daños en laboratorios, fallas de conectividad, equipos descompuestos, problemas de mantenimiento y riesgos de seguridad. Al no tener un sistema centralizado, estos reportes se pierden, se duplican o simplemente no se les da seguimiento. CampusOps es importante porque convierte cada incidencia en un proceso con seguimiento claro: desde que se reporta hasta que se cierra, se registra quién hizo qué y cuándo, y cada perfil (reportante, técnico, coordinador) solo puede hacer lo que le corresponde según los permisos que tenga asignados.
=======
En un campus universitario ficticio, la gestión de incidencias físicas e infraestructura (daños en laboratorios, fallas eléctricas, fugas de agua, equipos descompuestos) carece de un sistema centralizado de seguimiento, provocando retrasos en las atenciones y falta de visibilidad para la comunidad universitaria. CampusOps resuelve esta problemática unificando el reporte, la asignación, la atención sin conexión y la resolución transparente de reportes desde una misma aplicación móvil.
>>>>>>> Stashed changes

## Alcance

### Incluye

<<<<<<< Updated upstream
- Inicio de sesión y cierre de sesión seguro para los tres perfiles (reportante, técnico, coordinador)
- Registro y seguimiento de incidencias, desde que se reportan hasta que se cierran
- Asignación, priorización y reasignación de incidencias, con historial completo
- Atención de incidencias por parte del técnico, aunque no haya conexión a internet

### No incluye

- Uso de datos, ubicaciones o personas reales
- Pagos o integración con sistemas institucionales reales
- Chat en tiempo real o panel web administrativo completo
- IA para reconocimiento de imágenes

## Actores y responsabilidades

- **Reportante:** Inicia sesión y crea una incidencia con categoría, descripción, ubicación y evidencia fotográfica. Puede consultar sus reportes y actualizarlos después.
- **Técnico:** Inicia sesión y revisa las incidencias que le asignaron. Registra su diagnóstico con evidencia, y marca la incidencia como resuelta cuando termina. Puede seguir trabajando aunque no tenga conexión a internet.
- **Coordinador:** Inicia sesión y revisa todas las incidencias, decide prioridades y asigna (o reasigna) un técnico a cada una. Revisa el historial y las evidencias, y cierra una incidencia resuelta o la reabre si algo no quedó bien.

## Flujo principal

1. Reportar: El reportante crea la incidencia con categoría, descripción, ubicación y evidencia. Queda en estado "abierta".
2. Asignar: El coordinador revisa la incidencia, decide su prioridad y la asigna a un técnico. Pasa a estado "asignada".
3. Atender: El técnico empieza a trabajar y registra su diagnóstico, incluso sin conexión a internet. La incidencia pasa a "en proceso" y luego a "resuelta" cuando termina.
4. Cerrar: El coordinador revisa el trabajo del técnico y cierra la incidencia. Si algo no quedó bien, puede reabrirla y regresa a estado "asignada". Cada cambio queda registrado en el historial.

## Criterios de aceptación verificables

1. Dado que un reportante consulta la lista de incidencias, cuando la pantalla carga, entonces solo ve las que él mismo reportó, no las de otros usuarios.
2. Dado que un técnico está sin conexión a internet, cuando registra un diagnóstico, entonces puede seguir trabajando con normalidad y los datos se guardan localmente hasta que vuelva la conexión.
3. Dado que se cierra una incidencia, cuando alguien consulta su historial, entonces puede ver todos los cambios de estado anteriores con fecha y responsable.
=======
- Gestión del ciclo de vida completo de incidencias: reporte, asignación, diagnóstico, atención y cierre final.
- Registro de evidencias fotográficas, notas técnicas de atención y ubicación del incidente.
- Autenticación y control de acceso basado en tres perfiles operativos (Reportante, Técnico y Coordinador).
- Soporte para trabajo sin conexión mediante una cola de cambios persistente y sincronización con detección de conflictos.

### No incluye

- Atención de llamadas de emergencia en tiempo real ni integración con servicios de auxilio público.
- Procesamiento de pagos, mensajería/chat instantáneo en vivo o panel de administración web completo.

## Actores y responsabilidades

- **Reportante:** Crear reportes de incidencias con categoría, descripción, ubicación y fotos; además de consultar el estado actual de sus solicitudes.
- **Técnico:** Consultar incidencias asignadas, registrar notas de diagnóstico, adjuntar fotos de solución, actualizar el estado de atención y operar de manera local/offline.
- **Coordinador:** Supervisar el catálogo global de reportes, priorizar, asignar o reasignar técnicos, reabrir casos y autorizar el cierre definitivo de las incidencias.

## Flujo principal

1. Reportar: El Reportante detecta la falla, captura fotografía/ubicación y crea el reporte quedando en estado `open`.
2. Asignar: El Coordinador evalúa el reporte y lo asigna a un Técnico responsable, cambiando a estado `assigned`.
3. Atender: El Técnico inicia la revisión (`in_progress`), realiza la reparación, adjunta evidencia y marca el reporte como `resolved`.
4. Cerrar: El Coordinador valida las evidencias entregadas y autoriza el cambio definitivo a `closed` (o reabre la incidencia si requiere mayor trabajo).

## Criterios de aceptación verificables

1. Dado que un usuario autenticado como Reportante envía un nuevo reporte con categoría, ubicación y descripción, cuando se confirma el envío, entonces la incidencia queda registrada en estado `open` y es visible en su historial personal.
2. Dado que un Técnico realiza cambios de estado y registra notas en zonas sin cobertura de red, cuando el dispositivo recupera la conexión a internet, entonces la cola de sincronización envía las operaciones en segundo plano sin perder datos ni duplicar eventos.
3. Dado que un Técnico intenta sincronizar una actualización sobre una incidencia que fue reasignada por un Coordinador mientras estaba offline, cuando se procesa la sincronización, entonces el sistema detecta el conflicto y notifica la reasignación sin sobreescribir silenciosamente los cambios.
>>>>>>> Stashed changes
