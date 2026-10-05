"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  PROGRESS_STEPS,
  type AgentUIMessage,
  type ProgressStep,
  type TraceData,
} from "@/lib/ai/agent";
import type { AgentMode } from "@/lib/ai/mode";
import type { Locale } from "@/lib/content/load";
import type { Messages } from "@/lib/messages";
import { AgentMessage } from "./AgentMessage";
import { MatchReport } from "./MatchReport";
import { Sources } from "./Sources";
import { TracePanel } from "./TracePanel";

export type ConversationHandle = { send(text: string): void };

type T = Messages["agent"];

/** Maps HTTP errors from /api/agent to the friendly messages of §9 and §14. */
function errorMessage(error: Error, t: T): { text: string; contact: boolean } {
  const status = (error as { statusCode?: number }).statusCode;
  let body: { error?: string; retryAfter?: number } = {};
  try {
    body = JSON.parse((error as { responseBody?: string }).responseBody ?? "{}");
  } catch {
    // Not JSON: fall through to the generic message.
  }
  if (status === 429) {
    const minutes = Math.max(1, Math.ceil((body.retryAfter ?? 60) / 60));
    return { text: t.errors.rateLimited.replace("{minutes}", String(minutes)), contact: false };
  }
  if (body.error === "budget") return { text: t.errors.budget, contact: true };
  if (body.error === "too_long") return { text: t.errors.tooLong, contact: false };
  if (body.error === "too_many_turns") return { text: t.errors.tooManyTurns, contact: true };
  return { text: t.errors.unavailable, contact: true };
}

function ProgressList({ current, t }: { current: ProgressStep | null; t: T }) {
  const index = current ? PROGRESS_STEPS.indexOf(current) : 0;
  return (
    <ol role="status" aria-label={t.thinking} className="flex flex-col gap-2 font-mono text-[13px]">
      {PROGRESS_STEPS.map((step, i) => (
        <li
          key={step}
          data-progress={i < index ? "done" : i === index ? "active" : "waiting"}
          className={`flex gap-2.5 ${
            i < index ? "text-accent" : i === index ? "text-text" : "text-text-faint"
          }`}
        >
          <span aria-hidden="true">{i < index ? "●" : i === index ? "◐" : "○"}</span>
          <span>{t.progress[step]}</span>
        </li>
      ))}
    </ol>
  );
}

function AssistantMessage({ message, t }: { message: AgentUIMessage; t: T }) {
  const trace = message.parts.find((part) => part.type === "data-trace")?.data as
    | TraceData
    | undefined;
  const sources = trace?.retrieved ?? [];
  // The booking link is shown as a button: drop any line that repeats it.
  const bookingUrl = message.parts
    .map((part) =>
      part.type === "tool-offerCall" && part.state === "output-available"
        ? (part.output as { url?: string }).url
        : undefined,
    )
    .find(Boolean);
  const withoutBookingUrl = (text: string) =>
    bookingUrl
      ? text
          .split("\n")
          .filter((line) => !line.includes(bookingUrl.replace(/^https?:\/\//, "")))
          .join("\n")
      : text;
  // The report and the prose stream in parallel: the report always goes first.
  const report = message.parts.find((part) => part.type === "data-report")?.data;

  return (
    <div className="flex flex-col gap-3">
      {report && <MatchReport report={report} sources={sources} t={t.report} />}
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return withoutBookingUrl(part.text).trim() ? (
              <AgentMessage key={i} text={withoutBookingUrl(part.text)} sources={sources} />
            ) : null;
          default:
            if (part.type === "tool-getCase" && part.state === "output-available") {
              const output = part.output as { title?: string; kicker?: string };
              return output.title ? (
                <a
                  key={i}
                  href="#casos"
                  className="flex flex-col gap-0.5 rounded-control border border-border px-3 py-2.5 text-sm hover:border-accent"
                >
                  <span className="font-semibold text-text">{output.title}</span>
                  <span className="text-text-3">{output.kicker}</span>
                  <span className="font-mono text-[11px] text-accent">{t.caseCard} →</span>
                </a>
              ) : null;
            }
            if (part.type === "tool-offerCall" && part.state === "output-available") {
              const output = part.output as { available?: boolean; url?: string };
              return output.available && output.url ? (
                <a
                  key={i}
                  href={output.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-center self-start rounded-control bg-accent px-4 text-sm font-bold text-bg"
                >
                  {t.bookCall} ↗
                </a>
              ) : null;
            }
            if (part.type === "tool-createLead" && part.state === "output-available") {
              const output = part.output as { created?: boolean };
              return output.created ? (
                <p key={i} className="text-sm text-accent">
                  {t.leadCreated}
                </p>
              ) : null;
            }
            return null;
        }
      })}
      {trace && <Sources sources={sources} label={t.sources} />}
      {trace && <TracePanel trace={trace} t={t.trace} />}
    </div>
  );
}

export default function AgentConversation({
  firstMessage,
  onBusy,
  locale,
  t,
  ref,
}: {
  firstMessage: string;
  onBusy: (busy: boolean) => void;
  locale: Locale;
  t: T;
  ref: Ref<ConversationHandle>;
}) {
  // The mode found on the first message is sent back on every turn (§2).
  const [mode, setMode] = useState<AgentMode | undefined>(undefined);
  const [progress, setProgress] = useState<ProgressStep | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AgentUIMessage>({ api: "/api/agent", body: { locale } }),
    [locale],
  );

  const { messages, sendMessage, status, error } = useChat<AgentUIMessage>({
    transport,
    onData: (part) => {
      if (part.type === "data-progress") setProgress(part.data.step);
      if (part.type === "data-trace") setMode(part.data.mode);
    },
  });

  const busy = status === "submitted" || status === "streaming";
  useEffect(() => onBusy(busy), [busy, onBusy]);

  const sentFirst = useRef(false);
  useEffect(() => {
    if (sentFirst.current) return;
    sentFirst.current = true;
    void sendMessage({ text: firstMessage });
  }, [firstMessage, sendMessage]);

  useImperativeHandle(
    ref,
    () => ({
      send(text: string) {
        setProgress(null);
        void sendMessage({ text }, { body: { mode } });
      },
    }),
    [sendMessage, mode],
  );

  const last = messages.at(-1);
  const waiting =
    busy &&
    (last?.role === "user" ||
      !last?.parts.some((part) => part.type === "text" && part.text.trim()));
  const failure = error ? errorMessage(error, t) : null;

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4" aria-busy={busy}>
      {messages.map((message) =>
        message.role === "user" ? (
          <p key={message.id} className="line-clamp-3 text-sm text-text-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em]">{t.you}: </span>
            {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
          </p>
        ) : (
          <AssistantMessage key={message.id} message={message} t={t} />
        ),
      )}
      {waiting && <ProgressList current={progress} t={t} />}
      <p aria-live="polite" className="sr-only">
        {status === "ready" && messages.length > 1 ? t.answerReady : ""}
      </p>
      {failure && (
        <p role="alert" className="text-sm text-warn">
          {failure.text}{" "}
          {failure.contact && (
            <a href="#contacto" className="underline underline-offset-2">
              {t.contactLink}
            </a>
          )}
        </p>
      )}
    </div>
  );
}
