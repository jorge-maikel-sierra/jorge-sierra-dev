import es from "@/messages/es.json";
import type { Locale } from "@/lib/content/load";

// UI strings (not content). Replaced by next-intl in Phase 6.
const messages = { es } satisfies Record<Locale, unknown>;

export type Messages = typeof es;

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
