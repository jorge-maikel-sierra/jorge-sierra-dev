import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Experience, Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { AreaFilter } from "./AreaFilter";
import { SideCards } from "./SideCards";
import { Timeline } from "./Timeline";

export function ExperienceSection({
  experience,
  profile,
  t,
  opensInNewTab,
  backToTop,
}: {
  experience: Experience;
  profile: Profile;
  t: Messages["experience"];
  opensInNewTab: string;
  backToTop: string;
}) {
  return (
    <section
      id="trayectoria"
      aria-labelledby="trayectoria-title"
      className="scroll-mt-4 px-4 pb-14 pt-4 sm:px-[clamp(16px,5vw,72px)] sm:pb-24 sm:pt-14"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-7 sm:gap-10">
        <SectionHeader
          id="trayectoria-title"
          eyebrow={t.eyebrow}
          title={[t.title]}
          intro={<p>{t.intro}</p>}
          aside={
            <a
              href="#contenido"
              className="hidden min-h-11 items-center font-mono text-[13px] tracking-[0.04em] text-text-2 hover:text-white sm:inline-flex"
            >
              {backToTop}
            </a>
          }
        />

        <AreaFilter
          areas={experience.areas}
          roleAreas={experience.roles.map((role) => role.areas)}
          labels={{
            group: t.filterLabel,
            all: t.all,
            highlighted: t.highlighted,
          }}
        >
          <div className="flex flex-col gap-7 sm:flex-row sm:flex-wrap sm:items-start sm:gap-12">
            <div className="min-w-0 sm:flex-[999_1_560px]">
              <Timeline roles={experience.roles} currentLabel={t.current} />
            </div>
            <div className="min-w-0 sm:flex-[1_1_300px]">
              <SideCards profile={profile} t={t} opensInNewTab={opensInNewTab} />
            </div>
          </div>
        </AreaFilter>

        <div className="hidden flex-wrap items-center justify-between gap-6 border-t border-[#1c1e22] pt-8 sm:flex">
          <p className="max-w-[720px] text-[clamp(22px,2.4vw,32px)] font-bold leading-[1.2] tracking-[-0.02em]">
            {t.closingQuestion}
          </p>
          <a
            href="#contacto"
            className="inline-flex min-h-12 items-center rounded-control bg-accent px-5 text-base font-bold text-bg"
          >
            {t.closingCta}
          </a>
        </div>
      </div>
    </section>
  );
}
