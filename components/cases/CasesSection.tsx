import { ContentText } from "@/components/ui/ContentText";
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
    flow: item.flow.map((node) => ({ tag: node.tag, name: <ContentText value={node.name} /> })),
  }));

  return (
    <section id="casos" aria-labelledby="casos-title" className="scroll-mt-4 pb-14 sm:pb-24">
      <CaseSelector
        cases={summaries}
        header={
          <div className="flex flex-col items-center gap-2.5 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3 sm:text-xs">
              {t.eyebrow}
            </p>
            <h2
              id="casos-title"
              className="text-[34px] font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-[clamp(36px,4.2vw,56px)]"
            >
              {t.titleLine1} <span className="text-accent">{t.titleLine2}</span>
            </h2>
            <p className="max-w-[620px] text-[15px] leading-[1.5] text-text-2 sm:text-base">
              <span className="sm:hidden">{t.introMobile}</span>
              <span className="hidden sm:inline">{t.intro}</span>
            </p>
          </div>
        }
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
          viewCase: t.viewCase,
        }}
      />

      <div className="mx-auto mt-10 flex max-w-[1280px] flex-col gap-7 px-4 sm:mt-14 sm:gap-10 sm:px-[clamp(16px,5vw,72px)]">
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
