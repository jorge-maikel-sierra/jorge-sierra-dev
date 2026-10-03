"use client";

import { useEffect, useId, useRef, useState } from "react";

export type NavItem = { href: string; label: string };
export type LanguageLink = { href: string; hrefLang: string; label: string; title: string };

type Props = {
  items: NavItem[];
  label: string;
  menuLabel: string;
  language: LanguageLink;
};

// Dropdown navigation below 640 px (design-reference/Mobile-Hero.dc.html).
export function MobileMenu({
  items,
  label,
  menuLabel,
  language,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={menuLabel}
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded-xl border border-border-strong text-text sm:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h10" />
            </>
          )}
        </svg>
      </button>

      <nav
        id={panelId}
        aria-label={label}
        hidden={!open}
        className="flex w-full flex-col rounded-2xl border border-border bg-surface p-1.5 font-mono text-sm tracking-[0.04em] sm:hidden"
      >
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center justify-between px-3 text-text hover:text-white"
          >
            {item.label}
            <span aria-hidden="true">→</span>
          </a>
        ))}
        <a
          href={language.href}
          hrefLang={language.hrefLang}
          lang={language.hrefLang}
          aria-label={language.title}
          className="flex min-h-12 items-center px-3 text-text-2 hover:text-white"
        >
          {language.label}
        </a>
      </nav>
    </>
  );
}
