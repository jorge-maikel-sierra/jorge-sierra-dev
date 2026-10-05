# Tareas — jorge-sierra.dev v2

Reglas: haz las tareas en orden. Cada tarea es un commit. Marca la casilla al terminar. No pases a la siguiente fase sin que los criterios de la fase actual se cumplan. Si algo de la especificación es ambiguo, pregunta antes de suponer.

---

## Fase 0 — Base del proyecto

- [x] **0.1 Crear la app Next.js** en la rama `next-rewrite`, en la carpeta `web/` (el código Nuxt queda intacto en la raíz hasta la Fase 6). TypeScript strict, App Router, Tailwind, pnpm, ESLint.
  - Acepta si: `pnpm dev` levanta una página vacía y `pnpm lint && pnpm typecheck` pasan.
- [x] **0.2 Tokens y tipografía**: variables CSS de `docs/design.md §3` en `globals.css`, mapeadas en Tailwind. Bricolage Grotesque y JetBrains Mono con `next/font/google`.
  - Acepta si: una página de prueba muestra los tokens y ambas fuentes sin salto de diseño.
- [x] **0.3 Variables de entorno**: `lib/env.ts` valida con zod las variables de `docs/design.md §9`; `.env.example` con todas, sin valores.
  - Acepta si: arrancar sin una variable obligatoria del servidor falla con un mensaje claro.
- [x] **0.4 Contenido tipado**: `lib/content/schema.ts` y `load.ts` para `content/es/*.json` (copiar `content/` a `web/content/`).
  - Acepta si: un test de Vitest carga los tres JSON y falla si se rompe el esquema.
- [x] **0.5 CI**: workflow de GitHub Actions con lint, typecheck, test, build y gitleaks. Proyecto en Vercel con previews por PR.
  - Acepta si: un PR de prueba muestra todos los checks en verde y un enlace de preview.

## Fase 1 — Secciones estáticas (sin 3D ni IA)

- [x] **1.1 Layout y navegación**: header con logo, enlaces a secciones y selector ES/EN (inactivo hasta Fase 6). Menú desplegable bajo 640 px como en `design-reference/Mobile-Hero.dc.html`.
- [x] **1.2 Hero estático**: titular, subtítulo, indicador de disponibilidad, caja del agente (sin funcionar aún), CTAs y línea de stack. `HeroFallback` con imagen temporal.
  - Acepta si: coincide con `Main.dc.html` y `Mobile-Hero.dc.html` en copy, colores y jerarquía; LCP < 2 s en Lighthouse móvil.
  - Excepción aceptada por Jorge (2026-10-02): LCP simulado de 2,34 s (mediana local). La traza real pinta el h1 a ~50 ms del HTML; el exceso viene del runtime de Next en la simulación de Lighthouse. Se vuelve a medir contra el preview en 6.2.
- [x] **1.3 Componente `Placeholder`** y regla global: cualquier string de contenido que empiece por `[` se renderiza con él.
- [x] **1.4 Casos de estudio**: `CaseSelector`, `CaseDetail`, `FlowDiagram` (horizontal/vertical con pulso CSS), `StatusBadge`, desde `cases.json`.
  - Acepta si: replica `Casos.dc.html` y `Mobile-Casos.dc.html`, incluido el carrusel horizontal en móvil y los bordes punteados del caso "soon"; navegación con teclado entre casos.
- [x] **1.5 Trayectoria**: `Timeline`, `AreaFilter`, `SideCards`, desde `experience.json` y `profile.json`.
  - Acepta si: replica `Trayectoria.dc.html` y su versión móvil; el filtro atenúa roles y resalta chips.
- [x] **1.6 Contacto (solo UI)**: `ContactForm` con validación zod en cliente y mensajes de error; `PipelineView` en estado de espera; `Channels`.
  - Acepta si: replica `Contacto.dc.html` y su versión móvil; un e2e prueba los tres mensajes de validación.
- [x] **1.7 SEO base**: `generateMetadata`, OG generado, JSON-LD `Person`, sitemap y robots.
  - Acepta si: Lighthouse SEO = 100 y las etiquetas Open Graph y Twitter dicen lo mismo.
- [x] **1.8 Accesibilidad**: e2e con axe en las cuatro secciones, escritorio y móvil.
  - Acepta si: cero violaciones serias o críticas.
  - Decisión de Jorge (2026-10-02): el filtro de Trayectoria atenúa con `--text-muted` en lugar de `opacity: 0.32` del prototipo, que dejaba el texto en 1,6:1. El e2e también cubre estados interactivos (caso "soon", filtro activo, error de formulario, menú móvil).

## Fase 2 — Hero 3D

- [x] **2.1 `buildGraph.ts`** con tests: 15 nodos en 5 capas, cada nodo con al menos una arista entrante o saliente, retrasos crecientes de izquierda a derecha.
- [x] **2.2 Partículas en GPU**: `Points` con atributos y shaders de `docs/design.md §4`; `uProgress` controlado por un slider de desarrollo.
  - Acepta si: 20 000 partículas a 60 fps en un portátil con GPU integrada moderna.
- [x] **2.3 Aristas, pulsos, etiquetas de capa y tokens de caos**, con sus umbrales de aparición.
- [x] **2.4 Control por scroll** (ScrollTrigger con pin en escritorio), autoplay a 1,3 s, rotación con puntero/arrastre suavizada, botón "Volver al caos" en móvil.
- [x] **2.5 Degradación**: `detect-gpu` (tier 0 → fallback; tier 1 → 8 000 partículas sin bloom), `prefers-reduced-motion` → estado final estático, pausa fuera de pantalla.
- [x] **2.6 Carga diferida**: `next/dynamic` + montaje tras idle; generar la imagen de `HeroFallback` desde la escena.
  - Acepta si: JS inicial < 170 KB gzip sin el chunk 3D; CLS = 0; Lighthouse móvil ≥ 90.
  - Medido (2026-10-02): JS inicial 153,5 KB gzip, CLS 0, Lighthouse móvil 92–93. Decisión de Jorge: `HeroFallback` sigue siendo el SVG en línea (~3 KB) en lugar de una captura AVIF/WebP, que pasaría a ser el elemento LCP y lo empeoraría.

## Fase 3 — Contacto con pipeline real

- [x] **3.1 Migración** `supabase/migrations/0001_contact.sql` aplicada (tablas `leads` y `lead_events`, políticas RLS, Realtime activado en `lead_events`).
  - `0001_init.sql` se dividió en `0001_contact.sql` (aplicada en el proyecto Supabase `jorge-sierra-dev`) y `0002_knowledge_base.sql` (tarea 4.1), para no fijar `vector(1536)` antes de elegir el modelo de embeddings. RLS verificado con la llave pública: escribir en ambas tablas → 401; leer `leads` → vacío; leer `lead_events` → permitido.
- [x] **3.2 `POST /api/contact`**: zod, honeypot, Turnstile, rate limit (5 / 10 min por IP), inserción en `leads` y evento `received`, llamada firmada con HMAC a n8n.
  - Acepta si: tests de unidad para firma, validación y limitador; e2e con n8n simulado.
  - n8n es opcional hasta que exista una instancia (decisión de Jorge, 2026-10-03): sin `N8N_*` el lead se guarda con su evento `received` y no se llama a nada más.
- [ ] **3.3 Workflow de n8n** (`n8n/contact-pipeline.json`): verificar firma → clasificar con LLM → actualizar lead → Telegram → Resend; un evento en `lead_events` por paso y `failed` en caso de error.
- [ ] **3.4 `PipelineView` en tiempo real**: suscripción a Realtime por `lead_id`, timeout de 20 s y mensaje de fallo tranquilizador.
  - Acepta si: un envío real muestra los cinco pasos llegando en orden y llega el aviso a Telegram.
  - Avance (2026-10-03): e2e contra Supabase Realtime y Upstash reales con un n8n simulado que verifica la firma; los cinco pasos llegan en orden (5/5 corridas). Pendiente el aviso real a Telegram, que depende de la tarea 3.3 (en pausa: no hay instancia de n8n).

## Fase 4 — Agente

- [x] **4.1 Migración de la base de conocimiento** (`supabase/migrations/0002_knowledge_base.sql`: `kb_documents`, `kb_chunks`, índice HNSW, `match_kb_chunks`). Revisar que `vector(N)` coincida con `EMBEDDING_DIMENSIONS`.
  - Embeddings: OpenAI `text-embedding-3-small` (1536), decisión de Jorge (2026-10-03). `0003_kb_hardening.sql` corrige dos avisos de seguridad de Supabase: pgvector pasa al esquema `extensions` y `match_kb_chunks` fija su `search_path`. Verificado: la función responde y el rol anónimo no puede ejecutarla.
- [x] **4.2 Ingesta** (`scripts/ingest.ts`, `pnpm kb:ingest`): fragmentación, eliminación de frases con marcadores `[ ]`, hash por contenido, README de GitHub, resumen final.
  - Acepta si: correrla dos veces seguidas no re-embebe nada la segunda vez.
  - Verificado (2026-10-03): 1.ª corrida 15 documentos / 98 fragmentos (12 279 tokens); 2.ª corrida 0 embebidos, 15 sin cambios. Cero corchetes en los fragmentos de `content/`. Sin README: `ai-support-automation-platform` (404) y `netplan` (solo título, 0 fragmentos). En los README los corchetes son enlaces y se convierten a texto; la regla de marcadores aplica al contenido JSON.
- [x] **4.3 Recuperación** (`lib/ai/retrieval.ts`) con tests de RRF y umbral.
  - `0004_retrieval_relevance.sql`, medido sobre la base real: el puntaje RRF no sirve como umbral (preguntas ajenas al perfil sacaban los mismos 0,0164/0,0161/0,0159 que las relevantes), así que la función devuelve también la similitud coseno, y el umbral es 0,35 (relevantes 0,377–0,591; ajenas 0,130–0,335). Además, `websearch_to_tsquery` exigía todas las palabras y la rama léxica casi nunca coincidía; ahora usa OR entre términos.
- [x] **4.4 Clasificación de modo, prompts y herramientas** (`lib/ai/*`) según `docs/agent-spec.md` §2, §6 y §8.
  - Modelos: `claude-sonnet-5-5` para generar (configurable con `AI_MODEL`) y `claude-haiku-4-5` para clasificar. AI SDK v7: `generateText` + `Output.choice/object` (`generateObject` está deprecado). `createLead` verifica el consentimiento en el último mensaje del visitante (su correo literal + un sí explícito), no en lo que diga el modelo.
- [x] **4.5 `POST /api/agent`**: guardas de entrada, streaming, data parts `data-trace` y `data-report`, verificación de citas, redacción de PII, tope de costo.
  - Acepta si: test de integración con modelo simulado cubre los cuatro modos.
  - Las citas inválidas se filtran dentro del stream (`experimental_transform`), incluso cuando llegan partidas entre fragmentos. En el reporte de vacante, un encaje sin fuentes válidas se descarta. El modo `out_of_scope` no consulta la base ni usa herramientas. Sin las variables del agente, la ruta responde 503.
- [x] **4.6 UI del agente**: `AgentBox` en el hero, mensajes con fuentes enlazadas, `MatchReport`, `TracePanel` plegable, estados de carga, error, rate limit y presupuesto agotado.
  - Acepta si: el e2e de "pegar vacante → ver reporte con fuentes" pasa; todo funciona con teclado y lector de pantalla.
  - Los e2e usan el stream real de `runAgent` con modelos simulados (incluye axe sobre el reporte). Pendiente: probar con Claude real cuando la cuenta de Anthropic tenga saldo (hoy responde "credit balance is too low"). El progreso que se ve en la caja viene de eventos reales del servidor (`data-progress`), no de temporizadores. `useChat` se carga recién con la primera pregunta: JS inicial 165,5 KB (margen de 4,5 KB). Además, `followLead` relee los eventos cada 3 s, porque Realtime no garantiza la entrega y un evento perdido trababa el pipeline de contacto.

## Fase 5 — Evals y observabilidad

- [x] **5.1 Langfuse**: trazas con los spans y tags de `docs/agent-spec.md §11`.
  - Nota: SDK v5 (`@langfuse/otel` + `@langfuse/vercel-ai-sdk` para AI SDK v7) registrado en `instrumentation.ts`; sin las llaves todo es no-op. Spans `classify`, `retrieve`, `embed_query`, `generate`, `verify_citations` y uno por herramienta (los crea el AI SDK); tags `lang:*`, `mode:*`, `gaps`, `lead`; `sessionId` = el id aleatorio de `useChat`. La variable es `LANGFUSE_BASE_URL` (nombre canónico del SDK), no `LANGFUSE_HOST`. El `mask` de Langfuse solo cubre sus atributos `langfuse.*` y el prompt viaja en `gen_ai.*`: `RedactingSpanProcessor` redacta correos y teléfonos en todos los atributos (verificado contra la API v2 de Langfuse). `pnpm ask "…"` corre el agente real desde la terminal.
- [x] **5.2 Dataset de 30 casos** en `evals/dataset.jsonl` (formato de `dataset.example.jsonl`). Las vacantes deben ser reales y anonimizadas: pedírselas a Jorge.
  - Nota: 31 casos en `web/evals/` (15 generales, 6 vacantes, 5 fuera de alcance, 5 inyecciones). Las 6 vacantes son las reales que dio Jorge, sin empresa, reclutador ni texto promocional; ninguna es de Frontend puro (la más cercana es `vac-003`, web y React), así que esa categoría de §12 queda sin vacante propia. `expected_sources` usa las llaves reales de la base (`source_type:slug`). Campos nuevos: `category` en vacantes y `forbidden_tools` en inyecciones (`inj-005` no debe llamar a `createLead`).
- [x] **5.3 Jueces y runner** (`evals/judges.ts`, `evals/run.ts`, `pnpm evals`) con los umbrales de §12.
  - Nota: corre el agente real contra la base real (sin tocar el presupuesto diario ni crear leads; `createLead` queda simulado y registrado). Jueces con salida estructurada para fidelidad, rechazo y brechas; recall@8 y citas son cálculos puros con tests. Publica cada corrida como dataset run de Langfuse (`agent-evals`) con un score por métrica. Primera corrida completa: fidelidad 98 %, recall 96,7 %, rechazo 100 %, citas 100 %, brechas 100 %.
  - Lo que destaparon los evals y se corrigió en esta tarea: (1) el reporte de vacante tardaba más de 20 s y el visitante veía "El agente no responde"; ahora reporte y prosa corren en paralelo, el reporte usa `streamText` + `Output.object`, y §14 se aplica como inactividad (20 s sin chunks) con un tope total de 90 s (`maxDuration` 120). Un reporte completo son ~2.500 tokens de salida (JSON en español). (2) Un reporte con más de 6 brechas invalidaba toda la respuesta; ahora el esquema del modelo no limita listas y `finalizeReport` recorta, y si el reporte falla igual llega la prosa. (3) El clasificador mandaba "¿dónde vive y en qué modalidad trabaja?" a fuera de alcance; ciudad, modalidad, formación e inglés son datos del perfil público.
  - Pendiente menor (no bloquea umbrales): el juez marca exageraciones sutiles como "en producción" para el challenge de SuperLikers o "tienda construida" para Horebs, que sigue en construcción. Vale endurecer el prompt cuando haya más casos.
- [x] **5.4 Job de evals en CI** cuando cambien `lib/ai/**`, `content/**` o `evals/**`.
  - Acepta si: un daño deliberado y realista hace fallar el job, y el mismo job pasa sin el daño. Criterio original: "quitar la regla 1 del prompt". Se cambió con el OK de Jorge (2026-10-03) por lo que mostraron los datos.
  - Por qué cambió: con Claude Sonnet 5.5, quitar la regla 1, quitar el delimitador `<entrada_visitante>` o quitar el bloque entero de 7 reglas no empeoró ninguna métrica (fidelidad 98–99 %, rechazos 100 %). Las protecciones reales están en la arquitectura: el clasificador manda lo fuera de alcance a un modo sin fuentes ni herramientas, cada modo repite lo esencial y el filtro de citas corre en el servidor. Un cambio de prompt aislado no sirve como prueba de que el job frena regresiones.
  - Verificado en CI con `workflow_dispatch`: `next-rewrite` pasa todos los umbrales (corrida 37131109308); la misma rama con la búsqueda rota (`MIN_SIMILARITY = 0.9`, como una recalibración equivocada) falla con recall 0 % y citas válidas 32 % (corrida 37131117356).
  - Lo que destaparon las corridas de verificación, ya corregido: (1) a veces el agente citaba `[3]` en lugar de `[fuente:3]` y la UI no las enlazaba; el filtro de streaming ahora las normaliza. (2) "Citas válidas" no veía ese formato; ahora cuenta los marcadores mal formados y exige al menos una cita válida en respuestas sobre Jorge. (3) Las frases prohibidas se buscaban como subcadena ("olas" dentro de otra palabra); ahora se buscan como palabra completa. El job corre solo en PRs y en `main`, para no pagar dos veces por push y PR. Configuración no secreta (modelo de embeddings, presupuesto) como env plano: un secreto con valor "1" hacía que GitHub tapara cada "1" del log.

## Fase 6 — Pulido y lanzamiento

- [x] **6.1 Inglés**: `messages/en.json`, contenido traducido en `content/en/`, selector ES/EN activo, `hreflang`, re-ingesta con `lang = 'en'`.
  - Nota: next-intl se usa para el ruteo y la negociación (`proxy.ts`: `/` va a `/es` o `/en` según la cookie `NEXT_LOCALE` y luego `Accept-Language`; cualquier otro idioma cae en `/es`). Los textos siguen siendo props tipadas desde `messages/*.json`: el proveedor de cliente de next-intl no se usa, así que el JS inicial no cambia (204,5 KB contra 204,6 KB del commit anterior, medido igual: gzip de los scripts del HTML prerenderizado). Los marcadores `[ ]` se tradujeron como marcadores, sin inventar datos; `_verify` y `_agentNote` quedan en español porque son notas internas. `hreflang` (es, en, x-default) en metadata y sitemap; el agente recibe el idioma de la página.
  - Migración `0005`: los README de GitHub solo existen en español y ahora se recuperan desde cualquier idioma. Limitación medida: en inglés la similitud contra esos README baja unos 0,05 y algunos fragmentos quedan bajo el umbral de 0,35 (por ejemplo, el patrón Strategy de notificaciones-challenge). El agente responde con honestidad que no tiene el dato. Recalibrar requiere casos de eval en inglés.
- [x] **6.2 Lighthouse CI** con los umbrales de RNF-4 en cada PR.
  - Nota: workflow `web-lighthouse.yml`. Corre cuando Vercel avisa que un preview de `jorge-sierra-web` está listo, audita `/es` y `/en` en móvil (rendimiento ≥ 90) y escritorio (≥ 95), con accesibilidad y SEO en 100, mediana de 3 corridas. Se omite `is-crawlable`: Vercel marca los previews con `x-robots-tag: noindex` a propósito (era la única auditoría de SEO que fallaba en el preview); la indexación de producción la cubre el e2e de `robots.txt`. Los previews están detrás de Vercel Authentication: entra con el "Protection Bypass for Automation" (secreto `VERCEL_AUTOMATION_BYPASS_SECRET`). Verificado contra el preview real: móvil y escritorio pasan (corrida 37132254907).
  - Medido en local contra el build de producción (2026-10-03): móvil 92–95, escritorio 100, accesibilidad 100, SEO 100. SEO había bajado a 92 porque next-intl agrega un header `Link` con hreflang armado con el host de la petición (localhost o el preview) y el canonical apunta a producción; se desactivó (`alternateLinks: false`), ya que el HTML publica hreflang con las URLs de producción.
- [x] **6.3 Revisión de marcadores**: listar todos los `[ ]` y campos `_verify` que quedan en `content/` y pedírselos a Jorge. No lanzar con marcadores en cargos, años de SOAINT, WhatsApp ni enlace al CV, ni con campos `_verify` sin resolver.
  - Nota (2026-10-03): Jorge decidió que el sitio es la fuente de verdad. Su CV en PDF era un resumen recortado por espacio, y todas las tecnologías del sitio son reales. El CV ahora se genera desde `content/` con `pnpm cv` (`public/cv/jorge-sierra-cv-{es,en}.pdf`, una página por idioma), así que no puede contradecir al sitio; hay que regenerarlo tras editar `content/`. Resuelto: el stack de SOAINT está confirmado y se sumaron LangGraph, Python y FastAPI, que salen del CV; el "rol de clínicas" era IX Colombia y se unió a ese rol (Vue y Quasar, más React, TypeScript y FastAPI); SENA suma NestJS y PostgreSQL; la formación sigue como "Tecnólogo"; las fechas exactas no importan y quedan por año. `vac-004` ya no espera LangGraph como brecha. De paso: las URLs del contenido solo aceptan http(s), porque `z.url()` aceptaba `javascript:`.
  - Después (mismo día): Jorge canceló la demo y el README de NetPlan y el video del chatbot; esos marcadores se quitaron y NetPlan muestra como resultado lo que ya tiene (contenedores y despliegue configurado). El enlace de Cal.com está en `profile.links.calBooking` y el agente lo usa (`CAL_BOOKING_URL` solo lo sobrescribe). SOAINT suma dos logros reales del CV, sin cifra: inventar una métrica viola la regla 2 y el agente la citaría como un hecho.
  - Marcadores que siguen visibles, sin bloquear el lanzamiento: métrica de SOAINT, para quién es NetPlan, métrica de Horebs, siguiente paso de Paga Diario, objetivo de AI Support Platform.
  - Evals: los PRs y `main` corren 10 casos (`--subset=pr`), con Sonnet como juez. Se probó Haiku para abaratar y se descartó: en CI marcó en rojo respuestas correctas, porque tomó "no tengo ese dato" como una afirmación y no vio una brecha que el agente había escrito textualmente; el dataset completo, a mano (`workflow_dispatch`). El 2026-10-03 se gastaron unos US$25, casi todo en ~10 corridas completas para destapar y verificar arreglos.

- [x] **6.4 Corte**: mover `web/` a la raíz, archivar el código Nuxt en la rama `legacy-nuxt`, apuntar jorge-sierra.dev al nuevo proyecto en Vercel, verificar redirecciones y que el formulario y el agente funcionen en producción.
  - Nota (2026-10-03): `web/` se movió a la raíz con `git mv` (se conserva el historial) y el Nuxt quedó en la rama `legacy-nuxt` (`f99cc80`, el que estaba en producción). El PR #1 se unió a `main` con merge commit. En Vercel, `jorge-sierra-web` construye desde la raíz y tiene las variables del agente en Production; `jorge-sierra.dev` se pasó del proyecto viejo al nuevo (solo se desvinculó: el dominio y el proyecto `jorge-sierra-dev` siguen en la cuenta, con "Ignored Build Step" en `exit 0`, para poder volver atrás si hace falta).
  - Verificado en producción: `/` manda a `/es` o `/en` según el idioma del navegador; `/en`, `robots.txt`, `sitemap.xml` y los dos CV responden 200, sin `noindex`; el agente responde en español y en inglés con citas (primer byte en menos de 1 s) y ofrece Cal.com cuando piden una llamada; `/api/contact` rechaza un captcha falso con 403, o sea que el backend está conectado.
