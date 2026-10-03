import { describe, expect, it } from "vitest";
import cases from "@/content/es/cases.json";
import experience from "@/content/es/experience.json";
import profile from "@/content/es/profile.json";
import {
  loadCases,
  loadExperience,
  loadProfile,
  parseContent,
} from "@/lib/content/load";
import {
  casesSchema,
  experienceSchema,
  profileSchema,
} from "@/lib/content/schema";

const clone = <T>(value: T): T => structuredClone(value);

describe("content loading", () => {
  it("loads the three Spanish JSON files", () => {
    expect(loadProfile().name).toBe("Jorge Sierra");
    expect(loadExperience().roles.length).toBeGreaterThan(0);
    expect(loadCases()).toHaveLength(5);
  });

  it("keeps the case order from the file", () => {
    expect(loadCases().map((item) => item.num)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
  });

  it("accepts bracket placeholders where a URL is expected", () => {
    expect(loadProfile().links.calBooking.startsWith("[")).toBe(true);
  });

  it("the CV link is a file served by the site, and only a clean path is allowed", () => {
    expect(loadProfile("es").links.cv).toBe("/cv/jorge-sierra-cv-es.pdf");
    expect(loadProfile("en").links.cv).toBe("/cv/jorge-sierra-cv-en.pdf");
    const broken = clone(profile);
    broken.links.cv = "javascript:alert(1)";
    expect(() => parseContent(profileSchema, broken, "es/profile.json")).toThrow(/links\.cv/);
  });
});

describe("schema violations fail with the file and path", () => {
  it("rejects an unknown case status", () => {
    const broken = clone(cases);
    broken.cases[0].status = "finished";
    expect(() => parseContent(casesSchema, broken, "es/cases.json")).toThrow(
      /content\/es\/cases\.json[\s\S]*cases\.0\.status/,
    );
  });

  it("rejects a role tagged with an unknown area", () => {
    const broken = clone(experience);
    broken.roles[0].areas = ["marketing"];
    expect(() =>
      parseContent(experienceSchema, broken, "es/experience.json"),
    ).toThrow(/roles\.0\.areas/);
  });

  it("rejects a missing required field", () => {
    const broken: Record<string, unknown> = clone(profile);
    delete broken.headline;
    expect(() => parseContent(profileSchema, broken, "es/profile.json")).toThrow(
      /headline/,
    );
  });

  it("rejects unexpected keys so typos do not pass silently", () => {
    const broken = { ...clone(profile), headlnie: "typo" };
    expect(() => parseContent(profileSchema, broken, "es/profile.json")).toThrow(
      /headlnie/,
    );
  });

  it("rejects a malformed link that is not a placeholder", () => {
    const broken = clone(profile);
    broken.links.cv = "cv.pdf";
    expect(() => parseContent(profileSchema, broken, "es/profile.json")).toThrow(
      /links\.cv/,
    );
  });

  it("rejects more than one current role", () => {
    const broken = clone(experience);
    broken.roles[1].current = true;
    expect(() =>
      parseContent(experienceSchema, broken, "es/experience.json"),
    ).toThrow(/Solo puede haber un rol actual/);
  });
});
