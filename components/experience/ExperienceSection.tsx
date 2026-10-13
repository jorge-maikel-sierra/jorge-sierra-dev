import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
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
  backend: "bg-[#7cc8ff]",
  frontend: "bg-[#ffb86b]",
  cloud: "bg-[#c4a1ff]",
};

const button =
  "flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-control px-3 text-[13px] sm:min-h-12 sm:px-5 sm:text-base";

function Panel({
  icon,
  kicker,
  title,
  sub,
  tags,
  children,
}: {
  icon: IconName;
  kicker: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  tags?: ReactNode;
  children: ReactNode;
}) {
  return (
  <div className="flex flex-col gap-4 min-[700px]:gap-4">
    <header className="flex items-start gap-3.5 min-[700px]:gap-5">
      <span className="hidden size-14 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent min-[700px]:grid">
        <Icon name={icon} className="size-7" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3 min-[700px]:text-xs">{kicker}</p>
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

  const row =
    "flex items-start gap-2.5 min-[700px]:items-center min-[700px]:gap-4 min-[700px]:rounded-2xl min-[700px]:border min-[700px]:border-border min-[700px]:bg-bg/50 min-[700px]:p-3";
  const rowIcon =
    "grid size-6 shrink-0 place-items-center text-accent min-[700px]:size-10 min-[700px]:rounded-xl min-[700px]:border min-[700px]:border-border-strong min-[700px]:bg-surface-2";

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
        icon={role.areas.includes("ia") ? "sparkles" : "briefcase"}
        kicker={
          <>
            <ContentText value={role.years} />
            {role.current && ` · ${t.current}`}
          </>
        }
        title={<ContentText value={role.role} />}
        sub={<ContentText value={role.org} />}
        tags={
          <ul className="hidden flex-wrap justify-end gap-1.5 min-[1100px]:flex min-[1100px]:max-w-[260px]">
            {role.areas.map((area) => (
              <li
                key={area}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-2.5 py-1 font-mono text-[11px] text-text-2"
              >
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
              <span className="text-sm leading-[1.4] text-[#d5d8dd] min-[700px]:text-[15px] min-[700px]:leading-[1.45]">
                <ContentText value={bullet} />
              </span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-1.5">
          {role.stack.map((chip) => (
            <li
              key={chip.label}
              data-chip={chip.area}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-text-2 min-[700px]:text-[13px]"
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
      sub: profile.education.map((item) => item.title).join(" · "),
      announce: t.education,
      detail: (
        <Panel key="detail" icon="graduation" kicker={t.education} title={t.tabs.education}>
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
      sub: profile.principles.map((item) => item.title).join(" · "),
      announce: t.principles,
      detail: (
        <Panel key="detail" icon="target" kicker={t.principles} title={t.tabs.principles}>
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
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 min-[700px]:flex-nowrap">
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3">{t.eyebrow}</p>
              <h2
                id="trayectoria-title"
                className="text-[22px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[clamp(26px,3vw,38px)]"
              >
                {t.title.slice(0, t.title.lastIndexOf(" ") + 1)}
                <span className="text-accent">{t.title.slice(t.title.lastIndexOf(" ") + 1)}</span>
              </h2>
              <p className="cf-intro max-w-[560px] text-sm leading-[1.45] text-text-2">{t.intro}</p>
            </div>
            <a
              href="#contenido"
              className="hidden min-h-10 shrink-0 items-center whitespace-nowrap font-mono text-[13px] tracking-[0.04em] text-text-2 hover:text-white min-[700px]:inline-flex"
            >
              {backToTop}
            </a>
          </div>
        }
      />
    </section>
  );
}
