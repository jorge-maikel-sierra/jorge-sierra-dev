import { ContentText } from "@/components/ui/ContentText";
import type { CaseStatus } from "@/lib/content/schema";

// docs/design.md §3: done → accent, partial → text, building → warn, soon → muted.
export const statusText: Record<CaseStatus, string> = {
  done: "text-accent",
  partial: "text-text",
  building: "text-warn",
  soon: "text-text-muted",
};

const statusDot: Record<CaseStatus, string> = {
  done: "bg-accent",
  partial: "bg-text",
  building: "bg-warn",
  soon: "bg-text-muted",
};

export function StatusBadge({
  status,
  label,
  variant,
}: {
  status: CaseStatus;
  label: string;
  variant: "dot" | "pill";
}) {
  if (variant === "pill") {
    return (
      <span
        className={`rounded-full border border-current px-[9px] py-[3px] sm:px-2.5 sm:py-1 ${statusText[status]}`}
      >
        <ContentText value={label} />
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.06em] sm:text-[11px] ${statusText[status]}`}
    >
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${statusDot[status]}`} />
      <ContentText value={label} />
    </span>
  );
}
