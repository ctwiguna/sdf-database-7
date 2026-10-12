-- Kevin: seed, write RLS, publish RPC, published-content protection.

begin;

-- ---------------------------------------------------------
-- 1. Seed 4 courses, preserving existing records.
-- ---------------------------------------------------------
insert into public.courses
  (title, description, category, capacity, status)
select v.title, v.description, v.category, 20, 'draft'
from (
  values
    (
      'Instalasi dan Maintenance Solar Panel',
      'Pengenalan komponen, keselamatan, instalasi, dan checklist maintenance solar panel.',
      'Energi'
    ),
    (
      'Plumbing',
      'Mengenal jaringan air, pembuangan, sambungan, kebocoran, dan maintenance dasar.',
      'Teknik'
    ),
    (
      'Instalasi dan Maintenance EV Charging Station',
      'Pengenalan perangkat pengisian, risiko, inspeksi rutin, dan eskalasi gangguan.',
      'Kendaraan Listrik'
    ),
    (
      'Maintenance Mobil dan Motor Listrik',
      'Mengenal komponen kendaraan listrik, servis dasar, dan tanda bahaya baterai.',
      'Kendaraan Listrik'
    )
) as v(title, description, category)
where not exists (
  select 1 from public.courses c where c.title = v.title
);

-- ---------------------------------------------------------
-- 2. Seed 4 modules, preserving existing records.
-- ---------------------------------------------------------
insert into public.course_modules (course_id, title, position)
select c.id, v.module_title, 1
from (
  values
    ('Instalasi dan Maintenance Solar Panel', 'Dasar Solar Panel'),
    ('Plumbing', 'Dasar Plumbing'),
    ('Instalasi dan Maintenance EV Charging Station', 'Dasar EV Charging'),
    ('Maintenance Mobil dan Motor Listrik', 'Dasar Kendaraan Listrik')
) as v(course_title, module_title)
join public.courses c on c.title = v.course_title
where not exists (
  select 1 from public.course_modules m
  where m.course_id = c.id and m.position = 1
);

-- ---------------------------------------------------------
-- 3. Seed 8 lessons.
-- NOTE: video IDs mirror mockCourses.ts and are placeholders.
-- Replace with reviewed, permission-verified videos.
-- ---------------------------------------------------------
insert into public.lessons
  (module_id, course_id, title, position, youtube_video_id)
select
  m.id,
  c.id,
  v.lesson_title,
  v.lesson_position,
  v.youtube_video_id
from (
  values
    (
      'Instalasi dan Maintenance Solar Panel',
      'Dasar Solar Panel',
      'Komponen sistem dan keselamatan',
      1,
      'W2vMc3ENiz8'
    ),
    (
      'Instalasi dan Maintenance Solar Panel',
      'Dasar Solar Panel',
      'Gambaran instalasi dan maintenance',
      2,
      'W2vMc3ENiz8'
    ),
    (
      'Plumbing',
      'Dasar Plumbing',
      'Jaringan air dan pembuangan',
      1,
      '8jxRn-T_LCs'
    ),
    (
      'Plumbing',
      'Dasar Plumbing',
      'Sambungan, kebocoran, dan maintenance',
      2,
      '8jxRn-T_LCs'
    ),
    (
      'Instalasi dan Maintenance EV Charging Station',
      'Dasar EV Charging',
      'Perangkat pengisian dan risiko',
      1,
      'PnX1JSVPaTE'
    ),
    (
      'Instalasi dan Maintenance EV Charging Station',
      'Dasar EV Charging',
      'Perencanaan dan inspeksi rutin',
      2,
      'PnX1JSVPaTE'
    ),
    (
      'Maintenance Mobil dan Motor Listrik',
      'Dasar Kendaraan Listrik',
      'Komponen dan batas servis dasar',
      1,
      'IlAOzS9xnik'
    ),
    (
      'Maintenance Mobil dan Motor Listrik',
      'Dasar Kendaraan Listrik',
      'Pemeriksaan visual dan tanda bahaya',
      2,
      'IlAOzS9xnik'
    )
) as v(course_title, module_title, lesson_title, lesson_position, youtube_video_id)
join public.courses c
  on c.title = v.course_title
join public.course_modules m
  on m.course_id = c.id
 and m.title = v.module_title
where not exists (
  select 1
  from public.lessons l
  where l.module_id = m.id
    and l.position = v.lesson_position
);


-- ---------------------------------------------------------
-- 4. Write RLS: mentor owns course; admin can manage courses.
-- ---------------------------------------------------------

-- Courses: create only for own mentor ID, or admin.
drop policy if exists courses_insert_owner_admin on public.courses;
create policy courses_insert_owner_admin
on public.courses
for insert to authenticated
with check (
  mentor_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- Courses: only draft courses may be edited by owner/admin.
drop policy if exists courses_update_draft_owner_admin on public.courses;
create policy courses_update_draft_owner_admin
on public.courses
for update to authenticated
using (
  status = 'draft'
  and (
    mentor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
)
with check (
  status = 'draft'
  and (
    mentor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
);

drop policy if exists courses_delete_draft_owner_admin on public.courses;
create policy courses_delete_draft_owner_admin
on public.courses
for delete to authenticated
using (
  status = 'draft'
  and (
    mentor_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
);

-- Modules: write only when the parent course is draft and owned.
drop policy if exists modules_insert_draft_owner_admin on public.course_modules;
create policy modules_insert_draft_owner_admin
on public.course_modules
for insert to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
);

drop policy if exists modules_update_draft_owner_admin on public.course_modules;
create policy modules_update_draft_owner_admin
on public.course_modules
for update to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
);

drop policy if exists modules_delete_draft_owner_admin on public.course_modules;
create policy modules_delete_draft_owner_admin
on public.course_modules
for delete to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
);

-- Lessons: access is checked through the parent course.
drop policy if exists lessons_insert_draft_owner_admin on public.lessons;
create policy lessons_insert_draft_owner_admin
on public.lessons
for insert to authenticated
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
);

drop policy if exists lessons_update_draft_owner_admin on public.lessons;
create policy lessons_update_draft_owner_admin
on public.lessons
for update to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
);

drop policy if exists lessons_delete_draft_owner_admin on public.lessons;
create policy lessons_delete_draft_owner_admin
on public.lessons
for delete to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id and c.status = 'draft'
      and (
        c.mentor_id = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.id = (select auth.uid()) and p.role = 'admin'
        )
      )
  )
);

-- ---------------------------------------------------------
-- 5. Prevent editing or deleting published course content.
-- ---------------------------------------------------------

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
    if tg_op = 'UPDATE' and old.status = 'published' then
      raise exception 'Published courses cannot be edited';
    end if;

    if tg_op = 'DELETE' and old.status = 'published' then
      raise exception 'Published courses cannot be deleted';
    end if;

    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op <> 'INSERT' then
    old_course_id := old.course_id;
  end if;

  if tg_op <> 'DELETE' then
    new_course_id := new.course_id;
  end if;

  if old_course_id is not null and exists (
    select 1
    from public.courses c
    where c.id = old_course_id
      and c.status = 'published'
  ) then
    raise exception 'Content of published courses cannot be changed';
  end if;

  if new_course_id is not null and exists (
    select 1
    from public.courses c
    where c.id = new_course_id
      and c.status = 'published'
  ) then
    raise exception 'Content of published courses cannot be changed';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_published_course on public.courses;
create trigger protect_published_course
before update or delete on public.courses
for each row execute function public.reject_published_course_content_change();

drop trigger if exists protect_published_module on public.course_modules;
create trigger protect_published_module
before update or delete on public.course_modules
for each row execute function public.reject_published_course_content_change();

drop trigger if exists protect_published_lesson on public.lessons;
create trigger protect_published_lesson
before update or delete on public.lessons
for each row execute function public.reject_published_course_content_change();

-- 6. RPC: only admins may publish a course.
create or replace function public.publish_course(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Caller must be an authenticated admin.
  if (select auth.uid()) is null
     or not exists (
       select 1
       from public.profiles p
       where p.id = (select auth.uid())
         and p.role = 'admin'
     )
  then
    raise exception 'Only admins can publish courses';
  end if;

  -- Course must exist and still be a draft.
  if not exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and c.status = 'draft'
  ) then
    raise exception 'Course not found or not in draft status';
  end if;

  -- Course must contain at least one lesson.
  if not exists (
    select 1
    from public.lessons l
    where l.course_id = p_course_id
  ) then
    raise exception 'Cannot publish a course without lessons';
  end if;

  update public.courses
  set status = 'published',
      updated_at = now()
  where id = p_course_id
    and status = 'draft';

end;
$$;

revoke all on function public.publish_course(uuid) from public;
grant execute on function public.publish_course(uuid) to authenticated;

commit;

