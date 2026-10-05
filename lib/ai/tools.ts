import { tool } from "ai";
import { z } from "zod";
import type { Case } from "@/lib/content/schema";
import { stripPlaceholders } from "@/lib/kb/text";
import type { AgentMode } from "./mode";
import type { RetrievedChunk, Source } from "./retrieval";

// docs/agent-spec.md §6. At most 5 tool steps per answer (set in /api/agent).

/**
 * Every source the model saw in this answer, numbered once. Tool results get
 * the next free numbers, so citation verification knows every valid id.
 */
export class SourceRegistry {
  private readonly byChunk = new Map<number, Source>();

  constructor(initial: Source[] = []) {
    for (const source of initial) this.byChunk.set(source.chunkId, source);
  }

  add(chunks: RetrievedChunk[]): Source[] {
    return chunks.map((chunk) => {
      const existing = this.byChunk.get(chunk.chunkId);
      if (existing) return existing;
      const source = { ...chunk, id: this.byChunk.size + 1 };
      this.byChunk.set(chunk.chunkId, source);
      return source;
    });
  }

  ids(): Set<number> {
    return new Set([...this.byChunk.values()].map((source) => source.id));
  }

  all(): Source[] {
    return [...this.byChunk.values()].sort((a, b) => a.id - b.id);
  }
}

export const LEAD_KIND: Record<AgentMode, "vacante" | "proyecto" | "otro"> = {
  vacancy: "vacante",
  problem: "proyecto",
  general: "otro",
  out_of_scope: "otro",
};

// The visitor, not the model, must give consent: in their own last message.
const CONSENT = /\b(s[ií]|acepto|de acuerdo|autorizo|cont[aá]ct(a|e|en)me|pueden contactarme|yes|i agree|contact me)\b/i;

export function visitorConsented(lastVisitorMessage: string, email: string) {
  return (
    lastVisitorMessage.toLowerCase().includes(email.trim().toLowerCase()) &&
    CONSENT.test(lastVisitorMessage)
  );
}

const SOURCE_TYPES = ["profile", "experience", "case", "faq", "cv", "repo"] as const;

export type AgentToolDeps = {
  mode: AgentMode;
  lastVisitorMessage: string;
  cases: Case[];
  calBookingUrl?: string;
  registry: SourceRegistry;
  search(query: string, sourceType?: (typeof SOURCE_TYPES)[number]): Promise<RetrievedChunk[]>;
  createLead(input: {
    kind: "vacante" | "proyecto" | "otro";
    name: string;
    email: string;
    message: string;
  }): Promise<string>;
};

const caseSummary = (item: Case) => ({
  slug: item.slug,
  title: item.title,
  type: item.type,
  status: item.statusLabel,
  kicker: item.kicker,
  problem: stripPlaceholders(item.problem),
  decisions: item.decisions.map((d) => `${d.title}: ${d.text}`),
  results: item.results.map(stripPlaceholders).filter(Boolean),
  stack: item.stack,
  links: item.links,
  note: item._agentNote,
});

export function createAgentTools(deps: AgentToolDeps) {
  const slugs = deps.cases.map((item) => item.slug) as [string, ...string[]];

  return {
    searchKnowledge: tool({
      description:
        "Busca más contexto en la base de conocimiento de Jorge cuando las fuentes del turno no alcanzan. Devuelve fuentes numeradas que puedes citar con [fuente:N].",
      inputSchema: z.object({
        query: z.string().min(2).max(300),
        sourceType: z.enum(SOURCE_TYPES).optional(),
      }),
      execute: async ({ query, sourceType }) => {
        const sources = deps.registry.add(await deps.search(query, sourceType));
        return sources.map(({ id, title, url, content }) => ({ id, title, url, content }));
      },
    }),

    getCase: tool({
      description: "Devuelve un caso de estudio completo de Jorge. La interfaz muestra una tarjeta con enlace.",
      inputSchema: z.object({ slug: z.enum(slugs) }),
      execute: async ({ slug }) => {
        const item = deps.cases.find((entry) => entry.slug === slug);
        return item ? caseSummary(item) : { error: "unknown_case" };
      },
    }),

    offerCall: tool({
      description:
        "Ofrece el enlace para agendar una llamada con Jorge. Solo comparte el enlace: nunca agenda por su cuenta.",
      inputSchema: z.object({ reason: z.string().max(200) }),
      execute: async () =>
        deps.calBookingUrl
          ? {
              available: true,
              url: deps.calBookingUrl,
              // The UI renders this link as a button right after the answer.
              note: "La interfaz ya muestra un botón con este enlace. No escribas la URL en tu respuesta.",
            }
          : { available: false, contact: "/es#contacto" },
    }),

    createLead: tool({
      description:
        "Registra al visitante para que Jorge lo contacte. Úsala SOLO si en su último mensaje escribió su nombre y correo Y aceptó explícitamente que Jorge lo contacte.",
      inputSchema: z.object({
        name: z.string().min(1).max(120),
        email: z.email().max(254),
        summary: z.string().min(1).max(1000),
        consent: z.literal(true),
      }),
      execute: async ({ name, email, summary }) => {
        if (!visitorConsented(deps.lastVisitorMessage, email)) {
          return { created: false, reason: "consent_required" };
        }
        const leadId = await deps.createLead({
          kind: LEAD_KIND[deps.mode],
          name,
          email,
          message: summary,
        });
        return { created: true, leadId };
      },
    }),
  };
}
