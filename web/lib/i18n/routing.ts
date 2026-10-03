import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@/lib/content/load";

// docs/design.md §7: /es (default) and /en. "/" is negotiated from the
// NEXT_LOCALE cookie first, then Accept-Language.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
