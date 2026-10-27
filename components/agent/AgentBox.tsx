"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { MAX_MESSAGE_CHARS } from "@/lib/ai/guardrails";
import { announceAgentStarted } from "@/lib/ui-events";
import type { Locale } from "@/lib/content/load";
import type { Messages } from "@/lib/messages";
import type { ConversationHandle } from "./AgentConversation";

// The chat (useChat + AI SDK client) loads on the first question, never with
// the page: the hero stays inside the initial JS budget (RNF-2).
const AgentConversation = dynamic(() => import("./AgentConversation"), { ssr: false });

export function AgentBox({
  t,
  agent,
  locale,
}: {
  t: Messages["hero"];
  agent: Messages["agent"];
  locale: Locale;
}) {
  const [input, setInput] = useState("");
  const [first, setFirst] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const conversation = useRef<ConversationHandle>(null);
  const onBusy = useCallback((value: boolean) => setBusy(value), []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    if (first === null) {
      setFirst(text);
      announceAgentStarted();
    }
    else conversation.current?.send(text);
    setInput("");
  };

  return (
    <div
      id="agente"
      className="flex scroll-mt-6 flex-col gap-3 rounded-panel border border-border bg-surface p-4"
    >
      <noscript>
        <style>{"#agent-form{display:none}"}</style>
        <a href="#contacto" className="text-sm text-text-2 underline underline-offset-2">
          {agent.noScript}
        </a>
      </noscript>
      <form id="agent-form" onSubmit={onSubmit} className="flex flex-col gap-3">
        <label
          htmlFor="ask"
          className="text-sm font-semibold text-text"
        >
          {t.agentLabel}
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <input
            id="ask"
            type="text"
            value={input}
            maxLength={MAX_MESSAGE_CHARS}
            onChange={(event) => setInput(event.target.value)}
            placeholder={first === null ? t.agentPlaceholder : agent.followUpPlaceholder}
            className="h-12 w-full min-w-0 rounded-control border border-border-strong bg-bg px-3.5 text-base text-text placeholder:text-text-faint sm:w-auto sm:flex-[1_1_260px] sm:px-4"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex h-12 items-center justify-center rounded-control bg-accent px-5 text-base font-bold text-bg disabled:cursor-wait disabled:opacity-60"
          >
            {t.agentSubmit}
          </button>
        </div>
      </form>
      {first !== null && (
        <AgentConversation
          ref={conversation}
          firstMessage={first}
          onBusy={onBusy}
          locale={locale}
          t={agent}
        />
      )}
    </div>
  );
}
