-- Normalized CMS tables (replaces the monolithic content_store JSON blob).
-- Run in Supabase Dashboard → SQL Editor after prior migrations.
-- The app reads/writes through Next.js API routes using the service role key.

-- ---------------------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------------------

create table if not exists public.courses (
  id text primary key,
  title text not null,
  subject text not null,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.courses is 'Top-level curriculum courses (e.g. biology-year-1).';

create table if not exists public.lessons (
  course_id text not null references public.courses (id) on delete cascade,
  id text not null,
  chapter_id text not null,
  chapter_title text not null,
  title text not null,
  description text not null,
  sort_order integer not null,
  csv_chapter integer,
  csv_section integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (course_id, id)
);

comment on table public.lessons is 'Lessons within a course.';

create index if not exists lessons_course_sort_idx
  on public.lessons (course_id, sort_order asc);

-- ---------------------------------------------------------------------------
-- Companion textbooks
-- ---------------------------------------------------------------------------

create table if not exists public.course_textbooks (
  course_id text primary key references public.courses (id) on delete cascade,
  title text not null,
  subtitle text not null default '',
  authors text not null default '',
  edition text not null default '',
  publisher text not null default '',
  cover_url text not null default '',
  cover_alt text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.course_textbooks is 'Optional companion textbook shown on the course page.';

-- ---------------------------------------------------------------------------
-- Lesson videos (Mux metadata)
-- ---------------------------------------------------------------------------

create table if not exists public.lesson_videos (
  course_id text not null,
  lesson_id text not null,
  title text not null,
  description text not null default '',
  mux_playback_id text,
  file_name text,
  updated_at timestamptz not null default now(),
  primary key (course_id, lesson_id),
  foreign key (course_id, lesson_id)
    references public.lessons (course_id, id) on delete cascade
);

comment on table public.lesson_videos is 'Mux playback metadata per lesson.';

-- ---------------------------------------------------------------------------
-- Assignment questions (end-of-chapter)
-- ---------------------------------------------------------------------------

create table if not exists public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  lesson_id text not null,
  question_id text not null,
  sort_order integer not null,
  question_type text not null,
  prompt text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (course_id, lesson_id, question_id),
  foreign key (course_id, lesson_id)
    references public.lessons (course_id, id) on delete cascade
);

comment on table public.assignment_questions is
  'End-of-chapter assignment questions. Type-specific fields live in payload JSONB.';

create index if not exists assignment_questions_lesson_idx
  on public.assignment_questions (course_id, lesson_id, sort_order asc);

-- ---------------------------------------------------------------------------
-- Extra practice (Alcumus)
-- ---------------------------------------------------------------------------

create table if not exists public.alcumus_problems (
  course_id text not null,
  lesson_id text not null,
  id text not null,
  level integer not null check (level between 1 and 5),
  problem_type text not null check (problem_type in ('choice', 'numeric')),
  prompt text not null,
  hint text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (course_id, lesson_id, id),
  foreign key (course_id, lesson_id)
    references public.lessons (course_id, id) on delete cascade
);

comment on table public.alcumus_problems is
  'Adaptive extra-practice problems. Options and answers live in payload JSONB.';

create index if not exists alcumus_problems_lesson_idx
  on public.alcumus_problems (course_id, lesson_id, level);

-- ---------------------------------------------------------------------------
-- RLS (service role via API only)
-- ---------------------------------------------------------------------------

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.course_textbooks enable row level security;
alter table public.lesson_videos enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.alcumus_problems enable row level security;

-- ---------------------------------------------------------------------------
-- Textbook cover images (Supabase Storage)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'textbook-covers',
  'textbook-covers',
  true,
  1572864,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read textbook covers" on storage.objects;

create policy "Public read textbook covers"
  on storage.objects
  for select
  to public
  using (bucket_id = 'textbook-covers');
