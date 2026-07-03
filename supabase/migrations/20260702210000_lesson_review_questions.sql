create table if not exists public.lesson_review_questions (
  course_id text not null references public.courses (id) on delete cascade,
  lesson_id text not null,
  question_id text not null,
  sort_order integer not null default 0,
  question_type text not null,
  prompt text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (course_id, lesson_id, question_id),
  foreign key (course_id, lesson_id)
    references public.lessons (course_id, id) on delete cascade
);

create index if not exists lesson_review_questions_lesson_idx
  on public.lesson_review_questions (course_id, lesson_id, sort_order);
