import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/lib/content/load";
import type { Profile } from "@/lib/content/schema";

export const SITE_URL = "https://jorge-sierra.dev";

const ogLocale: Record<Locale, string> = { es: "es_CO", en: "en_US" };

/** hreflang alternates for every locale plus x-default (docs/design.md §7). */
export function languageAlternates() {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, `/${locale}`])),
    "x-default": `/${defaultLocale}`,
  };
}

// One title and one description for <title>, Open Graph and Twitter, so shared
// links never contradict each other (docs/design.md §8).
export function seoText(profile: Profile) {
  return {
    title: `${profile.name} — ${profile.headline}`,
    description: profile.hero.subtitle,
  };
}

export function buildMetadata(profile: Profile, locale: Locale): Metadata {
  const { title, description } = seoText(profile);
  const url = `/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates() },
    openGraph: {
      type: "profile",
      url,
      siteName: profile.name,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((value) => value !== locale).map((value) => ogLocale[value]),
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function personJsonLd(profile: Profile) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    alternateName: profile.name,
    jobTitle: profile.headline,
    description: profile.summary,
    url: SITE_URL,
    email: `mailto:${profile.links.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location.split(",")[0].trim(),
      addressCountry: "CO",
    },
    sameAs: [profile.links.linkedin, profile.links.github],
    knowsAbout: Object.values(profile.skills).flat(),
  };
}
