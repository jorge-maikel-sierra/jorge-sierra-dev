import { loadProfile, type Locale } from "@/lib/content/load";
import { getMessages } from "@/lib/messages";
import { MobileMenu, type NavItem } from "./MobileMenu";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function Header({ locale }: { locale: Locale }) {
  const { name } = loadProfile(locale);
  const { nav } = getMessages(locale);

  const items: NavItem[] = [
    { href: "#casos", label: nav.cases },
    { href: "#agente", label: nav.agent },
    { href: "#trayectoria", label: nav.experience },
    { href: "#contacto", label: nav.contact },
  ];

  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-[clamp(16px,5vw,72px)] sm:py-6">
        <a
          href={`/${locale}`}
          className="flex min-h-11 items-center gap-2.5 text-text hover:text-white sm:gap-3"
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-control border border-border-strong font-mono text-[13px] font-medium sm:size-10 sm:text-sm"
          >
            {initials(name)}
          </span>
          <span className="text-base font-bold sm:text-[17px] sm:tracking-[-0.01em]">
            {name}
          </span>
        </a>

        <nav
          aria-label={nav.label}
          className="hidden flex-wrap items-center gap-x-7 gap-y-1 font-mono text-[13px] tracking-[0.04em] sm:flex"
        >
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-0.5 py-3.5 text-text-2 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <span
            aria-disabled="true"
            title={nav.languageSoon}
            className="rounded-full border border-border-strong px-3.5 py-3 text-text"
          >
            {nav.language}
          </span>
        </nav>

        <MobileMenu
          items={items}
          label={nav.label}
          menuLabel={nav.menu}
          language={nav.language}
          languageSoon={nav.languageSoon}
        />
      </div>
    </header>
  );
}
