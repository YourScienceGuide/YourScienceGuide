alter table public.lessons
  add column if not exists access_tier text not null default 'subscriber';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lessons_access_tier_check'
  ) then
    alter table public.lessons
      add constraint lessons_access_tier_check
      check (access_tier in ('preview', 'subscriber'));
  end if;
end $$;

update public.lessons
set access_tier = 'preview'
where id in ('scientific-method', 'lab-safety')
  and access_tier = 'subscriber';
