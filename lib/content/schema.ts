import { z } from "zod";

// Text between brackets is data Jorge has not provided yet (CLAUDE.md rule 2).
// It is valid anywhere a real value is expected and rendered with <Placeholder>.
export const placeholder = z.string().regex(/^\[.+\]$/, "Marcador inválido");
export const isPlaceholder = (value: string) => value.startsWith("[");

const text = z.string().min(1);
// Content URLs end up in href attributes: only http(s), never javascript: or data:.
const webUrl = z.url({ protocol: /^https?$/ });
const urlOrPlaceholder = z.union([webUrl, placeholder]);
// Files served by the site itself, such as the generated CV (/cv/…pdf).
const sitePath = z.string().regex(/^\/[\w./-]+$/);
const emailOrPlaceholder = z.union([z.email(), placeholder]);

// Fields starting with "_" are internal notes and are never rendered.
const internalNotes = {
  _verify: z.string().optional(),
  _agentNote: z.string().optional(),
};

export const areaId = z.enum(["ia", "backend", "frontend", "cloud"]);
export type AreaId = z.infer<typeof areaId>;

export const profileSchema = z.strictObject({
  name: text,
  fullName: text,
  headline: text,
  location: text,
  workModes: z.array(text).min(1),
  availability: text,
  hero: z.strictObject({
    titleLine1: text,
    titleLine2: text,
    subtitle: text,
    stackLine: z.array(text).min(1),
    graphLayers: z
      .array(z.strictObject({ label: text, sub: text }))
      .length(5),
    chaosTokens: z.array(text).min(1),
  }),
  summary: text,
  skills: z.record(areaId, z.array(text).min(1)),
  education: z.array(z.strictObject({ title: text, org: text })),
  principles: z.array(z.strictObject({ title: text, text })),
  links: z.strictObject({
    github: webUrl,
    linkedin: webUrl,
    email: emailOrPlaceholder,
    whatsapp: z.union([z.string().regex(/^\d{10,15}$/), placeholder]),
    cv: z.union([webUrl, sitePath, placeholder]),
    calBooking: urlOrPlaceholder,
  }),
  responseTime: text,
});

export const experienceSchema = z
  .strictObject({
    areas: z.array(z.strictObject({ id: areaId, label: text })).min(1),
    roles: z
      .array(
        z.strictObject({
          id: text,
          current: z.boolean(),
          years: text,
          role: text,
          org: text,
          areas: z.array(areaId).min(1),
          bullets: z.array(text).min(1),
          stack: z.array(z.strictObject({ label: text, area: areaId })),
          ...internalNotes,
        }),
      )
      .min(1),
  })
  .refine((data) => data.roles.filter((role) => role.current).length <= 1, {
    message: "Solo puede haber un rol actual",
    path: ["roles"],
  });

export const caseStatus = z.enum(["done", "partial", "building", "soon"]);
export type CaseStatus = z.infer<typeof caseStatus>;

export const casesSchema = z.strictObject({
  cases: z
    .array(
      z.strictObject({
        slug: z.string().regex(/^[a-z0-9-]+$/),
        num: z.string().regex(/^\d{2}$/),
        title: text,
        type: text,
        status: caseStatus,
        statusLabel: text,
        context: z.string(),
        kicker: text,
        problem: text,
        labels: z
          .strictObject({ flow: text, decisions: text, results: text })
          .optional(),
        flow: z
          .array(
            z.strictObject({
              tag: text,
              name: text,
              sub: text,
              badge: text.optional(),
            }),
          )
          .min(2),
        decisions: z.array(z.strictObject({ title: text, text })).min(1),
        results: z.array(text).min(1),
        stack: z.array(text).min(1),
        links: z.array(z.strictObject({ label: text, href: webUrl })),
        note: z.string(),
        ...internalNotes,
      }),
    )
    .min(1)
    .refine(
      (cases) => new Set(cases.map((item) => item.slug)).size === cases.length,
      { message: "Los slugs deben ser únicos" },
    ),
});

export type Profile = z.infer<typeof profileSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Role = Experience["roles"][number];
export type Case = z.infer<typeof casesSchema>["cases"][number];
