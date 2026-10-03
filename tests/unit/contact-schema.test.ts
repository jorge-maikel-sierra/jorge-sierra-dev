import { describe, expect, it } from "vitest";
import { CONTACT_LIMITS, contactSchema } from "@/lib/contact/schema";

const errors = {
  name: "NAME",
  email: "EMAIL",
  message: "MESSAGE",
  tooLong: "TOO_LONG",
};
const schema = contactSchema(errors);
const valid = {
  kind: "vacante",
  name: "  Ana  ",
  email: " ana@empresa.com ",
  company: "",
  message: " Un proceso manual ",
};

const firstError = (input: Record<string, unknown>) => {
  const result = schema.safeParse(input);
  return result.success ? null : result.error.issues[0];
};

describe("contactSchema", () => {
  it("accepts a valid message, trims fields and drops an empty company", () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      kind: "vacante",
      name: "Ana",
      email: "ana@empresa.com",
      company: undefined,
      message: "Un proceso manual",
    });
  });

  it("keeps a company when present", () => {
    const result = schema.safeParse({ ...valid, company: " Acme " });
    expect(result.success && result.data.company).toBe("Acme");
  });

  it("reports each field with its own message", () => {
    expect(firstError({ ...valid, name: "   " })).toMatchObject({
      path: ["name"],
      message: "NAME",
    });
    expect(firstError({ ...valid, email: "ana@" })).toMatchObject({
      path: ["email"],
      message: "EMAIL",
    });
    expect(firstError({ ...valid, email: "" })).toMatchObject({
      path: ["email"],
      message: "EMAIL",
    });
    expect(firstError({ ...valid, message: "" })).toMatchObject({
      path: ["message"],
      message: "MESSAGE",
    });
  });

  it("rejects values over the limits", () => {
    expect(
      firstError({ ...valid, message: "x".repeat(CONTACT_LIMITS.message + 1) }),
    ).toMatchObject({ path: ["message"], message: "TOO_LONG" });
    expect(
      firstError({ ...valid, name: "x".repeat(CONTACT_LIMITS.name + 1) }),
    ).toMatchObject({ path: ["name"], message: "TOO_LONG" });
  });

  it("rejects an unknown kind", () => {
    expect(firstError({ ...valid, kind: "spam" })?.path).toEqual(["kind"]);
  });
});
