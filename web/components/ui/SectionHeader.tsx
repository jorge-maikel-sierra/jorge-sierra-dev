import type { ReactNode } from "react";

// Eyebrow + two-line title (last word of line 2 in accent) + intro.
export function SectionHeader({
  id,
  eyebrow,
  titleLine1,
  titleLine2,
  intro,
  aside,
}: {
  id: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  intro: ReactNode;
  aside?: ReactNode;
}) {
  const cut = titleLine2.lastIndexOf(" ") + 1;

  return (
    <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
      <div className="flex max-w-[760px] flex-col gap-3.5 sm:gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3 sm:text-xs">
          {eyebrow}
        </p>
        <h2
          id={id}
          className="text-[40px] font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-h2"
        >
          {titleLine1} <br className="hidden sm:block" />
          {titleLine2.slice(0, cut)}
          <span className="text-accent">{titleLine2.slice(cut)}</span>
        </h2>
        <div className="max-w-[620px] text-base leading-[1.55] text-text-2 sm:text-[clamp(17px,1.4vw,19px)]">
          {intro}
        </div>
      </div>
      {aside}
    </div>
  );
}
