import { ContentText } from "@/components/ui/ContentText";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
          <SectionHeader
            id="contacto-title"
            title={t.title}
            intro={t.intro}
            aside={
              <a
                href="#contenido"
                className="hidden min-h-10 shrink-0 items-center whitespace-nowrap text-sm font-medium text-text-2 hover:text-white min-[900px]:inline-flex"
              >
                {backToTop}
              </a>
            }
          />
        }
        channels={
          <div className="flex flex-col gap-2.5">
            <Channels profile={profile} t={t} opensInNewTab={opensInNewTab} />
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] leading-[1.5] text-text-muted">
              <li>
                <ContentText value={profile.location} />
              </li>
              <li>{workModes}</li>
              <li>
                <ContentText value={profile.responseTime} />
              </li>
            </ul>
          </div>
        }
      />
    </section>
  );
}
