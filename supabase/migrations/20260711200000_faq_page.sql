-- Site FAQ page content (admin-editable, public read via API).

create table if not exists public.faq_page (
  id text primary key default 'default',
  title text not null,
  intro text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.faq_page is 'Admin-editable FAQ page title and introduction.';

create table if not exists public.faq_entries (
  page_id text not null references public.faq_page (id) on delete cascade,
  id text not null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (page_id, id)
);

comment on table public.faq_entries is 'FAQ question and answer entries.';

create index if not exists faq_entries_page_sort_idx
  on public.faq_entries (page_id, sort_order asc);

alter table public.faq_page enable row level security;
alter table public.faq_entries enable row level security;

insert into public.faq_page (id, title, intro)
values (
  'default',
  'Frequently asked questions',
  'Answers to common questions about using Your Science Guide as a student or parent.'
)
on conflict (id) do nothing;

insert into public.faq_entries (page_id, id, question, answer, sort_order, published)
values
  (
    'default',
    'getting-started',
    'How do students start a lesson?',
    E'Sign in, open Student from the top navigation, choose your course, then select a lesson. Complete the review questions, watch the video, and work through the assignment at your own pace.',
    0,
    true
  ),
  (
    'default',
    'parent-progress',
    'How can parents see progress?',
    E'Sign in and open Parent from the top navigation. You can view lesson grades, pending free-response items to grade, and overall course progress for each student on your account.',
    1,
    true
  ),
  (
    'default',
    'flashcards',
    'How do flashcards work?',
    E'Each flashcard shows a term. Students write their own definition in their words, then check their answer. Progress is saved so they can review again later.',
    2,
    true
  )
on conflict (page_id, id) do nothing;
