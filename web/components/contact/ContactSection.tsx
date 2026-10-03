import { ContentText } from "@/components/ui/ContentText";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { Channels } from "./Channels";
import { ContactForm } from "./ContactForm";
import { PipelineView } from "./PipelineView";

export function ContactSection({
  profile,
  t,
  opensInNewTab,
  backToTop,
}: {
  profile: Profile;
  t: Messages["contact"];
  opensInNewTab: string;
  backToTop: string;
}) {
  const [firstMode, ...otherModes] = profile.workModes;
  const workModes = [firstMode, ...otherModes.map((mode) => mode.toLowerCase())].join(
    ` ${t.or} `,
  );

  return (
    <section
      id="contacto"
      aria-labelledby="contacto-title"
      className="scroll-mt-4 px-4 pb-14 pt-4 sm:px-[clamp(16px,5vw,72px)] sm:pb-24 sm:pt-14"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 sm:gap-10">
        <SectionHeader
          id="contacto-title"
          eyebrow={t.eyebrow}
          title={[t.title]}
          intro={<p className="sm:max-w-[640px]">{t.intro}</p>}
          aside={
            <a
              href="#contenido"
              className="hidden min-h-11 items-center font-mono text-[13px] tracking-[0.04em] text-text-2 hover:text-white sm:inline-flex"
            >
              {backToTop}
            </a>
          }
        />

        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-5">
          <ContactForm t={t} />
          <PipelineView t={t} />
        </div>

        <Channels profile={profile} t={t} opensInNewTab={opensInNewTab} />

        <p className="font-mono text-xs uppercase leading-[1.7] tracking-[0.06em] text-text-muted">
          <ContentText value={profile.location} /> · {workModes} ·{" "}
          <ContentText value={profile.responseTime} />
        </p>
      </div>
    </section>
  );
}
