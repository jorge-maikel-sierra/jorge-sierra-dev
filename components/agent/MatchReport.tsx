import type { TraceData } from "@/lib/ai/agent";
import type { MatchReport as Report } from "@/lib/ai/mode";
import type { Messages } from "@/lib/messages";

const heading = "font-mono text-[11px] uppercase tracking-[0.08em] text-text-3";

// §7: fit report without a numeric score. Evidence links to its sources.
export function MatchReport({
  report,
  sources,
  t,
}: {
  report: Report;
  sources: TraceData["retrieved"];
  t: Messages["agent"]["report"];
}) {
  const link = (id: number) => {
    const source = sources.find((item) => item.id === id);
    return source?.url ? (
      <a
        key={id}
        href={source.url}
        target="_blank"
        rel="noopener"
        title={source.title}
        className="font-mono text-[11px] text-accent underline decoration-dotted underline-offset-2"
      >
        [{id}]
      </a>
    ) : (
      <span key={id} title={source?.title} className="font-mono text-[11px] text-accent">
        [{id}]
      </span>
    );
  };

  return (
    <section
      aria-label={t.title}
      className="flex flex-col gap-4 rounded-card border border-border bg-bg/60 p-4"
    >
      <div className="flex flex-col gap-1">
        <p className={heading}>{t.title}</p>
        <h3 className="text-lg font-bold text-text">{report.roleTitle}</h3>
        <p className="text-[15px] leading-[1.55] text-text-2">{report.summary}</p>
      </div>

      {report.matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className={heading}>{t.matches}</h4>
          <ul className="flex flex-col gap-2">
            {report.matches.map((match) => (
              <li
                key={match.requirement}
                className="rounded-control border border-accent/40 px-3 py-2.5 text-sm leading-[1.5]"
              >
                <p className="font-semibold text-text">{match.requirement}</p>
                <p className="text-text-2">
                  <span className="sr-only">{t.evidence}: </span>
                  {match.evidence} {match.sourceIds.map(link)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.gaps.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className={heading}>{t.gaps}</h4>
          <ul className="flex flex-col gap-2">
            {report.gaps.map((gap) => (
              <li
                key={gap.requirement}
                className="rounded-control border border-dashed border-border-strong px-3 py-2.5 text-sm leading-[1.5]"
              >
                <p className="font-semibold text-text">{gap.requirement}</p>
                <p className="text-text-2">{gap.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.interviewQuestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className={heading}>{t.questions}</h4>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm leading-[1.5] text-text-2 marker:text-text-muted">
            {report.interviewQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
