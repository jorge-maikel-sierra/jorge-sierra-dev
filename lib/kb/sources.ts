import type { Case, Experience, Profile } from "@/lib/content/schema";
import { cleanMarkdown, stripPlaceholders } from "./text";

export type SourceType = "profile" | "experience" | "case" | "faq" | "cv" | "repo";

export type KbSection = { name: string; text: string };

export type KbDocument = {
  sourceType: SourceType;
  slug: string;
  title: string;
  url: string | null;
  lang: string;
  /** JSON sources: one section per logical part. */
  sections?: KbSection[];
  /** Markdown sources (READMEs, faq, cv). */
  markdown?: string;
};

/** Repos whose README enters the knowledge base (docs/agent-spec.md §4). */
export const FEATURED_REPOS = [
  "paga-diario",
  "superlikers-ai-automation-challenge",
  "netplan",
  "horebs-app",
  "ai-support-automation-platform",
  "notificaciones-challenge",
  "factura-justa-api",
] as const;

const SITE = "https://jorge-sierra.dev";

const real = (text: string | undefined) => (text ? stripPlaceholders(text) : "");
const lines = (items: (string | undefined)[]) =>
  items.map(real).filter(Boolean).join("\n");
const section = (name: string, text: string): KbSection | null =>
  text ? { name, text } : null;
const present = (items: (KbSection | null)[]) =>
  items.filter((item): item is KbSection => item !== null);

export function profileDocument(profile: Profile, lang: string): KbDocument {
  return {
    sourceType: "profile",
    slug: "perfil",
    title: `${profile.name} — ${profile.headline}`,
    url: `${SITE}/${lang}`,
    lang,
    sections: present([
      section(
        "Resumen",
        lines([
          profile.summary,
          `Ubicación: ${profile.location}. Modalidad: ${profile.workModes.join(", ")}.`,
          profile.availability,
          profile.hero.subtitle,
        ]),
      ),
      section(
        "Habilidades",
        lines(Object.entries(profile.skills).map(([area, skills]) => `${area}: ${skills.join(", ")}.`)),
      ),
      section(
        "Formación",
        lines(profile.education.map((item) => `${item.title} — ${item.org}.`)),
      ),
      section(
        "Cómo trabaja",
        lines(profile.principles.map((item) => `${item.title}: ${item.text}`)),
      ),
    ]),
  };
}

export function experienceDocuments(experience: Experience, lang: string): KbDocument[] {
  const areaLabel = new Map(experience.areas.map((area) => [area.id, area.label]));
  return experience.roles.map((role) => ({
    sourceType: "experience" as const,
    slug: role.id,
    title: `${real(role.role) || "Rol"} — ${real(role.org) || role.id}`,
    url: `${SITE}/${lang}#trayectoria`,
    lang,
    sections: present([
      section(
        "Rol",
        lines([
          real(role.org) ? `${real(role.role)} en ${real(role.org)}.` : `${real(role.role)}.`,
          real(role.years) ? `Periodo: ${role.years}.` : undefined,
          role.current ? "Es su rol actual." : undefined,
          `Áreas: ${role.areas.map((id) => areaLabel.get(id) ?? id).join(", ")}.`,
          `Tecnologías: ${role.stack.map((chip) => chip.label).join(", ")}.`,
        ]),
      ),
      section("Logros", lines(role.bullets)),
      // _verify is an internal note for Jorge: never indexed.
    ]),
  }));
}

export function caseDocuments(cases: Case[], lang: string): KbDocument[] {
  return cases.map((item) => ({
    sourceType: "case" as const,
    slug: item.slug,
    title: item.title,
    url: `${SITE}/${lang}#casos`,
    lang,
    sections: present([
      section(
        "Resumen",
        lines([
          `${item.title} (${item.type}). Estado: ${item.statusLabel}.`,
          item.context,
          item.kicker,
          item.links.length
            ? `Enlaces: ${item.links.map((link) => `${link.label} ${link.href}`).join(", ")}.`
            : undefined,
        ]),
      ),
      section("Problema", real(item.problem)),
      section(
        "Arquitectura",
        lines(item.flow.map((node) => `${node.tag}: ${node.name} (${node.sub})`)),
      ),
      section(
        "Decisiones",
        lines(item.decisions.map((decision) => `${decision.title}: ${decision.text}`)),
      ),
      section("Resultados", lines(item.results)),
      section("Stack", item.stack.join(", ")),
      // _agentNote is context for the agent: indexed (agent-spec §6).
      section("Nota para el agente", real(item._agentNote)),
    ]),
  }));
}

export function repoDocument(repo: string, readme: string, lang: string): KbDocument {
  const markdown = cleanMarkdown(readme);
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return {
    sourceType: "repo",
    slug: repo,
    title: heading || repo,
    url: `https://github.com/jorge-maikel-sierra/${repo}`,
    lang,
    markdown,
  };
}
