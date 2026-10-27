import { PendingText } from "@/components/ui/Placeholder";
import { isPlaceholder, type Profile } from "@/lib/content/schema";
import type { Messages } from "@/lib/messages";

// Direct channels as one row split by hairlines, not four identical cards.
const item =
  "flex min-w-0 flex-col gap-0.5 py-2 min-[900px]:border-l min-[900px]:border-border min-[900px]:px-5 min-[900px]:first:border-l-0 min-[900px]:first:pl-0";
const link = "text-text underline decoration-underline underline-offset-4 hover:text-white hover:decoration-accent";
const cardLabel = "text-[13px] text-text-3";
const value = "text-[15px] font-semibold min-[900px]:text-[17px]";

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
    <ul className="grid grid-cols-2 gap-x-4 border-t border-border pt-2 min-[900px]:grid-cols-[1fr_1.5fr_1fr_1fr] min-[900px]:gap-x-0">
      <li className={item}>
        <span className={cardLabel}>{t.channels.whatsapp}</span>
        {pendingWhatsapp ? (
          <span className={`${value} text-text-muted`}>
            <PendingText value={whatsapp} />
          </span>
        ) : (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className={`${value} ${link}`}>
            +{whatsapp.slice(0, 2)} {whatsapp.slice(2, 5)} {whatsapp.slice(5, 8)} {whatsapp.slice(8)}{" "}
            <span aria-hidden="true">↗</span>
            <span className="sr-only">{opensInNewTab}</span>
          </a>
        )}
      </li>
      <li className={item}>
        <span className={cardLabel}>{t.channels.email}</span>
        <a
          href={`mailto:${email}`}
          className={`text-sm font-semibold [overflow-wrap:anywhere] min-[900px]:text-base ${link}`}
        >
          {email}
        </a>
      </li>
      <li className={item}>
        <span className={cardLabel}>{t.channels.linkedin}</span>
        <a href={linkedin} target="_blank" rel="noopener" className={`${value} ${link}`}>
          in/{lastSegment(linkedin)} <span aria-hidden="true">↗</span>
          <span className="sr-only">{opensInNewTab}</span>
        </a>
      </li>
      <li className={item}>
        <span className={cardLabel}>{t.channels.github}</span>
        <a href={github} target="_blank" rel="noopener" className={`${value} ${link}`}>
          {lastSegment(github)} <span aria-hidden="true">↗</span>
          <span className="sr-only">{opensInNewTab}</span>
        </a>
      </li>
    </ul>
  );
}
