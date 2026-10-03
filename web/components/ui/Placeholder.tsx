import es from "@/messages/es.json";

// Data Jorge has not provided yet (CLAUDE.md rule 2). Never replace it with
// plausible values: show it as a visible marker.
export function Placeholder({
  children,
  pendingLabel = es.placeholder.pending,
}: {
  children: string;
  pendingLabel?: string;
}) {
  return (
    <span
      data-placeholder=""
      className="rounded-md border border-dashed border-border-strong px-1.5 text-text-muted [box-decoration-break:clone]"
    >
      <span className="sr-only">{pendingLabel} </span>
      {children}
    </span>
  );
}
