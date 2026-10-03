import type { Messages } from "@/lib/messages";

// Static shell of the agent input. Streaming, reports and traces arrive in 4.6.
export function AgentBox({ t }: { t: Messages["hero"] }) {
  return (
    <div
      id="agente"
      className="flex scroll-mt-6 flex-col gap-3 rounded-2xl border border-border bg-[#0c0d10] p-4 sm:bg-[rgba(12,13,16,0.86)]"
    >
      <label
        htmlFor="ask"
        className="font-mono text-xs uppercase tracking-[0.08em] text-text-3"
      >
        {t.agentLabel}
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <input
          id="ask"
          type="text"
          placeholder={t.agentPlaceholder}
          className="h-12 w-full min-w-0 rounded-control border border-border-strong bg-surface px-3.5 text-base text-text placeholder:text-text-faint sm:w-auto sm:flex-[1_1_260px] sm:px-4"
        />
        <button
          type="button"
          className="flex h-12 items-center justify-center gap-2 rounded-control bg-accent px-5 text-base font-bold text-bg"
        >
          {t.agentSubmit}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
