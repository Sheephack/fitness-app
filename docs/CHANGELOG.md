# Changelog

## Release 1.2 bis — 2026-08-30

### Added

- Sistema visual dark-first con superficies azul profundo, acento violeta, datos semánticos y navegación de iconos outline.
- Panel energético de Inicio, rail horizontal de comidas, gráfico de Peso central y menú rápido de acciones existentes.
- Assets editoriales locales sin marca para recomendación nutricional y avena; los alimentos no mapeados mantienen un icono de categoría honesto.
- Preferencias persistentes para mano del menú rápido y visualización de macros.

### Changed

- Inicio, Diario y Peso sustituyen la composición anterior por jerarquías de uso diario orientadas a lectura y registro rápido.
- Los anillos de energía y macros ahora comparten una convención simple: track neutro, objetivo tenue y progreso sólido desde las 12. Los macros avanzan hasta el máximo de su rango y muestran el rango completo como texto.
- Diario evita tiles vacíos altos y ofrece una única superficie activa; el selector de alimentos incluye salida inmediata en la cabecera.
- Peso adapta su CTA al ancho y a Dynamic Type, y localiza Tendencia, Resumen y Estadísticas.

### Fixed

- Overflow del CTA de peso en español y claves de traducción visibles en bruto.
- Espacio vacío excesivo del rail de comidas, recorte de la imagen editorial y solapamiento visual entre energía restante y el ring.
- Geometría y legibilidad del menú rápido en iPhone.
- Marcadores ambiguos y semántica inconsistente de los rings cuando el consumo es cero.

### Validation

- Formato, lint, typecheck, Expo Doctor, bundle iOS y 49 pruebas automatizadas correctas.
- QA visual en iPhone aprobada por el usuario tras las rondas de feedback.
