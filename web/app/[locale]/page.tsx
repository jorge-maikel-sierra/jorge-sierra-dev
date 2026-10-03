import { notFound } from "next/navigation";
import { CasesSection } from "@/components/cases/CasesSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { ExperienceSection } from "@/components/experience/ExperienceSection";
import { Hero } from "@/components/hero/Hero";
import {
  isLocale,
  loadCases,
  loadExperience,
  loadProfile,
} from "@/lib/content/load";
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
      <ExperienceSection
        experience={loadExperience(locale)}
        profile={profile}
        t={t.experience}
        opensInNewTab={t.cases.opensInNewTab}
        backToTop={t.cases.backToTop}
      />
      <ContactSection
        profile={profile}
        t={t.contact}
        opensInNewTab={t.cases.opensInNewTab}
        backToTop={t.cases.backToTop}
      />
    </main>
  );
}
