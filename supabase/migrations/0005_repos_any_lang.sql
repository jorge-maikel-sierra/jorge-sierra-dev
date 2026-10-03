-- 0005_repos_any_lang.sql — jorge-sierra.dev v2 (task 6.1)
-- The GitHub READMEs exist in one language only (Spanish) and are indexed once
-- with lang = 'es'. They are documentation, not localized content: an English
-- visitor must still retrieve them instead of duplicating every repo per
-- language. Same signature and return type, so grants are kept.

create or replace function public.match_kb_chunks(
  query_embedding extensions.vector(1536),
  query_text      text,
  match_count     int  default 8,
  filter_lang     text default 'es'
)
returns table (
  chunk_id     bigint,
  document_id  uuid,
  content      text,
  metadata     jsonb,
  title        text,
  url          text,
  source_type  text,
  score        double precision,
  similarity   double precision
)
language sql stable
set search_path = public, extensions
as $$
  with vec as (
    select c.id, row_number() over (order by c.embedding <=> query_embedding) as rnk
    from public.kb_chunks c
    join public.kb_documents d on d.id = c.document_id
    where (d.lang = filter_lang or d.source_type = 'repo')
    order by c.embedding <=> query_embedding
    limit 30
  ),
  terms as (
    select nullif(array_to_string(tsvector_to_array(to_tsvector('simple', query_text)), ' | '), '') as expr
  ),
  lex as (
    select c.id, row_number() over (order by ts_rank_cd(c.tsv, q) desc) as rnk
    from public.kb_chunks c
    join public.kb_documents d on d.id = c.document_id,
         terms t,
         to_tsquery('simple', t.expr) q
    where t.expr is not null and (d.lang = filter_lang or d.source_type = 'repo') and c.tsv @@ q
    order by ts_rank_cd(c.tsv, q) desc
    limit 30
  ),
  fused as (
    select id, sum(1.0 / (60 + rnk)) as score
    from (select id, rnk from vec union all select id, rnk from lex) u
    group by id
  )
  select c.id, c.document_id, c.content, c.metadata, d.title, d.url, d.source_type, f.score,
         1 - (c.embedding <=> query_embedding) as similarity
  from fused f
  join public.kb_chunks c on c.id = f.id
  join public.kb_documents d on d.id = c.document_id
  order by f.score desc
  limit match_count;
$$;
