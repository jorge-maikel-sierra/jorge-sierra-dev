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

/**
 * Follows one lead's events: Realtime for new rows plus one read for rows
 * written before the subscription was ready ("received" usually is).
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
    .subscribe();

  const { data } = await db
    .from("lead_events")
    .select("step, meta")
    .eq("lead_id", leadId)
    .order("created_at");
  data?.forEach((event) => onEvent(event as LeadEvent));

  return () => {
    void db.removeChannel(channel);
  };
}
