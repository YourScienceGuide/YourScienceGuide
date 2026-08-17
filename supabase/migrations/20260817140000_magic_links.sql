-- Admin-generated magic links: signed-in (non-admin) access without a Clerk account.

create table if not exists public.magic_links (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  label text not null default '',
  access_mode text not null default 'anyone'
    check (access_mode in ('anyone', 'first_browser')),
  expires_at timestamptz not null,
  disabled_at timestamptz,
  disabled_by text,
  created_by text not null,
  created_at timestamptz not null default now(),
  last_redeemed_at timestamptz,
  redeem_count integer not null default 0,
  claimed_browser_hash text,
  claimed_at timestamptz
);

comment on table public.magic_links is
  'Shareable access links that grant full non-admin site access until expiry or disable.';

create index if not exists magic_links_created_at_idx
  on public.magic_links (created_at desc);

create index if not exists magic_links_token_idx
  on public.magic_links (token);

alter table public.magic_links enable row level security;
