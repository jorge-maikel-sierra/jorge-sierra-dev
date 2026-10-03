import type { TraceData } from "@/lib/ai/agent";

export function Sources({ sources, label }: { sources: TraceData["retrieved"]; label: string }) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3">{label}</p>
      <ol className="flex flex-wrap gap-1.5">
        {sources.map((source) => (
          <li key={source.id}>
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border px-2.5 font-mono text-[11px] text-text-2 hover:text-white"
              >
                <span className="text-accent">[{source.id}]</span> {source.title}
              </a>
            ) : (
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border px-2.5 font-mono text-[11px] text-text-2">
                <span className="text-accent">[{source.id}]</span> {source.title}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
