import { Placeholder } from "./Placeholder";

const BRACKETED = /(\[[^\]]+\])/;

// Every content string goes through here. Bracketed segments are pending data
// and render as <Placeholder>, whether they fill the whole value ("[AÑO]") or
// sit inside a sentence ("… mapa interactivo. [Añade: …]"). docs/design.md §6.
export function ContentText({ value }: { value: string }) {
  const parts = value.split(BRACKETED).filter(Boolean);
  if (parts.length === 1 && !BRACKETED.test(value)) return value;

  return parts.map((part, i) =>
    BRACKETED.test(part) ? (
      <Placeholder key={i}>{part}</Placeholder>
    ) : (
      part
    ),
  );
}
