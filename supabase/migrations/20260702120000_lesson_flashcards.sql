create table if not exists public.lesson_flashcards (
  course_id text not null references public.courses (id) on delete cascade,
  lesson_id text not null,
  card_id text not null,
  term text not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (course_id, lesson_id, card_id),
  foreign key (course_id, lesson_id)
    references public.lessons (course_id, id) on delete cascade
);

create index if not exists lesson_flashcards_lesson_idx
  on public.lesson_flashcards (course_id, lesson_id, sort_order);
