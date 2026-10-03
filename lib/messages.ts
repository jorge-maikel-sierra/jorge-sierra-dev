import en from "@/messages/en.json";
import es from "@/messages/es.json";
import type { Locale } from "@/lib/content/load";

// UI strings (not content). next-intl handles routing and locale negotiation
// (proxy.ts); the strings stay typed props so no i18n runtime reaches the
// client bundle (RNF-2). The English file must mirror the Spanish one.
const messages: Record<Locale, typeof es> = { es, en };

export type Messages = typeof es;

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
