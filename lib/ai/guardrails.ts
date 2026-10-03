import type { TextStreamPart, ToolSet } from "ai";

// docs/agent-spec.md §3 and §9.
export const MAX_MESSAGE_CHARS = 8000;
export const MAX_TURNS = 12;

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
// 7+ digits, optionally with +, spaces, dots, dashes or parentheses.
const PHONE = /\+?\d[\d\s().-]{5,}\d/g;
// Look like phones but are not: year ranges (2023 - 2025), ISO dates, decimals.
const NOT_PHONE = [/^\d{4}\s*[-–]\s*\d{4}$/, /^\d{4}-\d{2}-\d{2}$/, /^\d+\.\d+$/];

/** Masks e-mails and phone numbers before anything reaches the traces. */
export function redactPII(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, (match) =>
    match.replace(/\D/g, "").length >= 7 && !NOT_PHONE.some((pattern) => pattern.test(match))
      ? "[teléfono]"
      : match,
  );
}

export type ChatTurn = { role: "user" | "assistant"; text: string };

export function checkInput(turns: ChatTurn[]): "empty" | "too_long" | "too_many_turns" | null {
  const visitor = turns.filter((turn) => turn.role === "user");
  const last = visitor.at(-1);
  if (!last || !last.text.trim()) return "empty";
  if (last.text.length > MAX_MESSAGE_CHARS) return "too_long";
  if (visitor.length > MAX_TURNS) return "too_many_turns";
  return null;
}

// "[fuente:N]" is the format; the model sometimes writes a bare "[N]" (seen in
// the evals), which the UI cannot link. Both are read as citations.
const CITATION = /\[(?:fuente:)?(\d+)\]/g;

/**
 * Normalizes citations to "[fuente:N]" and removes the ones that point to a
 * source the model never received.
 */
export function filterCitations(text: string, valid: Set<number>, onInvalid?: (id: number) => void) {
  return text.replace(CITATION, (_match, id: string) => {
    if (valid.has(Number(id))) return `[fuente:${Number(id)}]`;
    onInvalid?.(Number(id));
    return "";
  });
}

/** True when `tail` could still grow into "[fuente:N]" or "[N]". */
const couldBeCitation = (tail: string) => /^\[(\d*|f(u(e(n(t(e(:\d*)?)?)?)?)?)?)$/.test(tail);

/**
 * Stream transform for streamText: normalizes and checks citations while the text is
 * still streaming. A citation may be split across deltas, so a possible
 * prefix at the end of a delta waits for the next one.
 */
export function citationTransform<TOOLS extends ToolSet>(
  validIds: () => Set<number>,
  onInvalid?: (id: number) => void,
) {
  return () => {
    const pending = new Map<string, string>();
    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(part, controller) {
        if (part.type === "text-delta") {
          const text = (pending.get(part.id) ?? "") + part.text;
          const open = text.lastIndexOf("[");
          const hold = open !== -1 && couldBeCitation(text.slice(open)) ? text.slice(open) : "";
          pending.set(part.id, hold);
          const ready = filterCitations(text.slice(0, text.length - hold.length), validIds(), onInvalid);
          if (ready) controller.enqueue({ ...part, text: ready });
          return;
        }
        if (part.type === "text-end") {
          const rest = pending.get(part.id);
          if (rest) {
            controller.enqueue({
              type: "text-delta",
              id: part.id,
              text: filterCitations(rest, validIds(), onInvalid),
            } as TextStreamPart<TOOLS>);
          }
          pending.delete(part.id);
        }
        controller.enqueue(part);
      },
    });
  };
}
