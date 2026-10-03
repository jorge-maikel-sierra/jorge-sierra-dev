import type { ReactNode } from "react";
import type { TraceData } from "@/lib/ai/agent";

type Retrieved = TraceData["retrieved"];

const CITATION = /\[fuente:(\d+)\]/g;

/** Turns [fuente:N] into a numbered link to the source (§10, RF-2.3). */
function withCitations(text: string, sources: Retrieved, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION)) {
    out.push(text.slice(last, match.index));
    const id = Number(match[1]);
    const source = sources.find((item) => item.id === id);
    out.push(
      <sup key={`${key}-${match.index}`} className="mx-0.5 font-mono text-[11px]">
        {source?.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener"
            title={source.title}
            className="text-accent underline decoration-dotted underline-offset-2"
          >
            [{id}]
          </a>
        ) : (
          <span title={source?.title} className="text-accent">
            [{id}]
          </span>
        )}
      </sup>,
    );
    last = (match.index ?? 0) + match[0].length;
  }
  out.push(text.slice(last));
  return out;
}

/** Bold markers only; everything else is plain, React-escaped text. */
function inline(text: string, sources: Retrieved, key: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((piece, i) =>
    piece.startsWith("**") && piece.endsWith("**") ? (
      <strong key={`${key}-b${i}`} className="font-semibold text-text">
        {withCitations(piece.slice(2, -2), sources, `${key}-b${i}`)}
      </strong>
    ) : (
      withCitations(piece, sources, `${key}-t${i}`)
    ),
  );
}

/** Minimal rendering of the agent's answer: paragraphs and "- " lists. */
export function AgentMessage({ text, sources }: { text: string; sources: Retrieved }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-[1.6] text-text-2">
      {blocks.map((block, b) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*[-•*]\s+/.test(line))) {
          return (
            <ul key={b} className="flex list-disc flex-col gap-1 pl-5 marker:text-text-muted">
              {lines.map((line, l) => (
                <li key={l}>{inline(line.replace(/^\s*[-•*]\s+/, ""), sources, `${b}-${l}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={b}>{inline(block, sources, `${b}`)}</p>;
      })}
    </div>
  );
}
