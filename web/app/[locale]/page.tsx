import { notFound } from "next/navigation";
import { Hero } from "@/components/hero/Hero";
import { isLocale, loadProfile } from "@/lib/content/load";
import { getMessages } from "@/lib/messages";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const profile = loadProfile(locale);
  const t = getMessages(locale);

  return (
    <main id="contenido">
      <Hero profile={profile} t={t.hero} />
      {/* Built in tasks 1.4–1.6. */}
      <section id="casos" aria-label={t.nav.cases} />
      <section id="trayectoria" aria-label={t.nav.experience} />
      <section id="contacto" aria-label={t.nav.contact} />
    </main>
  );
}
