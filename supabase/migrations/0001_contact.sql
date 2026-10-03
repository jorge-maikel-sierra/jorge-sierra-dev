-- 0001_contact.sql — jorge-sierra.dev v2
-- Pipeline de contacto: leads + eventos en tiempo real (tarea 3.1).
-- Separado de la base de conocimiento para no fijar vector(N) antes de elegir
-- el modelo de embeddings (tarea 4.1).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- Contacto
-- ─────────────────────────────────────────────

create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  source      text not null default 'form' check (source in ('form','agent')),
  kind        text not null check (kind in ('vacante','proyecto','otro')),
  name        text not null,
  email       text not null,
  company     text,
  message     text not null,
  intent      text,
  priority    text check (priority in ('alta','normal','baja')),
  created_at  timestamptz not null default now()
);

alter table public.leads enable row level security;
-- Sin políticas: solo el service role (API y n8n) lee y escribe leads.

create table public.lead_events (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  step        text not null check (step in ('received','classified','stored','notified','confirmed','failed')),
  meta        jsonb not null default '{}'::jsonb,  -- sin datos personales: p. ej. {"intent":"vacante","priority":"alta"} o {"failedStep":"notified"}
  created_at  timestamptz not null default now()
);

create index lead_events_lead_id_idx on public.lead_events (lead_id, created_at);

alter table public.lead_events enable row level security;

-- Los eventos no contienen datos personales y el lead_id es un UUID v4 no adivinable:
-- el rol anónimo puede leerlos para que el navegador siga su propio envío por Realtime.
create policy "anon puede leer eventos de pipeline"
  on public.lead_events for select
  to anon
  using (true);

-- Realtime para que el navegador reciba los pasos en vivo.
alter publication supabase_realtime add table public.lead_events;
