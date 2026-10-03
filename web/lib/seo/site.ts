import type { Metadata } from "next";
import type { Locale } from "@/lib/content/load";
import type { Profile } from "@/lib/content/schema";

export const SITE_URL = "https://jorge-sierra.dev";

const ogLocale: Record<Locale, string> = { es: "es_CO" };

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
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      siteName: profile.name,
      locale: ogLocale[locale],
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
