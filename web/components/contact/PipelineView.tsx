import type { Messages } from "@/lib/messages";

// Waiting state only. Task 3.4 subscribes to lead_events through Supabase
// Realtime and lights each step when its real event arrives.
export function PipelineView({ t }: { t: Messages["contact"] }) {
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
        {t.steps.map((step, i) => (
          <li
            key={step}
            className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3.5 sm:grid-cols-[24px_minmax(0,1fr)] sm:gap-x-4"
          >
            <div aria-hidden="true" className="relative flex justify-center">
              {i < t.steps.length - 1 && (
                <div className="absolute bottom-0 top-1 w-0.5 bg-rail" />
              )}
              <div className="relative mt-[3px] size-3.5 rounded-full border-2 border-border-strong bg-surface sm:mt-1 sm:size-4" />
            </div>
            <div className="flex flex-col gap-1 pb-5">
              <span className="text-base font-bold text-text-faint sm:text-[17px]">
                {step}
              </span>
              <span className="font-mono text-xs leading-[1.5] text-[#5e646d]">
                {t.waiting}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div
        role="log"
        className="mt-auto flex min-h-[132px] flex-col gap-1 rounded-xl border border-[#1c1e22] bg-[#050607] px-4 py-3.5 font-mono text-xs leading-[1.6]"
      >
        <span className="text-text-faint">{t.logIdle}</span>
      </div>
    </section>
  );
}
