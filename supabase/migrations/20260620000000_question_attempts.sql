-- Per-student log of assignment and extra-practice question attempts.
-- Run in Supabase Dashboard → SQL Editor (or via Supabase CLI).
-- The app reads/writes through Next.js API routes using the service role key.

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  student_user_id text not null,
  course_id text not null,
  lesson_id text not null,
  question_id text not null,
  activity text not null check (activity in ('assignment', 'alcumus')),
  question_type text not null,
  prompt_excerpt text not null default '',
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

comment on table public.question_attempts is
  'Student question attempts for assignment and Alcumus extra practice.';

create index if not exists question_attempts_student_created_idx
  on public.question_attempts (student_user_id, created_at desc);

create index if not exists question_attempts_student_lesson_idx
  on public.question_attempts (student_user_id, course_id, lesson_id, created_at desc);

alter table public.question_attempts enable row level security;

-- No RLS policies: accessed only from server-side API routes with the service role key.
