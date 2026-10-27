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
}: {
  status: CaseStatus;
  label: string;
}) {
  return (
    <span className={`flex items-center gap-2 text-[13px] font-semibold ${statusText[status]}`}>
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${statusDot[status]}`} />
      <ContentText value={label} />
    </span>
  );
}
