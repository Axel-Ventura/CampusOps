# Registro de riesgos — CampusOps

| Prioridad | Riesgo | Probabilidad | Impacto | Mitigación | Cómo comprobar la mitigación |
|---:|---|---|---|---|---|
| 1 | Se pierde información cuando el técnico atiende una incidencia sin conexión mientras el coordinador la reasigna al mismo tiempo | Alta, porque el trabajo sin conexión es parte esencial del proyecto y es fácil que ocurra en el uso diario | Alto, porque se podría perder el diagnóstico del técnico o la nueva asignación, afectando el historial | Detectar el conflicto al sincronizar y avisar a los involucrados en vez de sobreescribir un cambio con otro | Provocar el conflicto a propósito y revisar que el sistema muestre el aviso en vez de perder alguno de los dos cambios |
| 2 | Reintentar una operación por falla de red duplica eventos o evidencias | Media, porque las fallas de red son comunes, pero no ocurren en cada acción | Alto, porque rompería la confiabilidad del historial y la evidencia del sistema | Usar una clave única por operación para que, si se reintenta, el sistema reconozca que ya se ejecutó y no la repita | Enviar la misma operación dos veces seguidas y comprobar que solo se registre una vez |
| 3 | Los registros técnicos guardan información sensible como ubicación exacta, nombre real o fotos | Media, porque suele ser más fácil que se capturen más datos de los necesarios si no se filtra a propósito | Medio, porque afecta la privacidad de las personas involucradas, sin detener el funcionamiento de la app | Que solo guarden identificadores sintéticos, código de error y duración, nunca datos personales | Revisar uno generado y confirmar que no aparezca ningún dato personal, solo IDs |

## Riesgo que atenderíamos primero

Atenderíamos primero el riesgo de pérdida de información por los conflictos de sincronización, porque tiene la mayor probabilidad de ocurrir por la orientación de trabajo sin conexión del proyecto, ya que afecta directamente el historial de las incidencias.