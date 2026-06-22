-- Family student profiles under a parent Clerk account.
-- Run in Supabase Dashboard → SQL Editor (or via Supabase CLI).

create table if not exists public.family_students (
  id uuid primary key default gen_random_uuid(),
  parent_clerk_user_id text not null,
  name text not null,
  display_name text not null,
  avatar_initials text not null default '',
  email_on_lesson_complete boolean not null default true,
  email_on_grading_required boolean not null default true,
  show_grade_on_dashboard boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.family_students is
  'Learner profiles managed by a parent Clerk account.';

create index if not exists family_students_parent_idx
  on public.family_students (parent_clerk_user_id, created_at asc);

alter table public.family_students enable row level security;

-- Link question attempts to a family student profile.
alter table public.question_attempts
  add column if not exists family_student_id uuid references public.family_students (id) on delete cascade;

create index if not exists question_attempts_family_student_idx
  on public.question_attempts (family_student_id, created_at desc);
