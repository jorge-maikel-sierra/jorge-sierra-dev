import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
import { isPlaceholder, type Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";

const card =
  "flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-5 sm:p-6";
const cardHeading =
  "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-3 sm:text-xs";
const button =
  "flex min-h-[52px] flex-[1_1_140px] items-center justify-center gap-1 rounded-xl px-[18px] text-base sm:min-h-12 sm:rounded-control";

export function SideCards({
  profile,
  t,
  opensInNewTab,
}: {
  profile: Profile;
  t: Messages["experience"];
  opensInNewTab: string;
}) {
  const { cv, linkedin } = profile.links;

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <section className={card}>
        <h3 className={cardHeading}>{t.education}</h3>
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
      </section>

      <section className={card}>
        <h3 className={cardHeading}>{t.principles}</h3>
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
      </section>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        {isPlaceholder(cv) ? (
          <span
            className={`${button} border border-dashed border-border-strong text-center font-mono text-[13px] text-text-muted`}
          >
            <span className="sr-only">{t.downloadCv}: </span>
            <PendingText value={cv} />
          </span>
        ) : (
          <a href={cv} className={`${button} bg-accent font-bold text-bg`}>
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
        <a
          href="#contacto"
          className="flex min-h-[52px] items-center justify-between border-b border-[#1c1e22] px-1 text-[17px] font-semibold text-text sm:hidden"
        >
          {t.closingMobile}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </aside>
  );
}
