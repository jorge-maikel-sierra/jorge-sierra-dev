"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyEvent,
  idlePipeline,
  PIPELINE_TIMEOUT_MS,
  runningPipeline,
  timeoutPipeline,
  type PipelineState,
} from "@/lib/contact/pipeline";
import type { Messages } from "@/lib/messages";
import { ContactForm } from "./ContactForm";
import { PipelineView } from "./PipelineView";

// Owns one submission at a time: the form posts it, PipelineView shows the
// real lead_events arriving through Supabase Realtime (task 3.4).
export function ContactWorkspace({ t }: { t: Messages["contact"] }) {
  const [pipeline, setPipeline] = useState<PipelineState>(idlePipeline);
  const [sender, setSender] = useState<{ name: string; email: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const stop = useRef<(() => void) | null>(null);
  const timer = useRef<number | null>(null);

  const cleanup = () => {
    stop.current?.();
    stop.current = null;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  // Stop listening once the pipeline finished or failed.
  useEffect(() => {
    if (pipeline.status === "done" || pipeline.status === "failed") cleanup();
  }, [pipeline.status]);

  useEffect(() => cleanup, []);

  const onSent = (leadId: string, from: { name: string; email: string }) => {
    cleanup();
    setSender(from);
    setPipeline(runningPipeline);
    timer.current = window.setTimeout(
      () => setPipeline((state) => timeoutPipeline(state)),
      PIPELINE_TIMEOUT_MS,
    );
    void import("@/lib/supabase/browser")
      .then(({ followLead }) =>
        followLead(leadId, (event) => setPipeline((state) => applyEvent(state, event))),
      )
      .then((unsubscribe) => {
        stop.current = unsubscribe;
      })
      // Realtime unavailable: the timeout still shows the reassuring message.
      .catch(() => undefined);
  };

  const again = () => {
    cleanup();
    setPipeline(idlePipeline);
    setSender(null);
    setFormKey((key) => key + 1);
  };

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-5">
      <ContactForm
        key={formKey}
        t={t}
        locked={pipeline.status === "running"}
        onSent={onSent}
      />
      <PipelineView t={t} state={pipeline} sender={sender} onAgain={again} />
    </div>
  );
}
