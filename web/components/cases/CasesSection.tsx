import { ContentText } from "@/components/ui/ContentText";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Case, Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { CaseDetail, CaseStack } from "./CaseDetail";
import { CaseSelector, type CaseSummary } from "./CaseSelector";
import { StatusBadge } from "./StatusBadge";

export function CasesSection({
  cases,
  github,
  t,
}: {
  cases: Case[];
  github: Profile["links"]["github"];
  t: Messages["cases"];
}) {
  const summaries: CaseSummary[] = cases.map((item) => ({
    slug: item.slug,
    num: item.num,
    title: <ContentText value={item.title} />,
    type: <ContentText value={item.type} />,
    kicker: <ContentText value={item.kicker} />,
    status: item.status,
    statusBadge: (
      <StatusBadge status={item.status} label={item.statusLabel} variant="dot" />
    ),
    announce: `${t.caseLabel} ${item.num}: ${item.title}`,
  }));

  return (
    <section
      id="casos"
      aria-labelledby="casos-title"
      className="scroll-mt-4 px-4 pb-14 pt-4 sm:px-[clamp(16px,5vw,72px)] sm:pb-24 sm:pt-14"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-7 sm:gap-10">
        <SectionHeader
          id="casos-title"
          eyebrow={t.eyebrow}
          titleLine1={t.titleLine1}
          titleLine2={t.titleLine2}
          intro={
            <>
              <p className="sm:hidden">{t.introMobile}</p>
              <p className="hidden sm:block">{t.intro}</p>
            </>
          }
          aside={
            <a
              href="#contenido"
              className="hidden min-h-11 items-center font-mono text-[13px] tracking-[0.04em] text-text-2 hover:text-white sm:inline-flex"
            >
              {t.backToTop}
            </a>
          }
        />

        <CaseSelector
          cases={summaries}
          details={cases.map((item) => (
            <CaseDetail key={item.slug} item={item} t={t} />
          ))}
          stacks={cases.map((item) => (
            <CaseStack key={item.slug} stack={item.stack} label={t.stack} />
          ))}
          labels={{
            selector: t.selectorLabel,
            previous: t.previous,
            next: t.next,
            previousLabel: t.previousLabel,
            nextLabel: t.nextLabel,
          }}
        />

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:border-t sm:border-[#1c1e22] sm:pt-8">
          <p className="max-w-[720px] text-2xl font-bold leading-[1.2] tracking-[-0.02em] sm:text-[clamp(22px,2.4vw,32px)]">
            {t.closingQuestion}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-3">
            <a
              href="#agente"
              className="flex min-h-[52px] items-center justify-center rounded-xl bg-accent px-5 text-base font-bold text-bg sm:min-h-12 sm:rounded-control"
            >
              {t.closingAgent}
            </a>
            <a
              href={github}
              target="_blank"
              rel="noopener"
              className="flex min-h-[52px] items-center justify-center gap-1 rounded-xl border border-border-strong px-5 text-base font-semibold text-text hover:text-white sm:min-h-12 sm:rounded-control"
            >
              {t.closingGithub} <span aria-hidden="true">↗</span>
              <span className="sr-only">{t.opensInNewTab}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
