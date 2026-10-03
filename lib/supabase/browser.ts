import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { LeadEvent } from "@/lib/contact/pipeline";

// Browser client with the public key only. Imported dynamically on submit so
// supabase-js stays out of the initial JS (RNF-2).
let client: SupabaseClient | null = null;

function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase public variables are missing");
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/** Realtime does not guarantee delivery: re-read while the pipeline runs. */
export const RECONCILE_INTERVAL_MS = 3000;

/**
 * Follows one lead's events: Realtime for new rows, one read for rows written
 * before the subscription was ready (it waits for SUBSCRIBED: reading earlier
 * leaves a gap where fast events are missed by both), and a periodic re-read
 * so a dropped Realtime message cannot stall the pipeline. Duplicates are
 * harmless: the pipeline reducer ignores repeated steps.
 */
export async function followLead(
  leadId: string,
  onEvent: (event: LeadEvent) => void,
): Promise<() => void> {
  const db = browserClient();
  const channel = db
    .channel(`lead:${leadId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "lead_events", filter: `lead_id=eq.${leadId}` },
      (payload) => onEvent(payload.new as LeadEvent),
    )
;

  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        resolve();
      }
    });
  });

  const read = async () => {
    const { data } = await db
      .from("lead_events")
      .select("step, meta")
      .eq("lead_id", leadId)
      .order("created_at");
    data?.forEach((event) => onEvent(event as LeadEvent));
  };
  await read();
  const timer = setInterval(() => void read(), RECONCILE_INTERVAL_MS);

  return () => {
    clearInterval(timer);
    void db.removeChannel(channel);
  };
}
