import { Fragment } from "react";
import { ContentText } from "@/components/ui/ContentText";
import type { Case } from "@/lib/content/schema";

// Horizontal from 820 px, vertical below. The pulse between nodes is pure CSS
// (.flow-conn in globals.css), staggered 0.3 s and stopped by reduced motion.
export function FlowDiagram({
  nodes,
  planned,
}: {
  nodes: Case["flow"];
  planned: boolean;
}) {
  return (
    <ol className="flex flex-col min-[820px]:flex-row min-[820px]:items-stretch">
      {nodes.map((node, i) => (
        <Fragment key={`${node.tag}-${node.name}`}>
          {i > 0 && (
            <li
              aria-hidden="true"
              className="flow-conn"
              style={{ "--delay": `${(i * 0.3).toFixed(1)}s` } as React.CSSProperties}
            />
          )}
          <li
            className={`flex min-w-0 flex-col gap-1.5 rounded-xl border bg-surface-2 px-4 py-3.5 min-[820px]:flex-[1_1_0] min-[820px]:gap-2 min-[820px]:p-4 ${
              planned ? "border-dashed" : "border-solid"
            } ${node.badge ? "border-accent" : "border-border"}`}
          >
            <span className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted min-[820px]:text-[11px]">
              <ContentText value={node.tag} />
              {node.badge && (
                <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-bg">
                  <ContentText value={node.badge} />
                </span>
              )}
            </span>
            <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 min-[820px]:flex-col min-[820px]:items-start min-[820px]:gap-2">
              <span className="text-base font-bold leading-[1.2] min-[820px]:text-[17px]">
                <ContentText value={node.name} />
              </span>
              <span className="text-[13px] leading-[1.4] text-text-3">
                <ContentText value={node.sub} />
              </span>
            </span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
