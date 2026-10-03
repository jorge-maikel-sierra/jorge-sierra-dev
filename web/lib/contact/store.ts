import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContactInput } from "./schema";

// Leads hold personal data; lead_events never do (docs/design.md §5).
export function createLeadStore(db: SupabaseClient) {
  return {
    async store(input: ContactInput) {
      const { data, error } = await db
        .from("leads")
        .insert({
          source: "form",
          kind: input.kind,
          name: input.name,
          email: input.email,
          company: input.company ?? null,
          message: input.message,
        })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("lead insert returned no row");

      const event = await db.from("lead_events").insert({ lead_id: data.id, step: "received" });
      if (event.error) throw event.error;
      return data.id as string;
    },

    async recordFailure(leadId: string, failedStep: string) {
      const { error } = await db
        .from("lead_events")
        .insert({ lead_id: leadId, step: "failed", meta: { failedStep } });
      if (error) throw error;
    },
  };
}
