import { z } from "zod";

// Shared by ContactForm (client) and POST /api/contact (task 3.2).
export const contactKinds = ["vacante", "proyecto", "otro"] as const;
export type ContactKind = (typeof contactKinds)[number];

export const CONTACT_LIMITS = { name: 120, email: 254, company: 120, message: 4000 };

export type ContactErrors = {
  name: string;
  email: string;
  message: string;
  tooLong: string;
};

export function contactSchema(errors: ContactErrors) {
  return z.object({
    kind: z.enum(contactKinds),
    name: z
      .string()
      .trim()
      .min(1, errors.name)
      .max(CONTACT_LIMITS.name, errors.tooLong),
    email: z
      .string()
      .trim()
      .max(CONTACT_LIMITS.email, errors.tooLong)
      .pipe(z.email(errors.email)),
    company: z
      .string()
      .trim()
      .max(CONTACT_LIMITS.company, errors.tooLong)
      .optional()
      .transform((value) => value || undefined),
    message: z
      .string()
      .trim()
      .min(1, errors.message)
      .max(CONTACT_LIMITS.message, errors.tooLong),
  });
}

export type ContactInput = z.infer<ReturnType<typeof contactSchema>>;
