-- Global CMS document for courses, lesson questions, Alcumus banks, and video metadata.
-- Access is through Next.js API routes (Clerk admin for writes); do not expose the service role key to the client.

create table if not exists public.content_store (
  id text primary key default 'global',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.content_store is
  'Single-row (id=global) JSON document matching AdminContentStore in the app.';

create index if not exists content_store_updated_at_idx on public.content_store (updated_at desc);

-- Optional: enable RLS if you later add direct client access with Clerk JWT.
alter table public.content_store enable row level security;

-- No policies by default — the app uses the service role from server-side API routes only.
