import { createClient } from "@supabase/supabase-js";

// Service-role client: server only (CLAUDE.md rule 5). Never import it from a
// client component.
export function createServiceClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
