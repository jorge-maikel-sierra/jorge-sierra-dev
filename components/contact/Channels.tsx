import { PendingText } from "@/components/ui/Placeholder";
import { isPlaceholder, type Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";

const card =
  "flex min-w-0 flex-col gap-1.5 rounded-card border px-5 py-[18px] text-text hover:text-white";
const cardLabel =
  "font-mono text-[11px] uppercase tracking-[0.08em] text-text-3";

const lastSegment = (url: string) => new URL(url).pathname.split("/").filter(Boolean).pop() ?? url;

export function Channels({
  profile,
  t,
  opensInNewTab,
}: {
  profile: Profile;
  t: Messages["contact"];
  opensInNewTab: string;
}) {
  const { whatsapp, email, linkedin, github } = profile.links;
  const pendingWhatsapp = isPlaceholder(whatsapp);

  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
      <li className="flex">
        {pendingWhatsapp ? (
          <span className={`${card} w-full border-dashed border-border-strong`}>
            <span className={cardLabel}>{t.channels.whatsapp}</span>
            <span className="text-[17px] font-semibold text-text-muted">
              <PendingText value={whatsapp} />
            </span>
          </span>
        ) : (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener"
            className={`${card} w-full border-border`}
          >
            <span className={cardLabel}>{t.channels.whatsapp}</span>
            <span className="text-[17px] font-semibold">
              +{whatsapp.slice(0, 2)} {whatsapp.slice(2, 5)} {whatsapp.slice(5, 8)}{" "}
              {whatsapp.slice(8)} <span aria-hidden="true">↗</span>
              <span className="sr-only">{opensInNewTab}</span>
            </span>
          </a>
        )}
      </li>
      <li className="flex">
        <a href={`mailto:${email}`} className={`${card} w-full border-border`}>
          <span className={cardLabel}>{t.channels.email}</span>
          <span className="text-base font-semibold [overflow-wrap:anywhere]">
            {email}
          </span>
        </a>
      </li>
      <li className="flex">
        <a
          href={linkedin}
          target="_blank"
          rel="noopener"
          className={`${card} w-full border-border`}
        >
          <span className={cardLabel}>{t.channels.linkedin}</span>
          <span className="text-[17px] font-semibold">
            in/{lastSegment(linkedin)} <span aria-hidden="true">↗</span>
            <span className="sr-only">{opensInNewTab}</span>
          </span>
        </a>
      </li>
      <li className="flex">
        <a
          href={github}
          target="_blank"
          rel="noopener"
          className={`${card} w-full border-border`}
        >
          <span className={cardLabel}>{t.channels.github}</span>
          <span className="text-[17px] font-semibold">
            {lastSegment(github)} <span aria-hidden="true">↗</span>
            <span className="sr-only">{opensInNewTab}</span>
          </span>
        </a>
      </li>
    </ul>
  );
}
