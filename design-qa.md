# Design QA — rediseño nocturno

Fecha de cierre: 2026-08-30

## Referencia y alcance

La revisión compara la composición implementada con la referencia nocturna entregada: fondo azul profundo, violeta eléctrico, cian como dato activo, superficies estratificadas e iconografía outline. La marca y el wordmark de la referencia no se usan; el producto conserva el nombre Fitness App.

## Cambios verificables en implementación

| Área | Implementación |
| --- | --- |
| Inicio | Panel de energía con número dominante, banda de restante y anillo SVG de tres capas: track, objetivo tenue y consumo sólido. Los cuatro instrumentos de macro usan exactamente la misma convención y muestran el rango completo. |
| Diario | Rail horizontal de cinco comidas con iconos circulares de 52 pt y una única superficie activa. Los vacíos usan una acción compacta, no tiles altos. |
| Peso | Cabecera adaptable a ancho y Dynamic Type, pestañas funcionales Tendencia/Resumen/Estadísticas, gráfico central con área tonal y punto seleccionado, y filas de historial densas. |
| Flujos complementarios | Menú rápido radial de acciones existentes; catálogo con thumbnail sólo para avena/oats y un icono de categoría para cualquier alimento no mapeado. |
| Accesibilidad | Acciones primarias y del rail tienen 44 pt o más; el rail es desplazable horizontalmente; los estados activos combinan color con borde, forma o posición. |

## Evidencia técnica

- `npm.cmd run format:check`: correcto.
- `npm.cmd run lint`: correcto.
- `npm.cmd run typecheck`: correcto.
- `npm.cmd run test:ci`: correcto, 19 suites y 49 pruebas.
- `npm.cmd run doctor`: correcto, 18/18 controles.
- `npm.cmd run bundle:ios`: correcto; incluye los dos assets editoriales.

## QA visual automatizada

Se inició la vista web local en el puerto 8096. La captura no pudo completarse porque la conexión de navegador del entorno terminó con `windows sandbox failed: helper_unknown_error`. No se sustituyó esa captura por una afirmación visual no verificada.

## Correcciones posteriores al feedback en iPhone

- El botón de registrar peso se apila deliberadamente bajo el título en anchos de teléfono o tipografía aumentada; así el español no compite horizontalmente con el título.
- Se añadieron las claves localizadas de las pestañas Resumen y Estadísticas; no se muestran más claves de traducción en bruto.
- El rail horizontal de comidas declara una altura fija y no puede expandirse para llenar el Diario vacío.
- La ilustración editorial de Inicio queda absolutamente recortada por su panel y tiene dimensiones explícitas.
- El menú rápido ya no usa transformaciones desde un contenedor de 58 pt. Su abanico se ancla al lado preferido y abre sus etiquetas hacia el interior del viewport.

## QA en iPhone real y cierre

La validación de usuario en iPhone realizó varias rondas sobre Inicio, Diario, Peso, el menú rápido y el selector de alimentos en oscuro. Sus hallazgos de overflow, localización en bruto, altura del Diario vacío, recorte de la imagen editorial, navegación de cancelación y comprensión de los rings se corrigieron y se volvieron a verificar visualmente.

La comparación automatizada sigue no disponible por el error interno del entorno de navegador, pero no se usó como sustituto de la validación real del usuario.

**Resultado final: aprobado por usuario para cierre de Release 1.2 bis.**
