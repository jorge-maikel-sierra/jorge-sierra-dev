import { ContentText } from "@/components/ui/ContentText";
import type { Role } from "@/lib/content/schema";

export function Timeline({
  roles,
  currentLabel,
}: {
  roles: Role[];
  currentLabel: string;
}) {
  return (
    <ol className="flex min-w-0 flex-col">
      {roles.map((role) => (
        <li
          key={role.id}
          data-role=""
          data-areas={role.areas.join(" ")}
          className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-4 transition-opacity duration-300 motion-reduce:transition-none sm:grid-cols-[28px_minmax(0,1fr)] sm:gap-x-6"
        >
          <div aria-hidden="true" className="relative flex justify-center">
            <div className="absolute inset-y-0 w-0.5 bg-rail" />
            <div
              data-role-dot=""
              className={`relative mt-1 size-3.5 rounded-full border-2 border-accent sm:mt-1.5 sm:size-4 ${
                role.current ? "bg-accent" : "bg-bg"
              }`}
            />
          </div>

          <div className="flex flex-col gap-2.5 pb-9 sm:gap-3 sm:pb-12">
            <p
              className={`flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.06em] sm:gap-2.5 sm:text-xs ${
                role.current ? "text-accent" : "text-text-3"
              }`}
            >
              <span>
                <ContentText value={role.years} />
              </span>
              {role.current && (
                <span className="rounded-full bg-accent px-2 py-0.5 uppercase text-bg sm:px-[9px] sm:py-[3px]">
                  {currentLabel}
                </span>
              )}
            </p>
            <h3 className="text-[23px] font-extrabold leading-[1.12] tracking-[-0.02em] sm:text-[clamp(24px,2.4vw,32px)] sm:leading-[1.1]">
              <ContentText value={role.role} />
            </h3>
            <p className="text-[15px] leading-[1.4] text-text-2 sm:text-[17px]">
              <ContentText value={role.org} />
            </p>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[15px] leading-[1.55] text-[#d5d8dd] marker:text-text-muted sm:gap-2 sm:pl-[18px] sm:text-base">
              {role.bullets.map((bullet) => (
                <li key={bullet}>
                  <ContentText value={bullet} />
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-1.5 sm:pt-1">
              {role.stack.map((chip) => (
                <li
                  key={chip.label}
                  data-chip={chip.area}
                  className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-text-2 transition-colors motion-reduce:transition-none sm:px-[11px] sm:py-[5px] sm:text-xs"
                >
                  <ContentText value={chip.label} />
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
