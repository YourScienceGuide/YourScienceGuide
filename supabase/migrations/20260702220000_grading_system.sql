-- Grading rubric, lesson grades, long-answer submissions, graduation thresholds.

alter table public.lessons
  add column if not exists graduation_problem_count integer;

comment on column public.lessons.graduation_problem_count is
  'Problems a student must solve correctly to graduate this section; null uses course default.';

create table if not exists public.course_grading_config (
  course_id text primary key references public.courses (id) on delete cascade,
  review_count integer not null default 4,
  review_points_each integer not null default 1,
  mc_bank_size integer not null default 15,
  mc_target_correct integer not null default 9,
  mc_points_each integer not null default 2,
  fib_count integer not null default 4,
  fib_points_each integer not null default 2,
  extra_count integer not null default 5,
  extra_points_each integer not null default 2,
  free_response_count integer not null default 1,
  free_response_points integer not null default 10,
  default_graduation_problem_count integer not null default 18,
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_grades (
  id uuid primary key default gen_random_uuid(),
  family_student_id uuid not null references public.family_students (id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  earned_points integer not null default 0,
  possible_points integer not null default 50,
  percent integer not null default 0,
  problems_solved integer not null default 0,
  graduated boolean not null default false,
  score_breakdown jsonb not null default '{}'::jsonb,
  phase_progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (family_student_id, course_id, lesson_id),
  foreign key (course_id, lesson_id)
    references public.lessons (course_id, id) on delete cascade
);

create index if not exists lesson_grades_student_idx
  on public.lesson_grades (family_student_id, course_id, updated_at desc);

create table if not exists public.long_answer_submissions (
  id uuid primary key default gen_random_uuid(),
  family_student_id uuid not null references public.family_students (id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  question_id text not null,
  prompt_excerpt text not null,
  answer_text text not null,
  max_points integer not null default 10,
  parent_score integer,
  parent_feedback text,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (course_id, lesson_id)
    references public.lessons (course_id, id) on delete cascade
);

create index if not exists long_answer_submissions_parent_idx
  on public.long_answer_submissions (family_student_id, graded_at nulls first, created_at desc);
