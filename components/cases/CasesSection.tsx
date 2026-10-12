import { ContentText } from "@/components/ui/ContentText";
import type { Case, Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { caseDetailParts } from "./CaseDetail";
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
    status: item.status,
    statusBadge: (
      <StatusBadge status={item.status} label={item.statusLabel} variant="dot" />
    ),
    announce: `${t.caseLabel} ${item.num}: ${item.title}`,
  }));

  const cta = (
    <div className="flex flex-wrap items-center gap-2.5">
      <a
        href="#agente"
        className="flex min-h-10 items-center justify-center rounded-control bg-accent px-4 text-sm font-bold text-bg"
      >
        {t.closingAgent}
      </a>
      <a
        href={github}
        target="_blank"
        rel="noopener"
        className="flex min-h-10 items-center justify-center gap-1 rounded-control border border-border-strong px-4 text-sm font-semibold text-text hover:text-white"
      >
        {t.closingGithub} <span aria-hidden="true">↗</span>
        <span className="sr-only">{t.opensInNewTab}</span>
      </a>
    </div>
  );

  return (
    <section id="casos" aria-labelledby="casos-title" className="scroll-mt-4">
      <CaseSelector
        cases={summaries}
        parts={cases.map((item) => caseDetailParts(item, t))}
        header={
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3">
                {t.eyebrow}
              </p>
              <h2
                id="casos-title"
                className="text-[28px] font-extrabold leading-[1] tracking-[-0.03em] sm:text-[clamp(30px,3.4vw,44px)]"
              >
                {t.titleLine1} <span className="text-accent">{t.titleLine2}</span>
              </h2>
              <p className="cf-intro max-w-[560px] text-sm leading-[1.45] text-text-2">{t.intro}</p>
            </div>
            <div className="hidden items-center gap-5 min-[900px]:flex">
              <p className="hidden max-w-[300px] text-right text-sm font-semibold leading-[1.3] min-[1600px]:block">
                {t.closingQuestion}
              </p>
              {cta}
            </div>
          </div>
        }
        labels={{
          selector: t.selectorLabel,
          tabs: t.tabs,
        }}
        footer={cta}
      />
    </section>
  );
}
