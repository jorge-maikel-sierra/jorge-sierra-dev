import type { ReactNode } from "react";

// Eyebrow + title (last word in accent, desktop line break between lines) + intro.
export function SectionHeader({
  id,
  eyebrow,
  title,
  intro,
  aside,
}: {
  id: string;
  eyebrow: string;
  title: [string] | [string, string];
  intro: ReactNode;
  aside?: ReactNode;
}) {
  const last = title[title.length - 1];
  const cut = last.lastIndexOf(" ") + 1;

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
          {title.length === 2 && (
            <>
              {title[0]} <br className="hidden sm:block" />
            </>
          )}
          {last.slice(0, cut)}
          <span className="text-accent">{last.slice(cut)}</span>
        </h2>
        <div className="max-w-[620px] text-base leading-[1.55] text-text-2 sm:text-[clamp(17px,1.4vw,19px)]">
          {intro}
        </div>
      </div>
      {aside}
    </div>
  );
}
