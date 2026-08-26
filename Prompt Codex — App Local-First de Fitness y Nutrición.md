# ROL Y OBJETIVO

Actuás como **Senior Product Engineer, Mobile Architect, UX Engineer y Technical Product Owner**.

Quiero que diseñes y construyas la primera versión funcional de una aplicación personal de:

- salud general;
- nutrición;
- composición corporal;
- peso;
- fitness.

Esto **NO** está pensado para convertirse inmediatamente en una plataforma gigantesca que haga todo.

La filosofía de desarrollo es:

**releases pequeñas, local-first, privacy-first, útil antes que ambiciosa.**

Inicialmente la aplicación tendrá un único usuario real: yo.

El objetivo es crear algo que realmente quiera abrir y utilizar todos los días, validar el producto mediante uso personal y solamente después considerar una publicación comercial en Apple App Store.

---

# VISIÓN DEL PRODUCTO

La mayoría de las aplicaciones de salud son buenas almacenando información pero malas transformando esa información en decisiones útiles.

Le dicen al usuario:

- calorías consumidas;
- proteína consumida;
- pasos;
- peso;
- entrenamientos.

Pero muchas veces no responden una pregunta mucho más importante:

**"Teniendo en cuenta todo lo que hice hoy, ¿qué debería hacer ahora?"**

Esta aplicación debe estar orientada a **decisiones**, no solamente a datos.

El loop principal eventualmente debería ser:

1. Registro lo que comí.
2. La aplicación conoce mis objetivos nutricionales diarios.
3. Compara mi consumo real con rangos objetivo.
4. Me indica qué nutrientes están faltando o excediéndose.
5. Sugiere qué tipo de alimento podría equilibrar el resto del día.
6. Sigue tendencias de peso a largo plazo en lugar de reaccionar emocionalmente a cada medición individual.
7. Eventualmente comprende también actividad física y entrenamiento, y adapta las recomendaciones.

Ejemplo:

En lugar de mostrar solamente:

> Proteína: 78 g  
> Carbohidratos: 180 g  
> Grasas: 65 g

La aplicación eventualmente debería poder decir:

> Actualmente estás bajo en proteína y fibra, mientras que ya estás cerca de tu objetivo de grasas. Para tu próxima comida, priorizá aproximadamente 35–45 g de proteína magra, vegetales y una fuente moderada de carbohidratos.

Este concepto es el **diferenciador principal del producto**.

---

# PRINCIPIOS FUNDAMENTALES DEL PRODUCTO

## 1. Local-first

- La aplicación debe funcionar completamente offline para sus funcionalidades esenciales.
- La información personal debe permanecer en el dispositivo por defecto.
- El MVP no debe requerir una cuenta.
- Ninguna funcionalidad esencial debe depender de servicios cloud.
- Las integraciones online futuras deben actuar como mejoras opcionales, no como requisitos para utilizar la aplicación.

## 2. Privacy-first

- Los datos de salud pertenecen al usuario.
- No debe existir publicidad basada en información de salud.
- No vender datos de salud.
- No implementar analytics que puedan filtrar información sensible.
- Diseñar la arquitectura contemplando una integración futura con Apple Health / HealthKit.
- Nunca enviar información personal o de salud fuera del dispositivo sin consentimiento explícito.

## 3. Complejidad progresiva

- No implementar funcionalidades únicamente porque otras aplicaciones las tengan.
- Cada release debe resolver un problema concreto.
- Evitar abstracciones prematuras.
- Evitar infraestructura backend prematura.
- No construir Releases futuras antes de que las anteriores sean estables y útiles.

## 4. Interacción rápida

Registrar comida debe ser extremadamente rápido.

Las comidas y alimentos utilizados frecuentemente deberían poder registrarse con muy pocos taps.

La aplicación debería sentirse más cercana a un **dashboard diario personal** que a una base de datos médica.

## 5. Orientación, no juicio

No etiquetar días individuales como éxitos o fracasos.

Evitar estados rojos agresivos ante fluctuaciones normales.

Preferir:

- rangos;
- tendencias;
- contexto;
- recomendaciones accionables.

La aplicación debe ayudar al usuario a decidir qué hacer después, no castigarlo por lo que ya hizo.

## 6. Fitness, no tratamiento médico

La aplicación ofrece:

- wellness general;
- seguimiento fitness;
- seguimiento nutricional;
- planificación personal.

No debe:

- diagnosticar enfermedades;
- recomendar tratamientos médicos;
- presentarse como reemplazo de profesionales de la salud.

La arquitectura, UX y copy deben preservar claramente este límite.

---

# PLATAFORMA OBJETIVO

Plataforma principal:

- iOS.

Posible plataforma futura:

- Android.

Background del desarrollador:

- experiencia fuerte con React / JavaScript;
- experiencia con TypeScript;
- preferencia por TypeScript siempre que sea razonable.

Stack inicial recomendado:

- React Native;
- TypeScript;
- Expo cuando sea apropiado;
- Expo Development Builds cuando funcionalidades nativas lo requieran.

No utilizar Expo Go como una limitación arquitectónica si funcionalidades nativas futuras como HealthKit requieren módulos nativos.

Antes de elegir dependencias:

- verificar que estén activamente mantenidas;
- preferir soluciones oficiales o ampliamente utilizadas;
- evitar wrappers abandonados;
- mantener integraciones nativas reemplazables;
- no incorporar dependencias grandes sin una justificación concreta.

---

# LOCALIZACIÓN E INTERNACIONALIZACIÓN

La aplicación debe estar preparada para múltiples idiomas **desde Release 0**.

Idiomas iniciales:

- Español;
- Inglés.

## Comportamiento inicial

En el primer inicio:

1. Detectar el idioma y región configurados en el dispositivo.
2. Si el idioma es español, utilizar español.
3. Si el idioma es inglés, utilizar inglés.
4. Para cualquier otro idioma no soportado inicialmente, utilizar un fallback definido.
5. El fallback inicial recomendado es inglés.

El usuario siempre debe poder cambiar manualmente el idioma desde Settings.

## Requisitos

Implementar una arquitectura de internacionalización que permita:

- español;
- inglés;
- agregar idiomas futuros sin reescribir componentes.

No hardcodear strings visibles directamente dentro de componentes de UI.

Utilizar archivos o recursos de traducción organizados aproximadamente como:

```text
src/
  i18n/
    locales/
      es/
      en/
```

La selección manual del idioma debe persistirse localmente.

## Localización regional

Distinguir entre:

- idioma de la interfaz;
- configuración regional;
- sistema de unidades.

Los formatos deben respetar locale cuando corresponda:

- fechas;
- números;
- separadores decimales;
- porcentajes;
- horas.

Ejemplo:

Español Argentina:

```text
25/08/2026
1.250,5
```

Inglés Estados Unidos:

```text
08/25/2026
1,250.5
```

No asumir que cambiar el idioma implica automáticamente cambiar las unidades.

Ejemplo:

Un usuario puede utilizar:

- interfaz en inglés;
- sistema métrico.

## Contenido generado dinámicamente

Los textos generados por el Daily Balance Engine también deben utilizar el sistema de localización.

No generar solamente frases completas hardcodeadas.

Las reglas del motor deben producir estados o resultados semánticos que puedan transformarse posteriormente en copy localizado.

Ejemplo:

```ts
{
  proteinStatus: "below_target",
  fiberStatus: "below_target",
  fatStatus: "near_upper_limit"
}
```

La capa de presentación puede convertirlo en:

Español:

> Estás bajo en proteína y fibra y cerca del límite superior de grasas.

Inglés:

> You're currently low on protein and fiber while approaching the upper end of your preferred fat range.

La lógica nutricional no debe depender del idioma.

---

# ARQUITECTURA

Preferir:

## Mobile

React Native + TypeScript.

## Base de datos local

SQLite.

Utilizar una capa limpia de:

- repository;
- data access;
- domain services.

El objetivo es permitir que el almacenamiento pueda reemplazarse o sincronizarse en el futuro sin reescribir la lógica de aplicación.

Opciones posibles:

- `expo-sqlite`;
- Drizzle ORM solamente si mejora genuinamente la mantenibilidad.

No introducir un ORM únicamente por estética arquitectónica.

## Estado

Utilizar manejo de estado simple y predecible.

Candidatos:

- Zustand;
- React Context para estado suficientemente local.

Evitar Redux salvo que exista una razón concreta.

## Validación

Utilizar:

- Zod;
- o equivalente.

## Testing

Crear:

- unit tests para cálculos nutricionales;
- unit tests para tendencias de peso;
- unit tests para cálculos de objetivos;
- unit tests para lógica del Daily Balance Engine;
- una cantidad pequeña de tests de UI/integración de alto valor.

Toda lógica matemática o nutricional debe ser independiente del framework y altamente testeable.

---

# ESTRUCTURA DEL REPOSITORIO

Crear una estructura aproximadamente similar a:

```text
src/
  app/
  components/
  features/
    onboarding/
    dashboard/
    nutrition/
    weight/
    settings/
  domain/
    nutrition/
    body/
    goals/
  db/
  services/
  hooks/
  utils/
  types/
  i18n/
    locales/
      es/
      en/
```

La regla arquitectónica más importante:

**La lógica de negocio no debe vivir dentro de componentes de UI.**

Los cálculos nutricionales deben implementarse como funciones puras siempre que sea posible.

La internacionalización tampoco debe mezclarse con la lógica nutricional.

---

# ROADMAP DE RELEASES

No desarrollar todas las releases al mismo tiempo.

Inicialmente implementar **SOLAMENTE Release 0 y Release 1**.

Documentar las releases posteriores sin implementarlas.

---

# RELEASE 0 — FUNDACIÓN

## Objetivo

Crear un shell estable de aplicación nativa capaz de almacenar información personal localmente.

## Onboarding

Recolectar:

- nombre o nickname;
- fecha de nacimiento / edad;
- sexo biológico solamente si es necesario para cálculos;
- altura;
- peso actual;
- peso objetivo;
- unidades preferidas;
- nivel general de actividad;
- objetivo principal.

Objetivos iniciales:

- perder peso;
- mantener peso;
- aumentar peso.

Permitir editar toda esta información posteriormente.

## Idioma inicial

Durante el primer inicio:

- detectar idioma/región del dispositivo;
- configurar español o inglés automáticamente;
- utilizar fallback si no está soportado;
- permitir cambiar posteriormente el idioma desde Settings.

## Settings

Permitir:

- cambiar idioma entre Español / English;
- unidades métricas / imperiales;
- configuración del ritmo objetivo;
- reset completo de datos;
- placeholder para exportación futura;
- información de privacidad.

## Base de datos

Diseñar migrations desde el comienzo.

Crear schemas locales para:

- profile;
- body measurements;
- weight entries;
- nutrition goals;
- foods;
- food servings;
- meals;
- food log entries;
- preferences/settings cuando corresponda.

Agregar:

- timestamps;
- UUIDs estables.

---

# RELEASE 1 — NÚCLEO DEL PRODUCTO

Esta es la release más importante.

## SEGUIMIENTO DEL PESO

Permitir registrar peso corporal.

Mostrar:

- peso actual;
- último cambio;
- promedio móvil de 7 días;
- tendencia de 30 días cuando exista suficiente información;
- progreso hacia peso objetivo.

No reaccionar exageradamente a fluctuaciones diarias.

Ejemplo:

Si la medición de hoy aumentó pero el promedio móvil sigue descendiendo:

> Tu peso de hoy aumentó ligeramente, pero la tendencia semanal continúa bajando.

---

# MOTOR NUTRICIONAL

Este es el corazón de Release 1.

Permitir configurar:

- objetivo calórico;
- rango objetivo de proteína;
- rango objetivo de carbohidratos;
- rango objetivo de grasas;
- rango objetivo de fibra.

La primera versión puede utilizar objetivos configurados manualmente por el usuario.

Releases futuras podrán sugerirlos automáticamente.

## Importante

Representar objetivos nutricionales como **rangos**, no como números innecesariamente precisos.

Ejemplo:

```text
Proteína
120–140 g
```

No:

```text
133,72 g
```

---

# BASE DE DATOS DE ALIMENTOS

Cada alimento debe incluir como mínimo:

- nombre;
- marca opcional;
- descripción de porción;
- gramos por porción;
- calorías;
- proteína;
- carbohidratos;
- grasas;
- fibra;
- sodio opcional;
- origen / custom flag.

Release 1 debe permitir:

- crear alimentos manualmente;
- editar alimentos;
- borrar alimentos custom;
- buscar alimentos locales;
- alimentos recientes;
- favoritos;
- comidas reutilizables.

No integrar todavía una API comercial de alimentos.

La base puede incluir un pequeño dataset de ejemplo únicamente para desarrollo/testing.

El diseño del dominio debe contemplar que en futuras releases los alimentos puedan tener además:

- barcode;
- fuente externa;
- identificador de fuente externa;
- fecha de última actualización;
- estado de verificación.

---

# REGISTRO DE COMIDAS

Permitir registrar alimentos dentro de:

- Desayuno;
- Almuerzo;
- Snack / Merienda;
- Cena;
- Otro.

La UI debe optimizar el uso repetido.

Funcionalidades importantes:

- alimentos recientes;
- favoritos;
- duplicar comida de ayer;
- comidas guardadas/reutilizables;
- multiplicador de cantidad.

Ejemplo:

```text
Pechuga de pollo
Porción: 150 g
Cantidad: 1.5
```

Los totales nutricionales deben actualizarse inmediatamente.

---

# DASHBOARD NUTRICIONAL DIARIO

Mostrar:

- calorías;
- proteína;
- carbohidratos;
- grasas;
- fibra.

Cada métrica debe mostrar:

- consumido;
- objetivo/rango;
- cantidad restante;
- visualización de progreso.

Evitar estados rojos agresivos.

Usar estados conceptuales aproximadamente como:

- debajo del objetivo;
- dentro del objetivo;
- por encima del rango preferido.

---

# DAILY BALANCE ENGINE

Implementar un motor determinístico de recomendaciones.

**NO utilizar IA todavía.**

Inputs:

- objetivos nutricionales;
- nutrición consumida;
- calorías/macros restantes;
- contexto temporal/comida si está disponible.

Output:

Una evaluación breve y legible para humanos.

Ejemplos:

> Actualmente estás debajo de tus objetivos de proteína y fibra.

> Estás cerca del límite superior de tu rango preferido de grasas.

> Para las comidas restantes, priorizá proteínas magras y vegetales.

Otro ejemplo:

> Tu consumo de proteína está dentro del objetivo, mientras que los carbohidratos continúan relativamente bajos. Todavía tenés suficiente presupuesto calórico para una comida con mayor contenido de carbohidratos.

El sistema debe utilizar reglas explícitas y testeables.

Crear estas reglas como funciones TypeScript independientes.

No enterrarlas dentro de componentes.

El motor debe producir resultados semánticos independientes del idioma.

La capa de localización será responsable de transformarlos en español o inglés.

---

# HOME SCREEN

La pantalla principal debe responder una pregunta:

**"¿Cómo voy hoy?"**

Estructura sugerida:

```text
Buenas noches, Mati

HOY

Calorías
1840 / 2200

Proteína
96 / 120–140 g

Carbohidratos
170 / 180–230 g

Grasas
64 / 55–70 g

Fibra
18 / 25–35 g

Tendencia de peso
↓ 0,6 kg/semana
```

Después:

## BALANCE DE HOY

> Actualmente estás bajo en proteína y fibra mientras te acercás al límite superior de tu rango preferido de grasas.

## PRÓXIMO MEJOR MOVIMIENTO

> Priorizá aproximadamente 30–40 g de proteína magra junto con vegetales en tu próxima comida.

Acciones rápidas:

```text
+ Registrar comida
+ Registrar peso
```

La interfaz debe ser visualmente tranquila.

No crear un dashboard con veinte tarjetas sin relación entre sí.

---

# ESTILO UX

La aplicación debería sentirse:

- moderna;
- contenida;
- tranquila;
- premium;
- técnica sin parecer clínica;
- informativa sin resultar abrumadora.

Evitar:

- gradients excesivos;
- gamificación en todas partes;
- estética cartoon fitness;
- mensajes culpabilizadores;
- interfaces dominadas por emojis;
- decenas de widgets de dashboard.

Utilizar:

- tipografía fuerte;
- buen espaciado;
- jerarquía visual clara;
- colores de acento contenidos.

Soportar dark mode desde el comienzo.

---

# DESIGN SYSTEM

Crear primitives reutilizables:

- Button;
- Card;
- ProgressBar;
- MacroProgress;
- NumberInput;
- FormField;
- BottomSheet;
- EmptyState;
- SectionHeader;
- Metric;
- TrendIndicator.

Utilizar:

- spacing tokens;
- typography tokens;
- color tokens.

No distribuir styling arbitrario por todos los componentes.

---

# ACCESIBILIDAD

Implementar:

- compatibilidad razonable con Dynamic Type;
- contraste legible;
- labels para controles interactivos;
- tamaños mínimos apropiados para touch;
- controles compatibles con VoiceOver.

La localización debe contemplar que algunos textos pueden ocupar más espacio en un idioma que en otro.

No diseñar layouts que dependan de longitudes exactas de strings.

---

# PORTABILIDAD DE DATOS

Aunque cloud sync no forme parte de Release 1, preparar la arquitectura para:

- exportación JSON;
- importación JSON;
- backup cifrado;
- sincronización self-hosted opcional.

Los domain objects deben mantenerse serializables.

---

# RELEASES FUTURAS — SOLO DOCUMENTAR

No implementar todavía.

---

# RELEASE 2 — INTELIGENCIA NUTRICIONAL

Posibles funcionalidades:

- estimación automática de calorías;
- estimación de TDEE;
- objetivo calórico adaptativo basado en tendencia real de peso;
- sugerencias de macros;
- micronutrientes;
- recomendaciones de comidas según objetivos restantes;
- escaneo de códigos de barras;
- integración con Open Food Facts u otra base abierta de alimentos.

## Escaneo futuro de alimentos

Diseñar esta funcionalidad con una filosofía **barcode-first**.

Flujo ideal:

1. Usuario toca "Registrar alimento".
2. Puede buscar localmente o escanear un código de barras.
3. La cámara detecta EAN/UPC.
4. Primero comprobar si el producto ya existe en la base local.
5. Si existe, mostrar inmediatamente el alimento almacenado.
6. Si no existe localmente y hay conexión, consultar una fuente externa.
7. Si existe externamente, autocompletar:
   - nombre;
   - marca;
   - tamaño/porción cuando esté disponible;
   - calorías;
   - proteína;
   - carbohidratos;
   - grasas;
   - fibra;
   - sodio cuando esté disponible.
8. Mostrar una pantalla de revisión antes de guardarlo.
9. El usuario puede corregir cualquier información.
10. Guardar una copia local para usos futuros.
11. Si el producto no existe externamente, ofrecer creación manual con el barcode ya registrado.

La ausencia de un producto remoto **no debe considerarse un error de aplicación**.

Nunca obligar al usuario a volver a escanear un producto ya conocido localmente.

La funcionalidad esencial de alimentación debe seguir funcionando offline.

---

# RELEASE 3 — ENTRENAMIENTO

Agregar:

- planes de entrenamiento;
- ejercicios;
- series;
- repeticiones;
- duración;
- historial de entrenamientos;
- progressive overload;
- referencias de video/tutorial;
- perfiles de equipamiento disponible;
- modos casa/gimnasio.

---

# RELEASE 4 — APPLE HEALTH / HEALTHKIT

Posibles lecturas:

- peso corporal;
- pasos;
- energía activa;
- workouts;
- frecuencia cardíaca cuando sea relevante;
- frecuencia cardíaca en reposo;
- sueño solamente si la dirección del producto lo justifica.

Posibles escrituras:

- peso corporal;
- datos nutricionales solamente cuando sea útil y semánticamente correcto;
- workouts creados por la aplicación.

El acceso a HealthKit siempre debe ser opcional.

La aplicación debe continuar siendo útil sin HealthKit.

Utilizar:

- permisos granulares;
- explicaciones claras antes de solicitar autorización.

---

# RELEASE 5 — PERSONAL COACH

Introducir un asistente opcional capaz de razonar sobre los datos personales del usuario.

Ejemplos:

> ¿Qué debería comer esta noche?

> ¿Por qué dejó de bajar mi peso?

> Hoy solamente tengo 20 minutos para entrenar.

> Voy a comer pizza esta noche. ¿Cómo puedo organizar el resto del día?

El asistente debe recibir **resúmenes estructurados**, no acceso irrestricto a la base de datos.

Toda integración con IA remota debe requerir consentimiento explícito antes de que información relacionada con salud abandone el dispositivo.

---

# RELEASE 6 — NUTRICIÓN Y PRESUPUESTO

Permitir opcionalmente registrar precios de alimentos.

Calcular:

- costo por porción;
- costo por comida;
- costo nutricional diario;
- costo nutricional semanal;
- costo por 100 g de proteína;
- comparación de costos entre alternativas nutricionalmente similares.

Ejemplo:

> La comida B proporciona aproximadamente la misma cantidad de proteína que la comida A, pero cuesta un 32 % menos.

Esta funcionalidad debería ser especialmente útil en entornos con inflación elevada.

---

# POSIBLE BACKEND SELF-HOSTED

No implementarlo inicialmente.

Documentar una arquitectura futura simple utilizando, por ejemplo:

- Node.js / TypeScript;
- PostgreSQL;
- Docker Compose;
- sincronización autenticada y cifrada.

El backend debe ser opcional.

Los datos locales deben continuar siendo autoritativos siempre que sea posible.

No diseñar el producto alrededor de conectividad permanente.

---

# SEGURIDAD

Tratar toda información relacionada con salud como sensible.

Requisitos:

- no incluir secretos plaintext en el repositorio;
- no incluir datos de salud en analytics;
- no incluir peso/nutrición en crash reports;
- validar inputs de base de datos;
- utilizar almacenamiento seguro provisto por el sistema operativo para futuros secretos de autenticación;
- diseñar exportaciones intencionalmente;
- nunca subir información del usuario silenciosamente.

---

# PRINCIPIOS COMERCIALES

El producto futuro debe evitar explícitamente modelos de suscripción abusivos.

Las funcionalidades esenciales de tracking nunca deben degradarse artificialmente para obligar al usuario a pagar.

Modelos potenciales:

- aplicación core gratuita;
- compra Pro opcional de pago único;
- uso de IA pago solamente si genera costos recurrentes reales;
- sincronización cloud paga solamente si la infraestructura genera costos recurrentes.

No implementar pagos todavía.

---

# PREPARACIÓN PARA APP STORE

Documentar, pero no implementar prematuramente:

- inscripción en Apple Developer Program;
- App Identifier / Bundle Identifier;
- signing;
- App Store Connect;
- TestFlight;
- screenshots;
- Privacy Manifest;
- Privacy Policy;
- Support URL;
- metadata de App Store;
- textos de permisos HealthKit;
- cuestionario App Privacy.

Toda funcionalidad HealthKit debe cumplir las App Store Review Guidelines vigentes de Apple.

Antes de implementar HealthKit en una release futura, verificar la documentación actual de Apple en lugar de depender únicamente de supuestos escritos en este prompt.

---

# REGLAS DE CALIDAD DE CÓDIGO

Utilizar:

- TypeScript strict mode;
- domain types explícitos;
- ESLint;
- Prettier;
- nombres significativos;
- módulos pequeños;
- funciones puras para cálculos;
- tests sobre fórmulas críticas.

Evitar:

- componentes gigantes;
- magic numbers;
- design patterns prematuros;
- abstracciones innecesarias;
- arquitectura placeholder generada únicamente para parecer sofisticada;
- comentarios TODO por todas partes;
- APIs falsas simulando funcionalidades inexistentes.

Si algo no está implementado, mostrar un estado deshabilitado/placeholder honesto.

No simular que una funcionalidad existe.

---

# DOCUMENTACIÓN

Crear:

```text
README.md
```

Debe incluir:

- visión del producto;
- arquitectura;
- requisitos de desarrollo;
- setup;
- cómo ejecutar iOS;
- funcionamiento del almacenamiento local;
- testing;
- localización;
- roadmap.

Crear además:

```text
docs/
  PRODUCT.md
  ARCHITECTURE.md
  ROADMAP.md
  PRIVACY.md
  LOCALIZATION.md
```

Documentar decisiones técnicas importantes.

---

# PRIMER PLAN DE EJECUCIÓN

Antes de escribir código de aplicación:

1. Inspeccionar el repositorio.
2. Si está vacío, inicializar el proyecto mobile.
3. Escribir un plan de implementación conciso.
4. Proponer la lista final de dependencias.
5. Explicar cualquier dependencia que introduzca código nativo.
6. Configurar la arquitectura de localización español/inglés.
7. Implementar Release 0.
8. Ejecutar tests, typecheck y lint.
9. Implementar Release 1.
10. Agregar tests para cálculos nutricionales.
11. Agregar tests para el Daily Balance Engine.
12. Verificar localización español/inglés.
13. Ejecutar la aplicación y verificar el flujo principal.
14. Corregir errores antes de declarar finalizado el trabajo.
15. Entregar un informe final de implementación.

No saltear silenciosamente funcionalidades rotas.

---

# ACCEPTANCE TEST

Al finalizar debo poder:

1. Abrir la aplicación.
2. Ver la interfaz inicialmente en el idioma apropiado según la configuración del dispositivo.
3. Completar onboarding.
4. Ingresar mi perfil corporal.
5. Configurar objetivos nutricionales.
6. Registrar mi peso actual.
7. Crear un alimento custom.
8. Registrar ese alimento en el desayuno.
9. Registrar varios alimentos adicionales.
10. Ver calorías/macros actualizarse inmediatamente.
11. Ver qué nutrientes/macros quedan disponibles.
12. Recibir un resumen determinístico de "Balance de hoy".
13. Recibir una recomendación de "Próximo mejor movimiento".
14. Cambiar el idioma manualmente entre español e inglés.
15. Verificar que el cambio de idioma no borre ni modifique información personal.
16. Cerrar la aplicación.
17. Volver a abrirla.
18. Ver toda mi información todavía presente offline.
19. Verificar que la preferencia de idioma seleccionada permanezca persistida.

Si estos pasos funcionan de manera confiable, Release 1 es exitosa.

No implementar Releases 2–6 hasta que Release 1 sea estable y genuinamente útil.

La prioridad no es la cantidad de funcionalidades.

La prioridad es:

**construir la versión más pequeña posible que sea genuinamente útil todos los días.**