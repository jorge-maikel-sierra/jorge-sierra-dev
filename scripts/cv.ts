import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { loadCases, loadExperience, loadProfile, locales, type Locale } from "@/lib/content/load";
import { stripPlaceholders } from "@/lib/kb/text";
import { getMessages } from "@/lib/messages";
import { SITE_URL } from "@/lib/seo/site";

// `pnpm cv`: the downloadable CV is generated from content/, so it can never
// contradict the site (task 6.3). Bracketed placeholders are left out.
// Regenerate after editing content/.

const OUT = path.join(process.cwd(), "public", "cv");

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!);
const real = (text: string) => escape(stripPlaceholders(text));
const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function render(locale: Locale) {
  const profile = loadProfile(locale);
  const experience = loadExperience(locale);
  const cases = loadCases(locale).filter((item) => item.status !== "soon");
  const t = getMessages(locale).cv;
  const areaLabel = new Map<string, string>(experience.areas.map((area) => [area.id, area.label]));
  const site = `${host(SITE_URL)}/${locale}`;

  const contact = [
    escape(profile.location),
    escape(profile.links.email),
    escape(host(profile.links.linkedin)),
    escape(host(profile.links.github)),
    `<a href="${SITE_URL}/${locale}">${escape(site)}</a> · ${escape(t.site)}`,
  ].join(" · ");

  const roles = experience.roles
    .map((role) => {
      const bullets = role.bullets.map(real).filter(Boolean);
      return `<article>
  <header><h3>${real(role.role)} · ${real(role.org)}</h3><span>${real(role.years)}${role.current ? ` · ${escape(t.current)}` : ""}</span></header>
  <ul>${bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
  <p class="stack"><b>${escape(t.stack)}:</b> ${role.stack.map((item) => escape(item.label)).join(" · ")}</p>
</article>`;
    })
    .join("");

  const projects = cases
    .map(
      (item) => `<article>
  <header><h3>${escape(item.title)}</h3><span>${escape(item.statusLabel)}</span></header>
  <p>${real(item.kicker)}.</p>
  <p class="stack"><b>${escape(t.stack)}:</b> ${item.stack.map(escape).join(" · ")}</p>
</article>`,
    )
    .join("");

  const skills = Object.entries(profile.skills)
    .map(([area, list]) => `<li><b>${escape(areaLabel.get(area) ?? area)}:</b> ${list.map(escape).join(" · ")}</li>`)
    .join("");

  const education = profile.education
    .map((item) => `<li>${real(item.title)} — ${real(item.org)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>${escape(profile.fullName)} — CV</title>
<style>
  @page { size: A4; margin: 11mm 13mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 9.2pt/1.36 "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1d2329; }
  h1 { margin: 0; font-size: 21pt; letter-spacing: -0.01em; }
  .headline { margin: 2px 0 6px; color: #0b6b4d; font-size: 11pt; font-weight: 600; }
  .contact { margin: 0 0 10px; color: #4a535c; font-size: 8.6pt; }
  a { color: inherit; text-decoration: none; }
  h2 { margin: 9px 0 4px; padding-bottom: 2px; border-bottom: 1px solid #cfd5da; font-size: 9pt; letter-spacing: 0.08em; text-transform: uppercase; color: #0b6b4d; }
  article { margin-bottom: 5px; break-inside: avoid; }
  article header { display: flex; justify-content: space-between; gap: 12px; }
  h3 { margin: 0; font-size: 10pt; }
  article header span { color: #4a535c; white-space: nowrap; font-size: 8.8pt; }
  ul { margin: 2px 0; padding-left: 15px; }
  li { margin: 1px 0; }
  p { margin: 2px 0; }
  .stack { color: #4a535c; font-size: 8.6pt; }
</style>
</head>
<body>
  <h1>${escape(profile.fullName)}</h1>
  <p class="headline">${escape(profile.headline)}</p>
  <p class="contact">${contact}</p>
  <h2>${escape(t.summary)}</h2>
  <p>${real(profile.summary)}</p>
  <h2>${escape(t.experience)}</h2>
  ${roles}
  <h2>${escape(t.projects)}</h2>
  ${projects}
  <h2>${escape(t.skills)}</h2>
  <ul>${skills}</ul>
  <h2>${escape(t.education)}</h2>
  <ul>${education}</ul>
</body>
</html>`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const locale of locales) {
      const page = await browser.newPage();
      await page.setContent(render(locale), { waitUntil: "load" });
      const file = path.join(OUT, `jorge-sierra-cv-${locale}.pdf`);
      await page.pdf({ path: file, format: "A4", printBackground: true, preferCSSPageSize: true });
      await page.close();
      console.log(`CV (${locale}): public/cv/jorge-sierra-cv-${locale}.pdf`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
