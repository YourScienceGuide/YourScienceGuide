-- Admin-editable subscription plans synced to Stripe Prices.

create table if not exists public.billing_plans (
  id text primary key check (id in ('monthly', 'annual')),
  label text not null,
  description text not null default '',
  badge text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  interval text not null check (interval in ('month', 'year')),
  stripe_product_id text,
  stripe_price_id text,
  updated_at timestamptz not null default now()
);

comment on table public.billing_plans is
  'Subscription plan display amounts and linked Stripe Product/Price IDs.';

alter table public.billing_plans enable row level security;

insert into public.billing_plans (
  id,
  label,
  description,
  badge,
  amount_cents,
  currency,
  interval
)
values
  (
    'monthly',
    'Monthly',
    'Full access to all courses and lessons. Cancel anytime.',
    null,
    1999,
    'usd',
    'month'
  ),
  (
    'annual',
    'Annual',
    'Save about 37% compared to monthly billing.',
    'Best value',
    14999,
    'usd',
    'year'
  )
on conflict (id) do nothing;
