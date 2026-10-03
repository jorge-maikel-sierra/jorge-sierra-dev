import { notFound } from "next/navigation";
import { CasesSection } from "@/components/cases/CasesSection";
import { Hero } from "@/components/hero/Hero";
import { isLocale, loadCases, loadProfile } from "@/lib/content/load";
import { getMessages } from "@/lib/messages";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const profile = loadProfile(locale);
  const t = getMessages(locale);

  return (
    <main id="contenido">
      <Hero profile={profile} t={t.hero} />
      <CasesSection
        cases={loadCases(locale)}
        github={profile.links.github}
        t={t.cases}
      />
      {/* Built in tasks 1.5–1.6. */}
      <section id="trayectoria" aria-label={t.nav.experience} />
      <section id="contacto" aria-label={t.nav.contact} />
    </main>
  );
}
