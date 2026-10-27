import { AgentBox } from "@/components/agent/AgentBox";
import { ContentText } from "@/components/ui/ContentText";
import { StageNode } from "@/components/ui/StageNode";
import type { Locale } from "@/lib/content/load";
import type { Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { HeroFallback } from "./HeroFallback";
import { HeroVisual } from "./HeroVisual";

// Colors the last word of each title line: "caos" in chaos, "arquitectura." in
// accent. The only accented words on the page: they are the site's two colors.
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
  "inline-flex min-h-11 items-center self-start text-base font-semibold text-text underline decoration-underline underline-offset-[6px] hover:text-white hover:decoration-accent";

export function Hero({
  profile,
  t,
  agent,
  locale,
}: {
  profile: Profile;
  t: Messages["hero"];
  agent: Messages["agent"];
  locale: Locale;
}) {
  const { hero } = profile;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex flex-col overflow-hidden sm:min-h-[calc(100svh-96px)]"
    >
      <HeroVisual
        variant="desktop"
        layers={hero.graphLayers}
        tokens={hero.chaosTokens}
        labels={t}
        fallback={
          <HeroFallback
            layers={hero.graphLayers}
            className="pointer-events-none absolute left-1/2 top-[68%] hidden w-[min(68vw,520px)] -translate-x-1/2 -translate-y-1/2 opacity-50 sm:block min-[900px]:left-[71%] min-[900px]:top-1/2 min-[900px]:w-[min(52vw,86vh)] min-[900px]:opacity-100"
          />
        }
      />

      <div className="relative flex flex-1 items-center px-4 pb-10 pt-2 sm:px-[clamp(16px,5vw,72px)] sm:pb-[150px] sm:pt-6">
        <div data-hero-content className="stage flex w-full max-w-[640px] flex-col gap-[22px] sm:gap-7">
          <p className="inline-flex items-center gap-2.5 self-start text-sm font-medium text-text-2 sm:text-[15px]">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            <ContentText value={profile.availability} />
          </p>

          <h1
            id="hero-title"
            className="relative text-[50px] font-extrabold leading-[0.94] tracking-[-0.035em] sm:text-h1"
          >
            <StageNode />
            <TitleLine text={hero.titleLine1} color="text-chaos" />
            <br />
            <TitleLine text={hero.titleLine2} color="text-accent" />
          </h1>

          <p className="max-w-[560px] text-[17px] leading-[1.55] text-text-2 sm:text-[clamp(17px,1.4vw,20px)]">
            <ContentText value={hero.subtitle} />
          </p>

          {/* Below 640 px the scene lives in its own strip (RF-1.5). */}
          <div className="-mx-4 flex flex-col gap-2.5 sm:hidden">
            <div className="relative h-[300px] border-y border-hairline">
              <HeroVisual
                variant="mobile"
                layers={hero.graphLayers}
                tokens={hero.chaosTokens}
                labels={t}
                fallback={<HeroFallback layers={hero.graphLayers} className="w-[88%]" />}
              />
            </div>
            {/* Two lines reserved: JetBrains Mono is not preloaded, and a different
                wrap on font swap would shift the agent box below (CLS, task 2.6). */}
            <p className="min-h-[3.4em] px-4 font-mono text-[11px] leading-[1.7] tracking-[0.04em] text-text-muted">
              <span className="sr-only">{t.graphLabel}: </span>
              <ContentText
                value={hero.graphLayers.map((layer) => layer.label).join(" → ")}
              />
            </p>
          </div>

          <AgentBox t={t} agent={agent} locale={locale} />

          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-1">
            <a href="#casos" className={ctaClass}>
              {t.ctaCases}
            </a>
            <a href="#contacto" className={ctaClass}>
              {t.ctaContact}
            </a>
            <p className="pt-3 font-mono text-xs leading-[1.7] tracking-[0.04em] text-text-muted sm:pt-0">
              <ContentText value={hero.stackLine.join(" · ")} />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
