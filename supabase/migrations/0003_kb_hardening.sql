-- 0003_kb_hardening.sql — jorge-sierra.dev v2
-- Supabase security advisors (task 4.1):
-- · extension_in_public: pgvector moves to the "extensions" schema.
-- · function_search_path_mutable: match_kb_chunks gets a fixed search_path, so
--   callers cannot shadow the tables or the <=> operator it relies on.

alter extension vector set schema extensions;

alter function public.match_kb_chunks(extensions.vector, text, int, text)
  set search_path = public, extensions;
