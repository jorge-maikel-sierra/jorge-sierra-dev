import type { ReactNode } from "react";
import { ContentText } from "@/components/ui/ContentText";
import { PendingText } from "@/components/ui/Placeholder";
import { isPlaceholder, type Case } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { FlowDiagram } from "./FlowDiagram";
import { StatusBadge } from "./StatusBadge";

const heading = "text-[13px] font-semibold text-text-2";

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
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          <span className="font-semibold text-text">
            <ContentText value={item.title} />
          </span>
          {item.context && (
            <span className="hidden text-text-3 sm:inline">
              <ContentText value={item.context} />
            </span>
          )}
          {/* The card already shows the status; on phones the room is for the detail. */}
          <span className="hidden sm:inline-flex">
            <StatusBadge status={item.status} label={item.statusLabel} />
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
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-border-strong px-3.5 text-sm font-semibold text-text hover:border-text-3 hover:text-white"
            >
              <ContentText value={link.label} /> <span aria-hidden="true">↗</span>
              <span className="sr-only">{t.opensInNewTab}</span>
            </a>
          ))}
          {item.note && (
            <span className="inline-flex min-h-10 items-center justify-center rounded-control border border-dashed border-border-strong px-3.5 text-[13px] text-text-muted">
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
      <p className="max-w-[62ch] text-sm leading-[1.55] text-text-2">
        <ContentText value={item.problem} />
      </p>
    </section>
  );

  const decisions = (
    <section className="flex flex-col gap-2">
      <h4 className={heading}>
        <ContentText value={labels.decisions} />
      </h4>
      {/* Decisions are not a sequence: a plain list, each one on its own rule. */}
      <ul className="flex flex-col gap-2.5">
        {item.decisions.map((decision) => (
          <li key={decision.title} className="flex flex-col gap-0.5 border-l border-border-strong pl-3">
            <span className="text-sm font-bold">
              <ContentText value={decision.title} />
            </span>
            <span className="text-[13px] leading-[1.45] text-text-3">
              <ContentText value={decision.text} />
            </span>
          </li>
        ))}
      </ul>
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
    <div className="text-[13px] leading-[1.5] text-text-3">
      <span aria-hidden="true" className="font-semibold text-text-2">
        {label}:{" "}
      </span>
      <ul aria-label={label} className="inline">
        {stack.map((tech, i) => (
          <li key={tech} className="inline">
            <ContentText value={tech} />
            {i < stack.length - 1 && ", "}
          </li>
        ))}
      </ul>
    </div>
  );
}
