"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  CONTACT_LIMITS,
  contactKinds,
  contactSchema,
  type ContactKind,
} from "@/lib/contact/schema";
import type { Messages } from "@/lib/messages";

type Field = "name" | "email" | "company" | "message";
const FIELD_ORDER: Field[] = ["name", "email", "company", "message"];

const input =
  "h-12 rounded-control border border-border-strong bg-bg px-3.5 text-base text-text placeholder:text-text-faint aria-[invalid=true]:border-warn";
const label = "text-sm text-text-2";

// Validation only: submission to /api/contact and the live pipeline arrive in
// tasks 3.2 and 3.4.
export function ContactForm({ t }: { t: Messages["contact"] }) {
  const [kind, setKind] = useState<ContactKind>("vacante");
  const [error, setError] = useState<{ field: Field; text: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const schema = contactSchema(t.errors);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = schema.safeParse({
      kind,
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      message: data.get("message"),
    });

    if (result.success) {
      setError(null);
      return;
    }

    const issue = FIELD_ORDER.map((field) =>
      result.error.issues.find((item) => item.path[0] === field),
    ).find(Boolean);
    if (!issue) return;

    const field = issue.path[0] as Field;
    setError({ field, text: issue.message });
    form.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  };

  const invalid = (field: Field) => error?.field === field || undefined;
  const describedBy = (field: Field) =>
    error?.field === field ? "contact-error" : undefined;

  return (
    <form
      ref={form}
      noValidate
      onSubmit={onSubmit}
      aria-label={t.title}
      className="flex min-w-0 flex-col gap-4 rounded-[18px] border border-border bg-surface px-4 py-[18px] sm:flex-[1_1_440px] sm:gap-[18px] sm:rounded-[20px] sm:p-[clamp(20px,2.6vw,32px)]"
    >
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 font-mono text-xs uppercase tracking-[0.08em] text-text-3">
          {t.kindLabel}
        </legend>
        <div
          className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2"
        >
          {contactKinds.map((option) => {
            const active = option === kind;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setKind(option)}
                className={`min-h-11 rounded-control border px-1.5 text-sm font-semibold sm:flex-[1_1_120px] sm:px-3.5 sm:text-[15px] ${
                  active
                    ? "border-accent bg-white/[0.04] text-accent"
                    : "border-border-strong bg-transparent text-text"
                }`}
              >
                {t.kinds[option]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-3.5">
        <p className="flex flex-col gap-1.5 sm:flex-[1_1_200px]">
          <label htmlFor="contact-name" className={label}>
            {t.name}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={CONTACT_LIMITS.name}
            placeholder={t.namePlaceholder}
            aria-invalid={invalid("name")}
            aria-describedby={describedBy("name")}
            className={input}
          />
        </p>
        <p className="flex flex-col gap-1.5 sm:flex-[1_1_200px]">
          <label htmlFor="contact-email" className={label}>
            {t.email}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={CONTACT_LIMITS.email}
            placeholder={t.emailPlaceholder}
            aria-invalid={invalid("email")}
            aria-describedby={describedBy("email")}
            className={input}
          />
        </p>
      </div>

      <p className="flex flex-col gap-1.5">
        <label htmlFor="contact-company" className={label}>
          {t.company} <span className="text-text-faint">{t.optional}</span>
        </label>
        <input
          id="contact-company"
          name="company"
          type="text"
          autoComplete="organization"
          maxLength={CONTACT_LIMITS.company}
          placeholder={t.companyPlaceholder}
          aria-invalid={invalid("company")}
          aria-describedby={describedBy("company")}
          className={input}
        />
      </p>

      <p className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className={label}>
          {t.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          maxLength={CONTACT_LIMITS.message}
          placeholder={t.messagePlaceholder}
          aria-invalid={invalid("message")}
          aria-describedby={describedBy("message")}
          className={`${input} h-auto min-h-[120px] resize-y py-3 leading-[1.5]`}
        />
      </p>

      {error && (
        <p id="contact-error" role="alert" className="text-[15px] text-warn">
          {error.text}
        </p>
      )}

      <button
        type="submit"
        className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-accent text-[17px] font-bold text-bg"
      >
        {t.send}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
