# Copilot Instructions — jorge-sierra.dev

Portafolio profesional de Jorge Sierra. Objetivo: presentar servicios, proyectos y generar conversiones (contacto, leads). Toda decisión de componente o UI debe considerar su impacto en conversión, no solo apariencia.

## Tech Stack

- **Nuxt 4** (compatible con convenciones Nuxt 3) + TypeScript strict
- **Nuxt UI v4** — biblioteca de componentes principal; usar siempre antes de crear UI custom
- **Tailwind CSS v4** — usa sintaxis `@theme` en CSS (no `tailwind.config.js`)
- **@nuxt/content v3** — contenido markdown para proyectos y blog
- **@nuxtjs/sitemap + @nuxtjs/robots** — SEO automático
- **pnpm** — gestor de paquetes

## Comandos

```bash
pnpm dev          # servidor de desarrollo (http://localhost:3000)
pnpm build        # build de producción
pnpm preview      # previsualizar build
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm typecheck    # TypeScript
```

No hay suite de tests configurada aún.

## Arquitectura

```
app/                        # Directorio fuente (Nuxt 4)
├── app.vue                 # SEO global (useHead/useSeoMeta), Header, Footer
├── app.config.ts           # Tema Nuxt UI (color primary, neutral)
├── layouts/
│   └── default.vue         # Layout base
├── pages/
│   └── index.vue           # Homepage — ensambla secciones
├── components/             # Auto-importados, PascalCase
│   ├── HeroSection.vue
│   ├── ProjectsSection.vue
│   ├── ProjectCard.vue
│   ├── ServicesSection.vue
│   ├── ServiceCard.vue
│   └── ContactSection.vue
└── assets/css/
    └── main.css            # Tokens @theme de Tailwind v4 (colores, fuente)

content/
├── projects/               # Markdown de proyectos (frontmatter: title, tags, url, repo)
└── blog/                   # Artículos del blog

nuxt.config.ts              # Módulos, strict TS, site URL, routeRules
```

## Convenciones clave

### Componentes y arquitectura
- Priorizar **componentes reutilizables y orientados a conversión** (no solo UI decorativa)
- Cada sección de portafolio (Hero, Projects, Services, Contact) tiene su propio componente en `app/components/`
- Las *Section components cargan datos vía props o `queryContent()` de `@nuxt/content`
- Las *Card components son puramente presentacionales: reciben datos vía props, sin estado propio
- Siempre usar `<script setup lang="ts">` — nunca Options API

### Naming
- Componentes: **PascalCase** (`HeroSection.vue`, `ProjectCard.vue`)
- Composables: `use` prefix en camelCase (`useProjects.ts`)
- Páginas: kebab-case (`/blog/mi-articulo`)

### Estilos
- Usar componentes de **Nuxt UI** primero (`UCard`, `UButton`, `UBadge`, etc.)
- Tailwind solo para layout, spacing, y overrides puntuales
- Tokens en `app/assets/css/main.css` con sintaxis `@theme { --color-primary: ... }`
- Dark mode automático vía Nuxt UI — no duplicar estilos por modo

### Iconos (Iconify)
```vue
<UIcon name="i-lucide-arrow-right" />
<UButton icon="i-simple-icons-github" />
```
Sets disponibles: `i-lucide-*`, `i-simple-icons-*`

### Contenido con @nuxt/content
```ts
// Listar proyectos desde content/projects/
const { data: projects } = await useAsyncData('projects',
  () => queryCollection('projects').all()
)
```
Los frontmatter de proyectos incluyen: `title`, `description`, `date`, `tags`, `url`, `repo`, `image`, `featured`.

### SEO
- SEO global en `app/app.vue` con `useSeoMeta()`
- Override por página en cada `pages/*.vue`
- `@nuxtjs/sitemap` y `@nuxtjs/robots` se configuran automáticamente con `site.url` en `nuxt.config.ts`

## MCP Servers (disponibles en runtime)

- **@upstash/context7-mcp** — contexto y memoria entre sesiones
- **nuxt-mcp** — documentación oficial de Nuxt, consultable directamente
- **awesome-copilot-mcp** — asistencia avanzada y patrones de código

Cuando generes componentes o configuración de Nuxt, puedes consultar `nuxt-mcp` para obtener la API exacta actualizada.
