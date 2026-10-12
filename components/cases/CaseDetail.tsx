import type { ReactNode } from "react";
import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
import { isPlaceholder, type Case } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { FlowDiagram } from "./FlowDiagram";
import { StatusBadge } from "./StatusBadge";

const heading =
  "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-3";

/** The pieces of one case detail, laid out together by CaseSelector so the
 * whole case fits one screen (columns from 900 px, tabs below). */
export type CaseParts = {
  head: ReactNode;
  flow: ReactNode;
  problem: ReactNode;
  decisions: ReactNode;
  results: ReactNode;
  stack: ReactNode;
};

export function caseDetailParts(item: Case, t: Messages["cases"]): CaseParts {
  const planned = item.status === "soon";
  const labels = {
    flow: item.labels?.flow ?? t.flow,
    decisions: item.labels?.decisions ?? t.decisions,
    results: item.labels?.results ?? t.results,
  };

  const head = (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div className="flex min-w-0 max-w-[860px] flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
          <span>
            {t.caseLabel} {item.num}
            {" · "}
            <ContentText value={item.title} />
            {item.context && (
              <span className="hidden sm:inline">
                {" · "}
                <ContentText value={item.context} />
              </span>
            )}
          </span>
          {/* The card already shows the status; on phones the room is for the detail. */}
          <span className="hidden sm:inline-flex">
            <StatusBadge status={item.status} label={item.statusLabel} variant="pill" />
          </span>
        </span>
        <h3
          id={`case-${item.slug}-title`}
          className="text-xl font-extrabold leading-[1.1] tracking-[-0.02em] min-[900px]:text-[clamp(22px,2.1vw,30px)]"
        >
          <ContentText value={item.kicker} />
        </h3>
      </div>

      {(item.links.length > 0 || item.note) && (
        <div className="flex flex-wrap gap-2">
          {item.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border-strong px-4 font-mono text-[13px] text-text hover:text-white"
            >
              <ContentText value={link.label} /> <span aria-hidden="true">↗</span>
              <span className="sr-only">{t.opensInNewTab}</span>
            </a>
          ))}
          {item.note && (
            <span className="inline-flex min-h-10 items-center justify-center rounded-full border border-dashed border-border-strong px-4 font-mono text-xs text-text-muted">
              <PendingText value={item.note} />
            </span>
          )}
        </div>
      )}
    </header>
  );

  const flow = (
    <section aria-label={labels.flow} className="flex flex-col gap-2">
      <h4 className={heading}>
        <ContentText value={labels.flow} />
      </h4>
      <FlowDiagram nodes={item.flow} planned={planned} />
    </section>
  );

  const problem = (
    <section className="flex flex-col gap-2">
      <h4 className={heading}>{t.problem}</h4>
      <p className="text-sm leading-[1.5] text-[#d5d8dd]">
        <ContentText value={item.problem} />
      </p>
    </section>
  );

  const decisions = (
    <section className="flex flex-col gap-2">
      <h4 className={heading}>
        <ContentText value={labels.decisions} />
      </h4>
      <ol className="flex flex-col gap-2.5">
        {item.decisions.map((decision, i) => (
          <li key={decision.title} className="flex gap-2.5">
            <span aria-hidden="true" className="shrink-0 font-mono text-xs leading-[1.5] text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">
                <ContentText value={decision.title} />
              </span>
              <span className="text-[13px] leading-[1.45] text-text-3">
                <ContentText value={decision.text} />
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );

  const results = (
    <section className="flex flex-col gap-2">
      <h4 className={heading}>
        <ContentText value={labels.results} />
      </h4>
      <ul className="flex flex-col gap-2">
        {item.results.map((result) =>
          isPlaceholder(result) ? (
            <li
              key={result}
              className="rounded-control border border-dashed border-border-strong px-3 py-2 text-[13px] leading-[1.45] text-text-muted"
            >
              <PendingText value={result} />
            </li>
          ) : (
            <li
              key={result}
              className="rounded-control border border-accent px-3 py-2 text-[13px] leading-[1.45] text-text"
            >
              <ContentText value={result} />
            </li>
          ),
        )}
      </ul>
    </section>
  );

  return {
    head,
    flow,
    problem,
    decisions,
    results,
    stack: <CaseStack stack={item.stack} label={t.stack} />,
  };
}

export function CaseStack({
  stack,
  label,
}: {
  stack: Case["stack"];
  label: string;
}) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {stack.map((tech) => (
        <li
          key={tech}
          className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-text-2"
        >
          <ContentText value={tech} />
        </li>
      ))}
    </ul>
  );
}
