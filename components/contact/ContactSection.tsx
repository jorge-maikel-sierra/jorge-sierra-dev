import { ContentText } from "@/components/ui/ContentText";
import type { Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";
import { Channels } from "./Channels";
import { ContactWorkspace } from "./ContactWorkspace";

export function ContactSection({
  profile,
  t,
  opensInNewTab,
  backToTop,
}: {
  profile: Profile;
  t: Messages["contact"];
  opensInNewTab: string;
  backToTop: string;
}) {
  const [firstMode, ...otherModes] = profile.workModes;
  const workModes = [firstMode, ...otherModes.map((mode) => mode.toLowerCase())].join(
    ` ${t.or} `,
  );

  return (
    <section id="contacto" aria-labelledby="contacto-title">
      <ContactWorkspace
        t={t}
        heading={
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-3">{t.eyebrow}</p>
              <h2
                id="contacto-title"
                className="text-[24px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[clamp(26px,3vw,38px)]"
              >
                {t.title.slice(0, t.title.lastIndexOf(" ") + 1)}
                <span className="text-accent">{t.title.slice(t.title.lastIndexOf(" ") + 1)}</span>
              </h2>
              <p className="tall-only max-w-[640px] text-sm leading-[1.45] text-text-2">{t.intro}</p>
            </div>
            <a
              href="#contenido"
              className="hidden min-h-10 shrink-0 items-center whitespace-nowrap font-mono text-[13px] tracking-[0.04em] text-text-2 hover:text-white min-[900px]:inline-flex"
            >
              {backToTop}
            </a>
          </div>
        }
        channels={
          <div className="flex flex-col gap-2.5">
            <Channels profile={profile} t={t} opensInNewTab={opensInNewTab} />
            <p className="font-mono text-[10px] uppercase leading-[1.6] tracking-[0.06em] text-text-muted sm:text-xs">
              <ContentText value={profile.location} /> · {workModes} ·{" "}
              <ContentText value={profile.responseTime} />
            </p>
          </div>
        }
      />
    </section>
  );
}
