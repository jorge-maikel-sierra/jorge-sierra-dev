import type { z } from "zod";
import casesEn from "@/content/en/cases.json";
import experienceEn from "@/content/en/experience.json";
import profileEn from "@/content/en/profile.json";
import casesEs from "@/content/es/cases.json";
import experienceEs from "@/content/es/experience.json";
import profileEs from "@/content/es/profile.json";
import {
  casesSchema,
  experienceSchema,
  profileSchema,
  type Case,
  type Experience,
  type Profile,
} from "./schema";

export const locales = ["es", "en"] as const;
export const defaultLocale: Locale = "es";
export type Locale = (typeof locales)[number];

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const sources = {
  es: { profile: profileEs, experience: experienceEs, cases: casesEs },
  en: { profile: profileEn, experience: experienceEn, cases: casesEn },
} satisfies Record<Locale, Record<string, unknown>>;

export function parseContent<T extends z.ZodType>(
  schema: T,
  data: unknown,
  file: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Contenido inválido en content/${file}:\n${issues}`);
  }
  return result.data;
}

export function loadProfile(locale: Locale = "es"): Profile {
  return parseContent(profileSchema, sources[locale].profile, `${locale}/profile.json`);
}

export function loadExperience(locale: Locale = "es"): Experience {
  return parseContent(
    experienceSchema,
    sources[locale].experience,
    `${locale}/experience.json`,
  );
}

export function loadCases(locale: Locale = "es"): Case[] {
  return parseContent(casesSchema, sources[locale].cases, `${locale}/cases.json`)
    .cases;
}
