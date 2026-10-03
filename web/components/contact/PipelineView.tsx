import {
  activeStep,
  PIPELINE_STEPS,
  type PipelineState,
  type PipelineStep,
} from "@/lib/contact/pipeline";
import type { Messages } from "@/lib/messages";

type Sender = { name: string; email: string } | null;

const fill = (template: string, values: Record<string, string | undefined>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "—");

// Each step lights up only when its real event arrives from lead_events
// (design-reference/Contacto.dc.html, RF-5.2).
export function PipelineView({
  t,
  state,
  sender,
  onAgain,
}: {
  t: Messages["contact"];
  state: PipelineState;
  sender: Sender;
  onAgain: () => void;
}) {
  const current = activeStep(state);
  const values = {
    intent: state.meta.intent,
    priority: state.meta.priority,
    name: sender?.name,
    email: sender?.email,
  };
  const finished = state.status === "done" || state.status === "failed";

  return (
    <section
      aria-labelledby="pipeline-title"
      className="flex min-w-0 flex-col gap-4 rounded-[18px] border border-border bg-surface px-4 py-[18px] sm:flex-[1_1_440px] sm:gap-[18px] sm:rounded-[20px] sm:p-[clamp(20px,2.6vw,32px)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="pipeline-title"
          className="font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-text-3 sm:text-xs"
        >
          {t.pipelineTitle}
        </h3>
        <p className="font-mono text-[10px] tracking-[0.06em] text-text-faint sm:text-[11px]">
          {t.pipelineNote}
        </p>
      </div>

      <ol className="flex flex-col">
        {PIPELINE_STEPS.map((step: PipelineStep, i) => {
          const done = state.done.includes(step);
          const active = current === step;
          return (
            <li
              key={step}
              data-step={step}
              data-state={done ? "done" : active ? "active" : "waiting"}
              className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3.5 sm:grid-cols-[24px_minmax(0,1fr)] sm:gap-x-4"
            >
              <div aria-hidden="true" className="relative flex justify-center">
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`absolute bottom-0 top-1 w-0.5 ${done ? "bg-accent" : "bg-rail"}`}
                  />
                )}
                <div
                  className={`relative mt-[3px] size-3.5 rounded-full border-2 sm:mt-1 sm:size-4 ${
                    done
                      ? "border-accent bg-accent"
                      : active
                        ? "pipeline-blink border-accent bg-surface"
                        : "border-border-strong bg-surface"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1 pb-5">
                <span
                  className={`text-base font-bold sm:text-[17px] ${
                    done || active ? "text-text" : "text-text-faint"
                  }`}
                >
                  {t.steps[i]}
                </span>
                <span
                  className={`font-mono text-xs leading-[1.5] ${
                    done ? "text-text-2" : active ? "text-accent" : "text-text-faint"
                  }`}
                >
                  {done || active ? fill(t.stepDetails[step], values) : t.waiting}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        role="log"
        aria-live="polite"
        className="mt-auto flex min-h-[132px] flex-col gap-1 rounded-xl border border-[#1c1e22] bg-[#050607] px-4 py-3.5 font-mono text-xs leading-[1.6]"
      >
        {state.status === "idle" && <span className="text-text-faint">{t.logIdle}</span>}
        {state.done.map((step) => (
          <span key={step} className="text-text-2">
            <span aria-hidden="true" className="text-accent">
              ✓
            </span>{" "}
            {fill(t.stepLogs[step], values)}
          </span>
        ))}
        {state.status === "done" && <span className="pt-1.5 text-text">{t.done}</span>}
        {state.status === "failed" && <span className="pt-1.5 text-text">{t.failed}</span>}
      </div>

      {finished && (
        <button
          type="button"
          onClick={onAgain}
          className="min-h-11 rounded-full border border-border-strong font-mono text-xs uppercase tracking-[0.06em] text-text"
        >
          {t.sendAnother}
        </button>
      )}
    </section>
  );
}
