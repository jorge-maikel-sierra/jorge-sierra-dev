import type { ReactNode } from "react";

// Eyebrow + title (last word in accent, desktop line break between lines) + intro.
export function SectionHeader({
  id,
  eyebrow,
  title,
  intro,
  aside,
  compact = false,
}: {
  id: string;
  eyebrow: string;
  title: [string] | [string, string];
  intro: ReactNode;
  aside?: ReactNode;
  /** Smaller heading, and the intro only where the screen has height to spare. */
  compact?: boolean;
}) {
  const last = title[title.length - 1];
  const cut = last.lastIndexOf(" ") + 1;

  return (
    <div
      className={`flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 ${compact ? "" : "sm:flex-wrap"}`}
    >
      <div className={`flex flex-col ${compact ? "max-w-[980px] gap-2" : "max-w-[760px] gap-3.5 sm:gap-4"}`}>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3 sm:text-xs">
          {eyebrow}
        </p>
        <h2
          id={id}
          className={`font-extrabold leading-[0.98] tracking-[-0.03em] ${
            compact ? "text-[clamp(26px,7vw,34px)] sm:text-[clamp(30px,3.6vw,52px)]" : "text-[40px] sm:text-h2"
          }`}
        >
          {title.length === 2 && (
            <>
              {title[0]} <br className="hidden sm:block" />
            </>
          )}
          {last.slice(0, cut)}
          <span className="text-accent">{last.slice(cut)}</span>
        </h2>
        <div
          className={`max-w-[620px] text-base leading-[1.55] text-text-2 sm:text-[clamp(17px,1.4vw,19px)] ${
            compact ? "tall-only" : ""
          }`}
        >
          {intro}
        </div>
      </div>
      {aside}
    </div>
  );
}
