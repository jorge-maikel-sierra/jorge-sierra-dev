import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContentText } from "@/components/ui/ContentText";

const render = (value: string) =>
  renderToStaticMarkup(<ContentText value={value} />);

const markers = (html: string) =>
  html.match(/data-placeholder=""/g)?.length ?? 0;

describe("ContentText", () => {
  it("renders plain text untouched", () => {
    expect(render("Medellín, Colombia")).toBe("Medellín, Colombia");
  });

  it("renders a fully bracketed value as a placeholder", () => {
    const html = render("[Enlace al CV en PDF]");
    expect(markers(html)).toBe(1);
    expect(html).toContain("Dato pendiente:");
    expect(html).toContain("[Enlace al CV en PDF]");
  });

  it("marks only the bracketed part of a value that starts with brackets", () => {
    const html = render("[AÑO] — Hoy");
    expect(markers(html)).toBe(1);
    expect(html).toMatch(/\[AÑO\]<\/span> — Hoy$/);
  });

  it("marks brackets in the middle of a sentence", () => {
    const html = render(
      "Calcula la red. [Añade: para quién es] Y la exporta. [DEMO]",
    );
    expect(markers(html)).toBe(2);
    expect(html.startsWith("Calcula la red. ")).toBe(true);
  });

  it("escapes content as text", () => {
    expect(render("<b>no</b>")).toBe("&lt;b&gt;no&lt;/b&gt;");
  });
});
