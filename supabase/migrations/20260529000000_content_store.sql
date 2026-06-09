-- Global CMS document for courses, lesson questions, Alcumus banks, and video metadata.
-- Run this in the Supabase Dashboard → SQL Editor (or via Supabase CLI).
-- The app reads/writes this table through Next.js API routes using the service role key.

create table if not exists public.content_store (
  id text primary key default 'global',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.content_store is
  'Single-row (id=global) JSON document matching AdminContentStore in the app.';

create index if not exists content_store_updated_at_idx on public.content_store (updated_at desc);

alter table public.content_store enable row level security;

-- No RLS policies: the app accesses this table only from server-side API routes.
