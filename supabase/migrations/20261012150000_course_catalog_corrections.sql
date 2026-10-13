-- Course catalog corrections.
-- Apply after 20261012130000_course_seed_publish_rls.sql.
-- Review/test in a disposable database before applying to shared Supabase.

begin;

grant insert, update, delete
on table public.courses, public.course_modules, public.lessons
to authenticated;

-- Allow admin to update published courses (e.g. capacity), while existing
-- draft-owner policy remains in place.
drop policy if exists courses_update_published_admin on public.courses;
create policy courses_update_published_admin
on public.courses
for update
to authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- Published course title/description/category are immutable.
-- Admin's RLS policy determines who can update capacity/status.
create or replace function public.reject_published_course_content_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_course_id uuid;
  new_course_id uuid;
begin
  if tg_table_name = 'courses' then
    if tg_op = 'DELETE' then
      if old.status = 'published' then
        raise exception 'Published courses cannot be deleted';
      end if;
      return old;
    end if;

    if old.status = 'published'
       and (
         new.title is distinct from old.title
         or new.description is distinct from old.description
         or new.category is distinct from old.category
       )
    then
      raise exception
        'Title, description, and category of published courses are locked';
    end if;

    return new;
  end if;

  -- Prevent update/delete/move of modules or lessons associated with published
  -- courses, checking both old and new parent course.
  if tg_op <> 'INSERT' then
    old_course_id := old.course_id;
  end if;
  if tg_op <> 'DELETE' then
    new_course_id := new.course_id;
  end if;

  if old_course_id is not null and exists (
    select 1 from public.courses c
    where c.id = old_course_id and c.status = 'published'
  ) then
    raise exception 'Content of published courses cannot be changed';
  end if;

  if new_course_id is not null and exists (
    select 1 from public.courses c
    where c.id = new_course_id and c.status = 'published'
  ) then
    raise exception 'Content of published courses cannot be changed';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

commit;