import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
import { isPlaceholder, type Experience, type Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { ExperienceSelector, type ExperienceCard } from "./ExperienceSelector";

const headingClass = "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-3";
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

  const cards: ExperienceCard[] = experience.roles.map((role) => ({
    id: role.id,
    areas: role.areas,
    current: role.current,
    meta: <ContentText key="meta" value={role.years} />,
    title: <ContentText key="title" value={role.role} />,
    sub: <ContentText key="sub" value={role.org} />,
    announce: `${role.role}, ${role.org}`,
    detail: (
      <div key="detail" className="flex flex-col gap-3">
        <h3 className="sr-only">
          <ContentText value={role.role} /> · <ContentText value={role.org} />
        </h3>
        <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-[1.45] text-[#d5d8dd] marker:text-text-muted sm:text-base sm:leading-[1.5] roomy:text-lg roomy:leading-[1.55]">
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
              className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-text-2 sm:text-xs roomy:text-[13px]"
            >
              <ContentText value={chip.label} />
            </li>
          ))}
        </ul>
      </div>
    ),
  }));

  cards.push(
    {
      id: "education",
      areas: [],
      current: false,
      meta: t.education,
      title: t.tabs.education,
      sub: profile.education.map((item) => item.title).join(" · "),
      announce: t.education,
      detail: (
        <div className="flex flex-col gap-3">
          <h3 className={headingClass}>{t.education}</h3>
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
        </div>
      ),
    },
    {
      id: "principles",
      areas: [],
      current: false,
      meta: t.principles,
      title: t.tabs.principles,
      sub: profile.principles.map((item) => item.title).join(" · "),
      announce: t.principles,
      detail: (
        <div className="flex flex-col gap-3">
          <h3 className={headingClass}>{t.principles}</h3>
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
        </div>
      ),
    },
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
    <section id="trayectoria" aria-labelledby="trayectoria-title" className="scroll-mt-4">
      <ExperienceSelector
        areas={experience.areas}
        cards={cards}
        footer={footer}
        labels={{
          filterGroup: t.filterLabel,
          all: t.all,
          current: t.current,
          highlighted: t.highlighted,
        }}
        heading={
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 min-[900px]:flex-nowrap">
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3">{t.eyebrow}</p>
              <h2
                id="trayectoria-title"
                className="max-w-[980px] text-[26px] font-extrabold leading-[1] tracking-[-0.03em] sm:text-[clamp(30px,3.4vw,44px)]"
              >
                {t.title.slice(0, t.title.lastIndexOf(" ") + 1)}
                <span className="text-accent">{t.title.slice(t.title.lastIndexOf(" ") + 1)}</span>
              </h2>
              <p className="cf-intro max-w-[560px] text-sm leading-[1.45] text-text-2">{t.intro}</p>
            </div>
            <a
              href="#contenido"
              className="hidden min-h-10 shrink-0 items-center whitespace-nowrap font-mono text-[13px] tracking-[0.04em] text-text-2 hover:text-white min-[900px]:inline-flex"
            >
              {backToTop}
            </a>
          </div>
        }
      />
    </section>
  );
}
