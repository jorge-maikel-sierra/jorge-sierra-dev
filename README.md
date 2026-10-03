# jorge-sierra.dev

Portafolio de Jorge Sierra, AI Engineer & Senior Full-Stack: [jorge-sierra.dev](https://jorge-sierra.dev).

El sitio demuestra lo que describe. Tiene un hero 3D ("del caos a la arquitectura"), un agente con RAG que responde sobre el perfil y analiza vacantes con citas a sus fuentes, casos de estudio con la arquitectura a la vista y un formulario de contacto cuyo pipeline se ve en tiempo real.

## Stack

- **Web:** Next.js (App Router), React, TypeScript estricto, Tailwind CSS, three.js con @react-three/fiber, español e inglés con next-intl.
- **Agente:** Vercel AI SDK con Claude, búsqueda híbrida (pgvector + texto) en Supabase, Langfuse para trazas y evals.
- **Datos e infraestructura:** Supabase (Postgres, pgvector, Realtime), Upstash (rate limiting y presupuesto diario), Cloudflare Turnstile, Vercel.
- **Calidad:** Vitest, Playwright con axe, evals del agente en CI y Lighthouse CI contra cada preview.

## Comandos

```bash
pnpm dev          # servidor local
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
pnpm e2e          # Playwright (build de producción)
pnpm kb:ingest    # indexa content/ y los README de GitHub en Supabase
pnpm evals        # evals del agente (--subset=pr para los 10 casos de CI)
pnpm ask "…"      # una consulta al agente real desde la terminal
pnpm cv           # genera public/cv/*.pdf desde content/
```

Las variables de entorno están documentadas en `.env.example` y se validan al arrancar (`lib/env.ts`).

## Documentación

La especificación está en `docs/`: requisitos, diseño, especificación del agente y el plan de tareas con las decisiones de cada una. El sitio anterior en Nuxt quedó archivado en la rama [`legacy-nuxt`](https://github.com/jorge-maikel-sierra/jorge-sierra-dev/tree/legacy-nuxt).
