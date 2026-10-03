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

- [ ] **5.1 Langfuse**: trazas con los spans y tags de `docs/agent-spec.md §11`.
- [ ] **5.2 Dataset de 30 casos** en `evals/dataset.jsonl` (formato de `dataset.example.jsonl`). Las vacantes deben ser reales y anonimizadas: pedírselas a Jorge.
- [ ] **5.3 Jueces y runner** (`evals/judges.ts`, `evals/run.ts`, `pnpm evals`) con los umbrales de §12.
- [ ] **5.4 Job de evals en CI** cuando cambien `lib/ai/**`, `content/**` o `evals/**`.
  - Acepta si: romper a propósito el prompt (quitar la regla 1) hace fallar el job.

## Fase 6 — Pulido y lanzamiento

- [ ] **6.1 Inglés**: `messages/en.json`, contenido traducido en `content/en/`, selector ES/EN activo, `hreflang`, re-ingesta con `lang = 'en'`.
- [ ] **6.2 Lighthouse CI** con los umbrales de RNF-4 en cada PR.
- [ ] **6.3 Revisión de marcadores**: listar todos los `[ ]` y campos `_verify` que quedan en `content/` y pedírselos a Jorge. No lanzar con marcadores en cargos, años de SOAINT, WhatsApp ni enlace al CV, ni con campos `_verify` sin resolver.
- [ ] **6.4 Corte**: mover `web/` a la raíz, archivar el código Nuxt en la rama `legacy-nuxt`, apuntar jorge-sierra.dev al nuevo proyecto en Vercel, verificar redirecciones y que el formulario y el agente funcionen en producción.
