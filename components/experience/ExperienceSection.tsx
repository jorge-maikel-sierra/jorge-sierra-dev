import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isPlaceholder, type Experience, type Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { ExperienceExplorer, type RoleItem } from "./ExperienceExplorer";

const heading = "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-3";
const card = "flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5";
const button =
  "flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-control px-3 text-[13px] sm:min-h-12 sm:px-5 sm:text-base";

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
  const { cv, linkedin } = profile.links;

  const roles: RoleItem[] = experience.roles.map((role) => ({
    id: role.id,
    areas: role.areas,
    current: role.current,
    years: <ContentText value={role.years} />,
    role: <ContentText value={role.role} />,
    org: <ContentText value={role.org} />,
    detail: (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="hidden font-mono text-xs tracking-[0.06em] text-text-3 min-[900px]:block">
            <ContentText value={role.years} />
          </p>
          <h3 className="text-xl font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[clamp(22px,2.2vw,30px)]">
            <ContentText value={role.role} />
          </h3>
          <p className="hidden text-base text-text-2 min-[900px]:block">
            <ContentText value={role.org} />
          </p>
        </div>
        <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-[1.45] text-[#d5d8dd] marker:text-text-muted sm:text-base sm:leading-[1.5]">
          {role.bullets.map((bullet) => (
            <li key={bullet}>
              <ContentText value={bullet} />
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-1.5">
          {role.stack.map((chip) => (
            <li
              key={chip.label}
              data-chip={chip.area}
              className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-text-2 sm:text-xs"
            >
              <ContentText value={chip.label} />
            </li>
          ))}
        </ul>
      </div>
    ),
  }));

  const education = (
    <section className={`${card} min-h-0 overflow-y-auto`}>
      <h3 className={heading}>{t.education}</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {profile.education.map((item) => (
          <p key={item.title} className="flex flex-col gap-0.5">
            <span className="text-base font-bold sm:text-[17px]">
              <ContentText value={item.title} />
            </span>
            <span className="text-sm text-text-3 sm:text-[15px]">
              <ContentText value={item.org} />
            </span>
          </p>
        ))}
      </div>
    </section>
  );

  const principles = (
    <section className={`${card} min-h-0 overflow-y-auto`}>
      <h3 className={heading}>{t.principles}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {profile.principles.map((item) => (
          <p key={item.title} className="flex flex-col gap-1">
            <span className="text-base font-bold sm:text-[17px]">
              <ContentText value={item.title} />
            </span>
            <span className="text-sm leading-[1.5] text-text-3 sm:text-[15px]">
              <ContentText value={item.text} />
            </span>
          </p>
        ))}
      </div>
    </section>
  );

  const footer = (
    <div className="flex flex-col gap-2 border-t border-[#1c1e22] pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="hidden text-[clamp(18px,1.8vw,24px)] min-[900px]:block font-bold leading-[1.2] tracking-[-0.02em]">
        {t.closingQuestion}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:flex">
        {isPlaceholder(cv) ? (
          <span
            className={`${button} border border-dashed border-border-strong text-center font-mono text-text-muted`}
          >
            <span className="sr-only">{t.downloadCv}: </span>
            <PendingText value={cv} />
          </span>
        ) : (
          <a href={cv} className={`${button} border border-border-strong font-semibold text-text hover:text-white`}>
            {t.downloadCv}
          </a>
        )}
        <a
          href={linkedin}
          target="_blank"
          rel="noopener"
          className={`${button} border border-border-strong font-semibold text-text hover:text-white`}
        >
          {t.linkedin} <span aria-hidden="true">↗</span>
          <span className="sr-only">{opensInNewTab}</span>
        </a>
        <a href="#contacto" className={`${button} bg-accent font-bold text-bg`}>
          {t.closingCta}
        </a>
      </div>
    </div>
  );

  return (
    <section
      id="trayectoria"
      aria-labelledby="trayectoria-title"
      className="flex h-svh min-h-[600px] flex-col px-4 py-4 sm:px-[clamp(16px,5vw,72px)] sm:py-6"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col gap-3 sm:gap-4">
        <SectionHeader
          compact
          id="trayectoria-title"
          eyebrow={t.eyebrow}
          title={[t.title]}
          intro={<p>{t.intro}</p>}
          aside={
            <a
              href="#contenido"
              className="hidden min-h-11 shrink-0 items-center whitespace-nowrap font-mono text-[13px] tracking-[0.04em] text-text-2 hover:text-white sm:inline-flex"
            >
              {backToTop}
            </a>
          }
        />

        <ExperienceExplorer
          areas={experience.areas}
          roles={roles}
          education={education}
          principles={principles}
          footer={footer}
          labels={{
            views: t.viewsLabel,
            tabs: t.tabs,
            filterGroup: t.filterLabel,
            all: t.all,
            current: t.current,
            highlighted: t.highlighted,
          }}
        />
      </div>
    </section>
  );
}
