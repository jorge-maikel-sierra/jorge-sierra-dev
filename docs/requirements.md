# Requerimientos — jorge-sierra.dev v2

## 1. Objetivo

Que un reclutador técnico o un potencial cliente, en menos de un minuto en el sitio, concluya: "este es el desarrollador que necesito". El sitio lo logra demostrando, no afirmando: un agente de IA que responde sobre el perfil de Jorge con fuentes, una automatización que se ve funcionar al contactarlo y casos de estudio con arquitectura y decisiones reales.

## 2. Audiencias

| Audiencia | Qué busca | Qué debe encontrar |
|---|---|---|
| Reclutador técnico | Encaje con una vacante, experiencia verificable, señales de seniority | Agente en "modo vacante", trayectoria con nombres y fechas, casos con decisiones técnicas, CV descargable |
| Líder técnico / CTO | Criterio de ingeniería | Arquitecturas, trade-offs, observabilidad del agente, código público |
| Cliente (pyme) | Alguien que resuelva un problema operativo | Lenguaje de negocio, casos con impacto, contacto simple |

## 3. Requerimientos funcionales

### RF-1 Hero
- RF-1.1 Titular "Del caos a la arquitectura.", subtítulo, indicador "Disponible para nuevos retos", navegación y CTAs, todo legible sin JavaScript.
- RF-1.2 Escena 3D: partículas caóticas que se ordenan en un grafo de arquitectura de 5 capas (Inputs → Orquestación → Agentes IA → APIs → Datos) a medida que el usuario hace scroll. Pulsos de datos recorren las conexiones al final.
- RF-1.3 El grafo responde al puntero (escritorio) o al arrastre (móvil) con una rotación leve.
- RF-1.4 Fallback estático (imagen del estado final) si no hay WebGL, si la GPU es de gama baja o si el usuario pide movimiento reducido.
- RF-1.5 En móvil (< 640 px) la escena vive en su propia franja entre el texto y el agente, no detrás del texto (ver `design-reference/Mobile-Hero.dc.html`).

### RF-2 Agente ("Pregúntale a mi agente")
- RF-2.1 Campo de texto en el hero. El visitante pega una vacante o describe un problema.
- RF-2.2 El agente detecta el modo (vacante, problema de negocio o pregunta general) y responde en streaming, en el idioma del visitante.
- RF-2.3 Cada afirmación sobre Jorge se apoya en fragmentos recuperados de la base de conocimiento y muestra sus fuentes (caso, rol o repo) como enlaces.
- RF-2.4 En modo vacante entrega un reporte estructurado: requisitos que cumple con su evidencia, brechas honestas y preguntas sugeridas para la entrevista. Sin puntajes numéricos inventados.
- RF-2.5 Panel "Bajo el capó" plegable: pasos del pipeline, número de fragmentos recuperados, latencia, tokens y costo estimado de esa respuesta.
- RF-2.6 Herramientas: buscar en la base de conocimiento, abrir un caso, ofrecer agendar una llamada (enlace de Cal.com) y crear un lead solo con consentimiento explícito.
- RF-2.7 Fuera de alcance (salario, datos personales, temas ajenos al perfil profesional): el agente lo dice y redirige al contacto.

### RF-3 Casos de estudio
- RF-3.1 Cinco casos desde `content/cases.json`, en el orden del archivo.
- RF-3.2 Selector de casos (tarjetas en escritorio, carrusel horizontal en móvil) con estado visible: terminado, código listo, en construcción, próximamente.
- RF-3.3 Detalle: problema, diagrama de flujo de datos animado, decisiones clave, resultados, stack, enlaces a demo y código.
- RF-3.4 Los casos "próximamente" muestran el flujo con bordes punteados y títulos "Decisiones de diseño" / "Cómo se va a medir".

### RF-4 Trayectoria
- RF-4.1 Línea de tiempo desde `content/experience.json`, el rol actual destacado.
- RF-4.2 Filtros por área (IA y automatización, Backend, Frontend, Cloud y DevOps) que atenúan los roles que no aplican y resaltan las tecnologías del área.
- RF-4.3 Bloques laterales: formación y en curso, cómo trabajo, botones de CV y LinkedIn.

### RF-5 Contacto con automatización visible
- RF-5.1 Formulario: tipo (vacante, proyecto, otra cosa), nombre, correo, empresa opcional, mensaje. Validación con mensajes que explican qué falta.
- RF-5.2 Al enviar, el visitante ve en tiempo real los pasos reales del pipeline: webhook recibido → clasificación con IA → registro en el CRM → aviso a Jorge por Telegram → confirmación por correo. Cada paso refleja un evento real, no una animación con temporizadores.
- RF-5.3 Protección antispam: honeypot, Cloudflare Turnstile y rate limit por IP.
- RF-5.4 Canales directos: WhatsApp, correo, LinkedIn y GitHub.

### RF-6 Transversales
- RF-6.1 Sitio bilingüe ES/EN con selector de idioma (Fase 6).
- RF-6.2 SEO completo: metadatos coherentes, Open Graph generado, JSON-LD `Person`, sitemap y robots.
- RF-6.3 Analítica respetuosa de privacidad (Vercel Analytics) y Speed Insights.

## 4. Requerimientos no funcionales

| ID | Requerimiento | Cómo se verifica |
|---|---|---|
| RNF-1 | LCP < 2,0 s en móvil de gama media con 4G | Lighthouse CI y Speed Insights |
| RNF-2 | JS inicial < 170 KB gzip, sin contar el chunk 3D, que se carga después del LCP | `next build` + análisis del bundle |
| RNF-3 | CLS = 0 en el hero | Lighthouse CI |
| RNF-4 | Lighthouse ≥ 90 en rendimiento móvil, ≥ 95 en escritorio, 100 en accesibilidad y SEO | Lighthouse CI en cada PR |
| RNF-5 | 60 fps en el hero con GPU media; degradación automática en GPU baja | Prueba manual + `detect-gpu` |
| RNF-6 | WCAG 2.1 AA: contraste, foco visible, navegación por teclado, `prefers-reduced-motion` | axe en Playwright + revisión manual |
| RNF-7 | Primera respuesta del agente en streaming < 2,5 s (p95) | Trazas de Langfuse |
| RNF-8 | Costo del agente acotado: tope diario configurable; al superarlo, el agente se desactiva con un mensaje amable | Test de integración del limitador |
| RNF-9 | Fidelidad del agente ≥ 0,9 en el dataset de evals; 100 % de rechazos correctos en preguntas fuera de alcance | `pnpm evals` en CI |
| RNF-10 | Ningún secreto en el cliente | Revisión de `NEXT_PUBLIC_*` + escaneo de secretos en CI |

## 5. Fuera de alcance de v1

- Páginas de detalle por caso (`/casos/[slug]`) con texto largo: v2.
- CV generado a medida de cada vacante: v2.
- Modo voz del agente: v2.
- Terminal secreta (tecla `~`): v2.
- Migración de los endpoints del LinkedIn Auto-Publisher: proyecto aparte. Reserva el espacio de rutas `/api/linkedin/*` y no lo uses.

## 6. Criterios de éxito del lanzamiento

- Todas las tareas de `docs/tasks.md` marcadas.
- Lighthouse y evals en verde en CI.
- Ningún marcador `[ ]` de datos críticos visible: cargos, años de SOAINT, número de WhatsApp y enlace al CV completados por Jorge.
- DNS de jorge-sierra.dev apuntando al nuevo deploy y el sitio Nuxt archivado en una rama.
