import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
import { isPlaceholder, type Case } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { FlowDiagram } from "./FlowDiagram";
import { StatusBadge } from "./StatusBadge";

const heading =
  "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-3 sm:text-xs";

export function CaseDetail({
  item,
  t,
}: {
  item: Case;
  t: Messages["cases"];
}) {
  const planned = item.status === "soon";
  const labels = {
    flow: item.labels?.flow ?? t.flow,
    decisions: item.labels?.decisions ?? t.decisions,
    results: item.labels?.results ?? t.results,
  };

  return (
    <article
      aria-labelledby={`case-${item.slug}-title`}
      className="flex flex-col gap-7 sm:gap-9"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-5">
        <div className="flex max-w-[760px] flex-col gap-3">
          <span className="flex flex-wrap items-center gap-x-3.5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-accent sm:text-xs">
            <span>
              {t.caseLabel} {item.num}
              <span className="hidden sm:inline">
                {" · "}
                <ContentText value={item.type} />
              </span>
            </span>
            <StatusBadge status={item.status} label={item.statusLabel} variant="pill" />
          </span>
          <h3
            id={`case-${item.slug}-title`}
            className="text-[28px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[clamp(30px,3.4vw,48px)] sm:leading-[1.02] sm:tracking-[-0.025em]"
          >
            <ContentText value={item.kicker} />
          </h3>
          <p className="text-[15px] leading-[1.4] text-text-3 sm:text-base">
            <ContentText value={item.title} />
            {item.context && (
              <>
                {" · "}
                <ContentText value={item.context} />
              </>
            )}
          </p>
        </div>

        {(item.links.length > 0 || item.note) && (
          <div className="flex flex-wrap gap-2 pt-1 sm:gap-2.5 sm:pt-0">
            {item.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 flex-[1_1_120px] items-center justify-center gap-2 rounded-full border border-border-strong px-3.5 font-mono text-[13px] text-text hover:text-white sm:flex-none sm:px-4"
              >
                <ContentText value={link.label} /> <span aria-hidden="true">↗</span>
                <span className="sr-only">{t.opensInNewTab}</span>
              </a>
            ))}
            {item.note && (
              <span className="inline-flex min-h-11 flex-[1_1_140px] items-center justify-center rounded-full border border-dashed border-border-strong px-3.5 font-mono text-xs text-text-muted sm:flex-none sm:px-4 sm:text-[13px]">
                <PendingText value={item.note} />
              </span>
            )}
          </div>
        )}
      </header>

      <section aria-label={labels.flow} className="flex flex-col gap-3 sm:gap-3.5">
        <h4 className={heading}>
          <ContentText value={labels.flow} />
        </h4>
        <FlowDiagram nodes={item.flow} planned={planned} />
      </section>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] sm:gap-9">
        <section className="flex flex-col gap-2.5 sm:gap-3.5">
          <h4 className={heading}>{t.problem}</h4>
          <p className="text-base leading-[1.6] text-[#d5d8dd] sm:text-[17px]">
            <ContentText value={item.problem} />
          </p>
        </section>

        <section className="flex flex-col gap-3 sm:gap-3.5">
          <h4 className={heading}>
            <ContentText value={labels.decisions} />
          </h4>
          <ol className="flex flex-col gap-4 sm:gap-[18px]">
            {item.decisions.map((decision, i) => (
              <li key={decision.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="shrink-0 font-mono text-xs leading-[1.6] text-accent sm:hidden"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-base font-bold sm:text-[17px]">
                    <ContentText value={decision.title} />
                  </span>
                  <span className="text-[15px] leading-[1.55] text-text-3">
                    <ContentText value={decision.text} />
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-2.5 sm:gap-3.5">
          <h4 className={heading}>
            <ContentText value={labels.results} />
          </h4>
          <ul className="flex flex-col gap-2 sm:gap-2.5">
            {item.results.map((result) =>
              isPlaceholder(result) ? (
                <li
                  key={result}
                  className="rounded-control border border-dashed border-border-strong px-3.5 py-3 text-[15px] leading-[1.55] text-text-muted"
                >
                  <PendingText value={result} />
                </li>
              ) : (
                <li
                  key={result}
                  className="rounded-control border border-accent px-3.5 py-3 text-[15px] leading-[1.55] text-text"
                >
                  <ContentText value={result} />
                </li>
              ),
            )}
          </ul>
        </section>
      </div>

    </article>
  );
}

export function CaseStack({
  stack,
  label,
}: {
  stack: Case["stack"];
  label: string;
}) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5 sm:gap-2">
      {stack.map((tech) => (
        <li
          key={tech}
          className="rounded-full border border-border px-2.5 py-[5px] font-mono text-[11px] text-text-2 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          <ContentText value={tech} />
        </li>
      ))}
    </ul>
  );
}
