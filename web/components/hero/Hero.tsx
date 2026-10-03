import { AgentBox } from "@/components/agent/AgentBox";
import type { Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { HeroFallback } from "./HeroFallback";

// Colors the last word of each title line: "caos" in chaos, "arquitectura." in accent.
function TitleLine({ text, color }: { text: string; color: string }) {
  const cut = text.lastIndexOf(" ") + 1;
  return (
    <>
      {text.slice(0, cut)}
      <span className={color}>{text.slice(cut)}</span>
    </>
  );
}

const ctaClass =
  "flex min-h-[52px] items-center justify-between border-b border-[#1c1e22] px-1 text-[17px] font-semibold text-text hover:text-white sm:inline-flex sm:min-h-11 sm:border-0 sm:px-0 sm:text-base sm:underline sm:decoration-[#4a4f57] sm:underline-offset-[6px]";

export function Hero({
  profile,
  t,
}: {
  profile: Profile;
  t: Messages["hero"];
}) {
  const { hero } = profile;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex flex-col overflow-hidden sm:min-h-[calc(100svh-96px)]"
    >
      <HeroFallback
        layers={hero.graphLayers}
        className="pointer-events-none absolute left-1/2 top-[68%] hidden w-[min(68vw,520px)] -translate-x-1/2 -translate-y-1/2 opacity-50 sm:block min-[900px]:left-[71%] min-[900px]:top-1/2 min-[900px]:w-[min(52vw,86vh)] min-[900px]:opacity-100"
      />

      <div className="relative flex flex-1 items-center px-4 pb-10 pt-2 sm:px-[clamp(16px,5vw,72px)] sm:pb-[150px] sm:pt-6">
        <div className="flex w-full max-w-[640px] flex-col gap-[22px] sm:gap-7">
          <p className="inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-[rgba(7,8,10,0.7)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-text-2 sm:px-3.5 sm:text-xs">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            {profile.availability}
          </p>

          <h1
            id="hero-title"
            className="text-[50px] font-extrabold leading-[0.94] tracking-[-0.035em] sm:text-h1"
          >
            <TitleLine text={hero.titleLine1} color="text-chaos" />
            <br />
            <TitleLine text={hero.titleLine2} color="text-accent" />
          </h1>

          <p className="max-w-[560px] text-[17px] leading-[1.55] text-text-2 sm:text-[clamp(17px,1.4vw,20px)]">
            {hero.subtitle}
          </p>

          {/* Below 640 px the scene lives in its own strip (RF-1.5). */}
          <div className="-mx-4 flex flex-col gap-2.5 sm:hidden">
            <div className="flex h-[300px] items-center justify-center border-y border-[#15171b]">
              <HeroFallback layers={hero.graphLayers} className="w-[88%]" />
            </div>
            <p className="px-4 font-mono text-[11px] leading-[1.7] tracking-[0.04em] text-text-muted">
              <span className="sr-only">{t.graphLabel}: </span>
              {hero.graphLayers.map((layer) => layer.label).join(" → ")}
            </p>
          </div>

          <AgentBox t={t} />

          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-1">
            <a href="#casos" className={ctaClass}>
              {t.ctaCases}
              <span aria-hidden="true" className="sm:hidden">
                →
              </span>
            </a>
            <a href="#contacto" className={ctaClass}>
              {t.ctaContact}
              <span aria-hidden="true" className="sm:hidden">
                →
              </span>
            </a>
            <p className="pt-3 font-mono text-xs leading-[1.7] tracking-[0.04em] text-text-muted sm:pt-0">
              {hero.stackLine.join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
