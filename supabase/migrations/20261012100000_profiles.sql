-- ==============================================================================
-- 20261012100000_profiles.sql
-- Bagian: BRILLIANT (brilliantgibrann16)
-- Tabel profiles, enum role, trigger auth handle_new_user, dan proteksi role RLS
-- ==============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade deferrable initially deferred,
  role text not null default 'student' check (role in ('student', 'mentor', 'admin')),
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil pengguna Future Skill dengan peran student, mentor, atau admin. Dibuat otomatis saat registrasi dengan peran awal student.';

create index if not exists profiles_role_idx on public.profiles (role);

-- Helper trigger updated_at
create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_profiles_updated_at();

-- Trigger handle_new_user: selalu menetapkan role student, tidak mempercayai metadata role dari client
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Siswa'
  );

  insert into public.profiles (id, role, display_name)
  values (new.id, 'student', v_name)
  on conflict (id) do update
  set display_name = excluded.display_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Proteksi role: Tolak modifikasi field role dari client (authenticated/anon)
create or replace function public.prevent_profile_role_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if current_user in ('authenticated', 'anon') or (current_setting('request.jwt.claims', true) is not null and current_setting('request.jwt.claims', true) != '') then
      raise exception 'role_edit_prohibited' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_protect_profile_role on public.profiles;
create trigger enforce_protect_profile_role
  before update on public.profiles
  for each row
  execute function public.prevent_profile_role_update();

-- Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Profil dapat dibaca oleh user yang terautentikasi (untuk nama instruktur dan rekan belajar)
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (true);

-- User hanya dapat mengedit nama/profilnya sendiri dan tidak dapat mengganti role
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

revoke all on table public.profiles from anon;
grant select, update on table public.profiles to authenticated;
