import type { MetadataRoute } from "next";
import { locales } from "@/lib/content/load";
import { languageAlternates, SITE_URL } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
    alternates: {
      languages: Object.fromEntries(
        Object.entries(languageAlternates()).map(([lang, path]) => [lang, `${SITE_URL}${path}`]),
      ),
    },
  }));
}
