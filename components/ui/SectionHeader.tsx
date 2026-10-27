import type { ReactNode } from "react";
import { StageNode } from "./StageNode";

// Heading of a pinned section: the stage node, the real <h2> and a one-line
// intro shown only where the screen has height to spare. The aside (calls to
// action, back to top) sits at the right from 900 px.
export function SectionHeader({
  id,
  title,
  intro,
  aside,
}: {
  id: string;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
      <div className="flex min-w-0 max-w-[880px] flex-col gap-1.5">
        {/* The node sits inside the heading so its em offset follows the type size. */}
        <h2
          id={id}
          className="relative text-[24px] font-extrabold leading-[1.04] tracking-[-0.03em] text-balance sm:text-[clamp(28px,3.2vw,42px)]"
        >
          <StageNode />
          {title}
        </h2>
        {intro && <p className="tall-only max-w-[62ch] text-[15px] leading-[1.5] text-text-2">{intro}</p>}
      </div>
      {aside}
    </div>
  );
}
