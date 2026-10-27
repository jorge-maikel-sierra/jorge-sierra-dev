import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isPlaceholder, type Experience, type Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import type { ReactNode } from "react";
import type { AreaId } from "@/lib/content/schema";
import { ExperienceStack, type ExperienceCard } from "./ExperienceStack";
import { Icon, type IconName } from "./icons";

const AREA_ICON: Record<AreaId, IconName> = {
  ia: "sparkles",
  backend: "server",
  frontend: "monitor",
  cloud: "cloud",
};
const AREA_DOT: Record<AreaId, string> = {
  ia: "bg-accent",
  backend: "bg-sky",
  frontend: "bg-amber",
  cloud: "bg-violet",
};

const button =
  "flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-control px-3 text-[13px] sm:min-h-12 sm:px-5 sm:text-base";

function Panel({
  kicker,
  title,
  sub,
  tags,
  children,
}: {
  kicker: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  tags?: ReactNode;
  children: ReactNode;
}) {
  return (
  <div className="flex flex-col gap-4 min-[700px]:gap-4">
    <header className="flex items-start gap-3.5 min-[700px]:gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[13px] font-semibold text-text-3 min-[700px]:text-sm">{kicker}</p>
        <h3 className="text-xl font-extrabold leading-[1.1] tracking-[-0.02em] min-[700px]:text-[clamp(24px,2.4vw,34px)]">
          {title}
        </h3>
        {sub && <p className="text-[15px] text-text-2 min-[700px]:text-lg">{sub}</p>}
      </div>
      {tags}
    </header>
    {children}
  </div>
);
}

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

  const areaLabel = Object.fromEntries(experience.areas.map((area) => [area.id, area.label]));

  const bulletIcons: Record<string, IconName[]> = {
    soaint: ["users", "workflow", "chip"],
    "ix-colombia": ["briefcase", "check", "code", "globe"],
    sena: ["server", "cloud"],
  };

  // Rows on hairlines instead of boxed cards: the panel is already the card.
  const row =
    "flex items-start gap-3 border-t border-hairline pt-2.5 first:border-t-0 first:pt-0 min-[700px]:gap-3.5";
  const rowIcon = "grid size-6 shrink-0 place-items-center text-accent";

  const cards: ExperienceCard[] = experience.roles.map((role) => ({
    id: role.id,
    areas: role.areas,
    current: role.current,
    icon: <Icon name={role.areas.includes("ia") ? "sparkles" : role.areas.includes("frontend") ? "monitor" : "server"} className="size-5 min-[700px]:size-6" />,
    meta: <ContentText key="meta" value={role.years} />,
    title: <ContentText key="title" value={role.role} />,
    sub: <ContentText key="sub" value={role.org} />,
    announce: `${role.role}, ${role.org}`,
    detail: (
      <Panel
        key="detail"
        kicker={
          <span className="flex flex-wrap gap-x-3">
            <ContentText value={role.years} />
            {role.current && <span className="text-accent">{t.current}</span>}
          </span>
        }
        title={<ContentText value={role.role} />}
        sub={<ContentText value={role.org} />}
        tags={
          <ul className="hidden flex-col items-end gap-1 min-[1100px]:flex">
            {role.areas.map((area) => (
              <li key={area} className="inline-flex items-center gap-1.5 text-[13px] text-text-2">
                <Icon name={AREA_ICON[area]} className="size-3.5 text-accent" />
                {areaLabel[area]}
              </li>
            ))}
          </ul>
        }
      >
        <ul className="flex flex-col gap-2.5 min-[700px]:gap-2">
          {role.bullets.map((bullet, i) => (
            <li key={bullet} className={row}>
              <span className={rowIcon}>
                <Icon name={bulletIcons[role.id]?.[i] ?? "check"} className="size-4 min-[700px]:size-5" />
              </span>
              <span className="text-sm leading-[1.45] text-text-2 min-[700px]:text-[15px]">
                <ContentText value={bullet} />
              </span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-hairline pt-3">
          {role.stack.map((chip) => (
            <li
              key={chip.label}
              data-chip={chip.area}
              className="inline-flex items-center gap-1.5 text-[13px] text-text-2"
            >
              <span aria-hidden="true" className={`size-1.5 rounded-full ${AREA_DOT[chip.area]}`} />
              <ContentText value={chip.label} />
            </li>
          ))}
        </ul>
      </Panel>
    ),
  }));

  const educationIcons: IconName[] = ["graduation", "award", "languages"];
  const principleIcons: IconName[] = ["target", "file"];

  cards.push(
    {
      id: "education",
      areas: [],
      current: false,
      icon: <Icon name="graduation" className="size-5 min-[700px]:size-6" />,
      meta: t.education,
      title: t.tabs.education,
      sub: profile.education.map((item) => item.title).join(", "),
      announce: t.education,
      detail: (
        <Panel key="detail" kicker={t.education} title={t.tabs.education}>
          <ul className="flex flex-col gap-2.5 min-[700px]:gap-2">
            {profile.education.map((item, i) => (
              <li key={item.title} className={row}>
                <span className={rowIcon}>
                  <Icon name={educationIcons[i] ?? "check"} className="size-4 min-[700px]:size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-bold min-[700px]:text-lg">
                    <ContentText value={item.title} />
                  </span>
                  <span className="text-sm text-text-3 min-[700px]:text-[15px]">
                    <ContentText value={item.org} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
    {
      id: "principles",
      areas: [],
      current: false,
      icon: <Icon name="target" className="size-5 min-[700px]:size-6" />,
      meta: t.principles,
      title: t.tabs.principles,
      sub: profile.principles.map((item) => item.title).join(", "),
      announce: t.principles,
      detail: (
        <Panel key="detail" kicker={t.principles} title={t.tabs.principles}>
          <ul className="flex flex-col gap-2.5 min-[700px]:gap-2">
            {profile.principles.map((item, i) => (
              <li key={item.title} className={row}>
                <span className={rowIcon}>
                  <Icon name={principleIcons[i] ?? "check"} className="size-4 min-[700px]:size-5" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-base font-bold min-[700px]:text-lg">
                    <ContentText value={item.title} />
                  </span>
                  <span className="text-sm leading-[1.5] text-text-3 min-[700px]:text-[15px]">
                    <ContentText value={item.text} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ),
    },
  );

  const footer = (
    <div className="flex flex-col gap-2 border-t border-hairline pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="hidden text-[clamp(18px,1.8vw,24px)] min-[900px]:block font-bold leading-[1.2] tracking-[-0.02em]">
        {t.closingQuestion}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:flex">
        {isPlaceholder(cv) ? (
          <span
            className={`${button} border border-dashed border-border-strong text-center text-text-muted`}
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
    <section id="trayectoria" aria-labelledby="trayectoria-title">
      <ExperienceStack
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
          <SectionHeader
            id="trayectoria-title"
            title={t.title}
            intro={t.intro}
            aside={
              <a
                href="#contenido"
                className="hidden min-h-10 shrink-0 items-center whitespace-nowrap text-sm font-medium text-text-2 hover:text-white min-[700px]:inline-flex"
              >
                {backToTop}
              </a>
            }
          />
        }
      />
    </section>
  );
}
