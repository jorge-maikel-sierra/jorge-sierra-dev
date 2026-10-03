-- 0002_knowledge_base.sql — jorge-sierra.dev v2
-- Base de conocimiento del agente (pgvector + texto completo), tarea 4.1.
-- IMPORTANTE: la dimensión de vector(1536) debe coincidir con EMBEDDING_DIMENSIONS. Cámbiala aquí antes de aplicar si usas otro modelo.

create extension if not exists vector;

-- ─────────────────────────────────────────────
-- Base de conocimiento
-- ─────────────────────────────────────────────

create table public.kb_documents (
  id            uuid primary key default gen_random_uuid(),
  source_type   text not null check (source_type in ('profile','experience','case','faq','cv','repo')),
  slug          text not null,
  title         text not null,
  url           text,
  lang          text not null default 'es',
  content_hash  text not null,
  updated_at    timestamptz not null default now(),
  unique (source_type, slug, lang)
);

create table public.kb_chunks (
  id           bigint generated always as identity primary key,
  document_id  uuid not null references public.kb_documents(id) on delete cascade,
  chunk_index  int  not null,
  content      text not null,
  metadata     jsonb not null default '{}'::jsonb,
  embedding    vector(1536) not null,
  tsv          tsvector generated always as (to_tsvector('simple', content)) stored,
  unique (document_id, chunk_index)
);

create index kb_chunks_embedding_idx on public.kb_chunks using hnsw (embedding vector_cosine_ops);
create index kb_chunks_tsv_idx on public.kb_chunks using gin (tsv);

-- Búsqueda híbrida: vectorial + léxica, fusionadas con Reciprocal Rank Fusion (k = 60).
create or replace function public.match_kb_chunks(
  query_embedding vector(1536),
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
  score        double precision
)
language sql stable
as $$
  with vec as (
    select c.id, row_number() over (order by c.embedding <=> query_embedding) as rnk
    from public.kb_chunks c
    join public.kb_documents d on d.id = c.document_id
    where d.lang = filter_lang
    order by c.embedding <=> query_embedding
    limit 30
  ),
  lex as (
    select c.id, row_number() over (order by ts_rank_cd(c.tsv, q) desc) as rnk
    from public.kb_chunks c
    join public.kb_documents d on d.id = c.document_id,
         websearch_to_tsquery('simple', query_text) q
    where d.lang = filter_lang and c.tsv @@ q
    order by ts_rank_cd(c.tsv, q) desc
    limit 30
  ),
  fused as (
    select id, sum(1.0 / (60 + rnk)) as score
    from (select id, rnk from vec union all select id, rnk from lex) u
    group by id
  )
  select c.id, c.document_id, c.content, c.metadata, d.title, d.url, d.source_type, f.score
  from fused f
  join public.kb_chunks c on c.id = f.id
  join public.kb_documents d on d.id = c.document_id
  order by f.score desc
  limit match_count;
$$;

-- La base de conocimiento solo se lee y escribe desde el servidor (service role).
alter table public.kb_documents enable row level security;
alter table public.kb_chunks    enable row level security;
-- Sin políticas para anon/authenticated: acceso denegado por defecto.

revoke execute on function public.match_kb_chunks(vector, text, int, text) from public, anon, authenticated;
grant  execute on function public.match_kb_chunks(vector, text, int, text) to service_role;
