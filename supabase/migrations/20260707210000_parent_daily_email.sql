-- Parent daily email template, lesson parent prompts, flashcard progress, delivery log.

alter table public.lessons
  add column if not exists parent_engagement_prompt text,
  add column if not exists free_response_rubric text;

comment on column public.lessons.parent_engagement_prompt is
  'Discussion prompt for parents in the daily progress email.';
comment on column public.lessons.free_response_rubric is
  'Grading rubric text shown to parents for the lesson free-response question.';

create table if not exists public.parent_daily_email_template (
  id text primary key default 'default',
  subject text not null,
  body text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.parent_daily_email_template is
  'Admin-editable template for the daily parent progress email.';

insert into public.parent_daily_email_template (id, subject, body, enabled)
values (
  'default',
  'Daily progress for {{studentName}}',
  E'Dear {{parentName}},\n\nToday, {{studentName}} completed:\n\n{{lessonActivitySummary}}\n\n{{flashcardSummary}}\n\n{{freeResponseSection}}\n\n{{newFlashcardsSection}}\n\nDiscussion prompt: {{parentEngagementPrompt}}',
  true
)
on conflict (id) do nothing;

create table if not exists public.flashcard_study_events (
  id uuid primary key default gen_random_uuid(),
  family_student_id uuid not null references public.family_students (id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  card_id text not null,
  front_text text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists flashcard_study_events_student_day_idx
  on public.flashcard_study_events (family_student_id, created_at desc);

create table if not exists public.flashcard_student_definitions (
  family_student_id uuid not null references public.family_students (id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  card_id text not null,
  front_text text not null default '',
  definition text not null,
  updated_at timestamptz not null default now(),
  primary key (family_student_id, course_id, lesson_id, card_id)
);

create table if not exists public.parent_daily_email_log (
  id uuid primary key default gen_random_uuid(),
  parent_clerk_user_id text not null,
  family_student_id uuid not null references public.family_students (id) on delete cascade,
  sent_on date not null,
  status text not null,
  error_message text,
  created_at timestamptz not null default now(),
  unique (family_student_id, sent_on)
);

create index if not exists parent_daily_email_log_parent_idx
  on public.parent_daily_email_log (parent_clerk_user_id, sent_on desc);
