-- Per-course assignment algorithm knobs (pool preference / bonus split).

alter table public.course_grading_config
  add column if not exists algorithm_config jsonb not null default '{}'::jsonb;

comment on column public.course_grading_config.algorithm_config is
  'Assignment algorithm tunables: extraPrimaryPoolTake, maxEndOfChapterQuestions, easyDifficultyMax, extraPracticeSessionSize.';
