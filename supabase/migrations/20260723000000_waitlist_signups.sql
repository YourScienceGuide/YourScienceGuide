-- Curriculum waitlist signups from /parent/billing (and future surfaces).

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text not null default 'parent-billing',
  created_at timestamptz not null default now()
);

comment on table public.waitlist_signups is
  'Emails collected when registration/checkout is not yet open.';

create unique index if not exists waitlist_signups_email_lower_idx
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;
