import type { TraceData } from "@/lib/ai/agent";
import type { Messages } from "@/lib/messages";

// §10 "Bajo el capó": collapsed by default; tells a tech lead the agent is instrumented.
export function TracePanel({ trace, t }: { trace: TraceData; t: Messages["agent"]["trace"] }) {
  const row = "flex justify-between gap-4 border-b border-rail py-1.5 last:border-0";
  return (
    <details className="group rounded-control border border-border bg-bg/60 font-mono text-xs text-text-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 uppercase tracking-[0.08em] text-text-3 [&::-webkit-details-marker]:hidden">
        <span>{t.summary}</span>
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="flex flex-col gap-3 px-3 pb-3">
        <dl>
          <div className={row}>
            <dt className="text-text-3">{t.mode}</dt>
            <dd>{t.modes[trace.mode]}</dd>
          </div>
          <div className={row}>
            <dt className="text-text-3">{t.model}</dt>
            <dd>{trace.model}</dd>
          </div>
          <div className={row}>
            <dt className="text-text-3">{t.tokens}</dt>
            <dd>
              {trace.tokens.input} → {trace.tokens.output}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-text-3">{t.cost}</dt>
            <dd>US$ {trace.costUsd.toFixed(4)}</dd>
          </div>
          <div className={row}>
            <dt className="text-text-3">{t.invalidCitations}</dt>
            <dd>{trace.invalidCitations}</dd>
          </div>
        </dl>
        <div>
          <p className="pb-1 uppercase tracking-[0.08em] text-text-3">{t.steps}</p>
          <ol className="flex flex-col gap-0.5">
            {trace.steps.map((step) => (
              <li key={step.name} className="flex justify-between gap-4">
                <span>{t.stepNames[step.name]}</span>
                <span>{step.ms} ms</span>
              </li>
            ))}
          </ol>
        </div>
        {trace.retrieved.length > 0 && (
          <div>
            <p className="pb-1 uppercase tracking-[0.08em] text-text-3">{t.retrieved}</p>
            <ol className="flex flex-col gap-0.5">
              {trace.retrieved.map((source) => (
                <li key={source.id} className="flex justify-between gap-4">
                  <span className="truncate">
                    [{source.id}] {source.title} · {source.sourceType}
                  </span>
                  <span className="shrink-0">{source.score.toFixed(4)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </details>
  );
}
