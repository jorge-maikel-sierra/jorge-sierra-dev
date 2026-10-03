// zod/mini: this schema ships to the browser with ContactForm, and the
// tree-shakable API keeps it out of the initial JS budget (RNF-2, task 2.6).
import * as z from "zod/mini";

// Shared by ContactForm (client) and POST /api/contact (task 3.2).
export const contactKinds = ["vacante", "proyecto", "otro"] as const;
export type ContactKind = (typeof contactKinds)[number];

/** Hidden field only bots fill in (RF-5.3). */
export const HONEYPOT_FIELD = "website";

export const CONTACT_LIMITS = { name: 120, email: 254, company: 120, message: 4000 };

export type ContactErrors = {
  name: string;
  email: string;
  message: string;
  tooLong: string;
};

export function contactSchema(errors: ContactErrors) {
  const text = (max: number, required?: string) =>
    z
      .string()
      .check(
        z.trim(),
        ...(required ? [z.minLength(1, required)] : []),
        z.maxLength(max, errors.tooLong),
      );

  return z.object({
    kind: z.enum(contactKinds),
    name: text(CONTACT_LIMITS.name, errors.name),
    email: z.pipe(text(CONTACT_LIMITS.email), z.email(errors.email)),
    company: z.pipe(
      z.optional(text(CONTACT_LIMITS.company)),
      z.transform((value) => value || undefined),
    ),
    message: text(CONTACT_LIMITS.message, errors.message),
  });
}

export type ContactInput = z.infer<ReturnType<typeof contactSchema>>;
