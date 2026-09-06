# Definición del problema — CampusOps

## Problema

En un campus, los estudiantes y el personal reportan constantemente fallas de infraestructura: problemas eléctricos, fugas de agua, daños en laboratorios, fallas de conectividad, equipos descompuestos, problemas de mantenimiento y riesgos de seguridad. Al no tener un sistema centralizado, estos reportes se pierden, se duplican o simplemente no se les da seguimiento. CampusOps es importante porque convierte cada incidencia en un proceso con seguimiento claro: desde que se reporta hasta que se cierra, se registra quién hizo qué y cuándo, y cada perfil (reportante, técnico, coordinador) solo puede hacer lo que le corresponde según los permisos que tenga asignados.

## Alcance

### Incluye

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