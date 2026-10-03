# Diseño técnico — jorge-sierra.dev v2

## 1. Arquitectura general

```
                        ┌──────────────────────── Vercel ────────────────────────┐
 Visitante ──HTTPS──▶   │ Next.js (App Router)                                     │
                        │  ├─ Páginas RSC: hero, casos, trayectoria, contacto      │
                        │  ├─ Chunk 3D (client, carga diferida)                    │
                        │  ├─ POST /api/agent   ── AI SDK streamText + tools ──┐   │
                        │  └─ POST /api/contact ── firma HMAC ──▶ n8n webhook   │   │
                        └──────────────┬──────────────────────────┬────────────┼───┘
                                       │                          │            │
                         Upstash Redis (rate limit, tope de costo) │      LLM + embeddings
                                       │                          │            │
                        ┌──────────────▼──────────────┐   ┌───────▼─────────┐  │
                        │ Supabase                    │◀──│ n8n (VPS)        │  │
                        │  kb_documents / kb_chunks   │   │ clasifica, guarda│  │
                        │  (pgvector + full-text)     │   │ avisa, confirma  │  │
                        │  leads / lead_events ───────┼─▶ Realtime ──▶ navegador │
                        └─────────────────────────────┘   └──────────────────┘  │
                                                    Langfuse ◀── trazas ────────┘
```

Decisiones clave:
- **Supabase pgvector en lugar de Pinecone**: un solo servicio para vectores, leads y realtime. La base es pequeña (cientos de fragmentos).
- **Búsqueda híbrida** (vectorial + texto completo con fusión RRF): los nombres propios de tecnologías ("NestJS", "BullMQ") se recuperan mejor con texto completo.
- **El pipeline de contacto corre en n8n** y publica cada paso en `lead_events`. El navegador se suscribe con Supabase Realtime. Así la animación refleja eventos reales.
- **Proveedor de LLM intercambiable** vía AI SDK y variables de entorno.

## 2. Estructura del proyecto

```
app/
  [locale]/
    layout.tsx              # fuentes, tema, proveedores de i18n
    page.tsx                # home: hero, casos, trayectoria, contacto
    opengraph-image.tsx     # OG generado
  api/
    agent/route.ts          # streaming del agente
    contact/route.ts        # valida, crea lead, llama a n8n
  sitemap.ts
  robots.ts
components/
  hero/  Hero.tsx  HeroScene.tsx  particles.vert.glsl  particles.frag.glsl
         useHeroProgress.ts  HeroFallback.tsx  buildGraph.ts
  agent/ AgentBox.tsx  AgentMessage.tsx  MatchReport.tsx  TracePanel.tsx  Sources.tsx
  cases/ CaseSelector.tsx  CaseDetail.tsx  FlowDiagram.tsx  StatusBadge.tsx
  experience/ Timeline.tsx  AreaFilter.tsx  SideCards.tsx
  contact/ ContactForm.tsx  PipelineView.tsx  Channels.tsx
  ui/    Button.tsx  Chip.tsx  Placeholder.tsx  SectionHeader.tsx
content/   es/ profile.json  experience.json  cases.json  (+ faq.md, cv.md cuando existan)
           en/ (Fase 6, misma estructura)
lib/
  content/  schema.ts  load.ts
  ai/       model.ts  prompts.ts  tools.ts  retrieval.ts  guardrails.ts  cost.ts
  kb/       chunk.ts  embed.ts  sources.ts
  supabase/ server.ts  browser.ts
  ratelimit.ts  env.ts  hmac.ts
messages/  es.json  en.json
scripts/   ingest.ts
supabase/  migrations/0001_contact.sql  0002_knowledge_base.sql
evals/     dataset.jsonl  run.ts  judges.ts
n8n/       contact-pipeline.json      # export del workflow
tests/     unit/  e2e/
design-reference/                     # prototipos (solo lectura)
```

## 3. Sistema de diseño

### Tokens (CSS custom properties en `app/globals.css`, expuestos a Tailwind)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#07080A` | fondo de página |
| `--surface` | `#0B0C0F` | tarjetas y paneles |
| `--surface-2` | `#0F1114` | nodos, tarjeta seleccionada |
| `--rail` | `#1F2226` | rieles de líneas de tiempo, separadores sutiles |
| `--border` | `#2A2D33` | bordes por defecto |
| `--border-strong` | `#33373E` | inputs, botones secundarios |
| `--text` | `#ECEDEF` | texto principal |
| `--text-2` | `#B4B9C1` | texto secundario |
| `--text-3` | `#9BA1AA` | etiquetas mono |
| `--text-muted` | `#8A9099` | marcadores de datos faltantes |
| `--text-faint` | `#7A808A` | placeholders, estados pendientes |
| `--accent` | `#6EF0B0` | orden, éxito, CTA principal |
| `--chaos` | `#FF9F5A` | caos (hero) |
| `--warn` | `#FFB27A` | errores de formulario, "en construcción" |

El sitio es oscuro por diseño; no hay tema claro en v1.

### Tipografía
- **Bricolage Grotesque** (display y cuerpo), pesos 400/500/700/800, `next/font/google` con `display: swap`.
- **JetBrains Mono** (etiquetas, estados, logs), pesos 400/500.
- Escala: H1 `clamp(48px, 7.2vw, 104px)` / line-height 0,94 / tracking −0,035em; H2 `clamp(40px, 5.2vw, 72px)`; H3 `clamp(24px, 2.4vw, 48px)`; cuerpo 16–19 px / 1,55; etiquetas mono 11–13 px, tracking 0,06–0,08em, mayúsculas.

### Componentes base
- Radios: 10 (inputs, botones), 12–14 (nodos, tarjetas), 16–20 (paneles), 999 (chips y pills).
- Objetivos táctiles ≥ 44 px.
- `Placeholder`: borde punteado `--border-strong`, texto `--text-muted`. Se usa para todo texto entre corchetes del contenido.
- `StatusBadge`: `done` → accent, `partial` → text, `building` → warn, `soon` → muted.

## 4. Hero 3D

### Escena
- `buildGraph.ts` genera nodos y aristas: 5 capas en el eje X (`x = -1.3 + capa * 0.65`) con 4, 3, 3, 3 y 2 nodos; profundidad Z alternada (±0,32); cada nodo conecta con 1–2 nodos de la capa siguiente. Es la misma lógica de `design-reference/Main.dc.html` (método `build`).
- **Partículas en GPU**: un `THREE.Points` con atributos por partícula `aChaos` (vec3), `aOrder` (vec3), `aDelay` (float), `aSeed` (float). Todo el movimiento se calcula en el vertex shader con los uniforms `uProgress`, `uTime`, `uPointer`, `uAccent` y `uChaos`. No hay bucle por partícula en la CPU.
  - Posición en caos: `aChaos + sin(uTime * f + seed) * 0.09`.
  - Posición en orden: sobre su arista, avanzando con el tiempo (flujo de datos) o alrededor de su nodo.
  - Mezcla: `p = clamp(uProgress * 1.58 - aDelay, 0, 1)`, easing cúbico in-out; el delay crece de izquierda a derecha para que el orden "barra" el grafo.
  - Color: mezcla de `uChaos` a `uAccent` según `p`.
- Cantidad: 20 000 partículas en escritorio con GPU tier ≥ 2, 8 000 en tier 1 y en móvil, fallback estático en tier 0.
- Aristas: `LineSegments` con opacidad ligada a `uProgress` (aparecen desde 0,55).
- Pulsos: `InstancedMesh` de puntos que recorren aristas (desde `uProgress` 0,8).
- Etiquetas de capa: `drei/Text` (troika), visibles desde 0,86; en móvil van como texto HTML bajo la franja.
- Tokens de caos ("Copia_final_v3(2).xlsx", "RE: RE: URGENTE"…): texto que se desvanece con `1 - progress * 1.6`.
- Posprocesado: bloom suave solo en GPU tier ≥ 2.

### Control del progreso
- Escritorio: la sección hero se fija con ScrollTrigger (`pin: true`) durante 100 vh de scroll; `uProgress` va de 0 a 1 con ese recorrido. Si el usuario no hace scroll en 1,3 s, una animación de autoplay lleva el progreso a 1.
- Móvil: autoplay a 1 tras 1,3 s; botón "Volver al caos". Sin pin.
- Rotación: yaw = `sin(t * 0.18) * 0.45 - 0.28 + pointer.x * 0.4`; pitch = `0.2 + pointer.y * 0.18`, suavizados.

### Carga y rendimiento
- `HeroScene` se importa con `next/dynamic({ ssr: false })` y se monta tras `requestIdleCallback` posterior al LCP.
- El HTML del hero (texto, agente, CTAs) se renderiza en servidor; el canvas va en una capa absoluta con `aria-hidden`.
- `HeroFallback`: imagen AVIF/WebP del estado final, generada una vez con un script de captura.
- La escena se pausa (`frameloop="demand"`) cuando el hero sale del viewport (IntersectionObserver).
- DPR limitado a `[1, 2]`.

## 5. Contacto con pipeline en tiempo real

1. `ContactForm` valida en el cliente con el mismo esquema zod del servidor.
2. `POST /api/contact`: verifica honeypot, Turnstile y rate limit (5 envíos por IP cada 10 minutos). Inserta en `leads` y en `lead_events` el paso `received`. Llama al webhook de n8n con firma HMAC-SHA256 (`X-Signature`) y responde `{ leadId }` sin esperar a n8n.
3. El cliente se suscribe a `lead_events` filtrado por `lead_id` (Supabase Realtime, `postgres_changes`).
4. n8n (`n8n/contact-pipeline.json`):
   - verifica la firma;
   - clasifica intención y prioridad con un LLM y emite `classified` con `{ intent, priority }`;
   - actualiza `leads` y emite `stored`;
   - envía el aviso por Telegram a Jorge y emite `notified`;
   - envía la confirmación por correo con Resend y emite `confirmed`.
   Cada paso inserta una fila en `lead_events`.
5. `PipelineView` pinta los pasos según los eventos que llegan. Si un paso falla, n8n emite `failed` con el nombre del paso y la UI muestra "Algo falló, pero tu mensaje quedó guardado y lo leeré igual".
6. Timeout de UI: si en 20 s no llega `confirmed`, se muestra el mismo mensaje tranquilizador.

`lead_events` no contiene datos personales, solo el paso y metadatos no sensibles. Por eso el rol anónimo puede leerla (ver migración). El `lead_id` es un UUID v4 no adivinable.

## 6. Casos, trayectoria y contenido

- `lib/content/schema.ts` define los esquemas zod de `profile.json`, `experience.json` y `cases.json`. El build falla si el contenido no valida.
- Los campos que empiezan por `_` (`_verify`, `_agentNote`) son notas internas: la UI nunca los muestra. `_verify` tampoco entra a la base de conocimiento; `_agentNote` sí, como contexto para el agente.
- Cualquier string que empiece por `[` se renderiza con `Placeholder`.
- `FlowDiagram`: horizontal en ≥ 820 px, vertical debajo; pulso animado por CSS entre nodos con retraso escalonado de 0,3 s; `prefers-reduced-motion` lo detiene.
- Los casos con `status: "soon"` usan bordes punteados en los nodos y los rótulos `labels` del JSON.

## 7. i18n

- next-intl con rutas `/es` (por defecto) y `/en`. Middleware redirige `/` según `Accept-Language`.
- Strings de UI en `messages/*.json`. El contenido vive por idioma en `content/es/` y `content/en/` con la misma estructura. En v1 solo existe `content/es/`; si falta un archivo en `en`, se usa el de `es`.

## 8. SEO

- `generateMetadata` por idioma, con título y descripción coherentes en todas las etiquetas (hoy el sitio Nuxt tiene Twitter y Open Graph contradictorios).
- `opengraph-image.tsx` con `next/og`: titular, nombre y una ilustración simple del grafo.
- JSON-LD `Person`: nombre, cargo, `sameAs` (LinkedIn, GitHub), `knowsAbout`.
- `sitemap.ts` y `robots.ts`.

## 9. Variables de entorno

| Variable | Dónde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente y servidor | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente y servidor | Realtime de `lead_events` |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | KB y leads |
| `AI_PROVIDER` | servidor | `anthropic` por defecto |
| `AI_MODEL` | servidor | ID del modelo de chat |
| `ANTHROPIC_API_KEY` | servidor | si `AI_PROVIDER=anthropic` |
| `EMBEDDING_PROVIDER` / `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS` | servidor | embeddings (deben coincidir con la columna `vector`) |
| `EMBEDDING_API_KEY` | servidor | llave del proveedor de embeddings |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | servidor | rate limit y tope de costo |
| `AGENT_DAILY_BUDGET_USD` | servidor | tope diario de costo del agente |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_BASE_URL` | servidor | trazas |
| `N8N_CONTACT_WEBHOOK_URL` / `N8N_WEBHOOK_SECRET` | servidor | pipeline de contacto |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ambos | antispam |
| `GITHUB_TOKEN` | servidor (ingesta) | leer README de repos |
| `CAL_BOOKING_URL` | servidor | enlace para agendar llamadas |

En n8n: credenciales de Supabase (service role), LLM, Telegram (bot token y chat id) y Resend.

## 10. CI/CD

GitHub Actions en cada PR:
1. `lint`, `typecheck`, `test`.
2. `build`.
3. Playwright e2e con axe contra el preview de Vercel.
4. Lighthouse CI contra el preview (umbrales de RNF-4).
5. `evals` solo si cambian `lib/ai/**`, `content/**` o `evals/**`; el job falla si fidelidad < 0,9 o algún rechazo falla.
6. Escaneo de secretos (gitleaks).

En `main`: deploy de producción en Vercel y `pnpm kb:ingest` si cambió `content/**`.
