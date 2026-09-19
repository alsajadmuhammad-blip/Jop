-- مسار: حسابات الباحثين + سيرة ATS الداخلية + صلاحية بحث HR
-- نفّذ هذا الملف بعد schema.sql. الملف لا ينشئ أي رفع CV جديد.

-- 1) صلاحية البحث تُعطى لحساب صاحب العمل/HR من المشرف فقط.
alter table public.profiles
  add column if not exists can_search_candidates boolean not null default false;

-- 2) ملف الباحث نفسه هو السيرة الذاتية المنظمة.
create table if not exists public.candidate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  headline text not null default '',
  specialization text not null default '',
  city text not null default '',
  experience_years numeric(5, 1) not null default 0 check (experience_years >= 0),
  skills text[] not null default '{}',
  experience_details text not null default '',
  education text not null default '',
  languages text[] not null default '{}',
  work_type text not null default '',
  remote_available boolean not null default false,
  expected_salary_min numeric(12, 2),
  availability text not null default '',
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidate_profiles add column if not exists full_name text not null default '';
alter table public.candidate_profiles add column if not exists email text not null default '';
alter table public.candidate_profiles add column if not exists phone text not null default '';
alter table public.candidate_profiles add column if not exists headline text not null default '';
alter table public.candidate_profiles add column if not exists specialization text not null default '';
alter table public.candidate_profiles add column if not exists city text not null default '';
alter table public.candidate_profiles add column if not exists experience_years numeric(5, 1) not null default 0;
alter table public.candidate_profiles add column if not exists skills text[] not null default '{}';
alter table public.candidate_profiles add column if not exists experience_details text not null default '';
alter table public.candidate_profiles add column if not exists education text not null default '';
alter table public.candidate_profiles add column if not exists languages text[] not null default '{}';
alter table public.candidate_profiles add column if not exists work_type text not null default '';
alter table public.candidate_profiles add column if not exists remote_available boolean not null default false;
alter table public.candidate_profiles add column if not exists expected_salary_min numeric(12, 2);
alter table public.candidate_profiles add column if not exists availability text not null default '';
alter table public.candidate_profiles add column if not exists summary text not null default '';
alter table public.candidate_profiles add column if not exists created_at timestamptz not null default now();
alter table public.candidate_profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_candidate_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists candidate_profiles_updated_at on public.candidate_profiles;
create trigger candidate_profiles_updated_at
before update on public.candidate_profiles
for each row execute function public.set_candidate_profile_updated_at();

create index if not exists candidate_profiles_city_idx
  on public.candidate_profiles (lower(city));
create index if not exists candidate_profiles_specialization_idx
  on public.candidate_profiles (lower(specialization));
create index if not exists candidate_profiles_experience_idx
  on public.candidate_profiles (experience_years);
create index if not exists candidate_profiles_skills_gin_idx
  on public.candidate_profiles using gin (skills);

-- 3) الحسابات الجديدة تنشئ profile تلقائيًا حسب الاختيار في شاشة التسجيل.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when requested_role = 'hr' then 'hr'::public.user_role else 'candidate'::public.user_role end
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end;
$$;

-- 4) التقديم القديم يبقى قابلًا للقراءة، لكن التقديم الجديد يعتمد على ملف الباحث
-- ولا يحتاج رفع CV خارجي.
alter table public.applications
  add column if not exists candidate_id uuid references public.profiles(id) on delete set null;
alter table public.applications alter column cv_path drop not null;

alter table public.applications drop constraint if exists application_target_check;
alter table public.applications add constraint application_target_check check (
  job_id is null
  and cv_request_id is not null
  and (
    (candidate_id is not null and cv_path is null)
    or (candidate_id is null and cv_path is not null)
  )
);

-- 5) RLS: لا يستطيع HR قراءة الملفات إلا إذا فعّل المشرف الصلاحية على حسابه.
alter table public.candidate_profiles enable row level security;

drop policy if exists "candidates manage own profile" on public.candidate_profiles;
create policy "candidates manage own profile"
on public.candidate_profiles
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "admins manage candidate profiles" on public.candidate_profiles;
create policy "admins manage candidate profiles"
on public.candidate_profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "enabled hr reads candidate profiles" on public.candidate_profiles;
create policy "enabled hr reads candidate profiles"
on public.candidate_profiles
for select
to authenticated
using (
  exists (
    select 1 from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role = 'hr'
      and viewer.can_search_candidates = true
  )
);

grant select, insert, update, delete on public.candidate_profiles to authenticated;

-- 6) البحث نفسه ينفّذ داخل PostgreSQL ويتحقق من صلاحية الحساب قبل إرجاع أي نتيجة.
create or replace function public.search_candidate_profiles(
  p_keyword text default null,
  p_specialization text default null,
  p_city text default null,
  p_min_experience numeric default null,
  p_work_type text default null,
  p_remote_available boolean default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  headline text,
  specialization text,
  city text,
  experience_years numeric,
  skills text[],
  experience_details text,
  education text,
  languages text[],
  work_type text,
  remote_available boolean,
  expected_salary_min numeric,
  availability text,
  summary text,
  created_at timestamptz,
  updated_at timestamptz,
  relevance integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'hr'
      and can_search_candidates = true
  ) then
    raise exception 'صلاحية البحث عن الملفات غير مفعلة لهذا الحساب';
  end if;

  return query
  select
    candidate.user_id,
    candidate.full_name,
    candidate.email,
    candidate.phone,
    candidate.headline,
    candidate.specialization,
    candidate.city,
    candidate.experience_years,
    candidate.skills,
    candidate.experience_details,
    candidate.education,
    candidate.languages,
    candidate.work_type,
    candidate.remote_available,
    candidate.expected_salary_min,
    candidate.availability,
    candidate.summary,
    candidate.created_at,
    candidate.updated_at,
    (
      case
        when nullif(trim(coalesce(p_keyword, '')), '') is null then 0
        when lower(
          concat_ws(
            ' ',
            candidate.full_name,
            candidate.headline,
            candidate.specialization,
            candidate.city,
            candidate.experience_details,
            candidate.education,
            candidate.summary,
            array_to_string(candidate.skills, ' '),
            array_to_string(candidate.languages, ' ')
          )
        ) like '%' || lower(trim(p_keyword)) || '%' then 10
        else 0
      end
    )::integer as relevance
  from public.candidate_profiles candidate
  where
    (
      nullif(trim(coalesce(p_keyword, '')), '') is null
      or lower(
        concat_ws(
          ' ',
          candidate.full_name,
          candidate.headline,
          candidate.specialization,
          candidate.city,
          candidate.experience_details,
          candidate.education,
          candidate.summary,
          array_to_string(candidate.skills, ' '),
          array_to_string(candidate.languages, ' ')
        )
      ) like '%' || lower(trim(p_keyword)) || '%'
    )
    and (
      nullif(trim(coalesce(p_specialization, '')), '') is null
      or lower(candidate.specialization) like '%' || lower(trim(p_specialization)) || '%'
    )
    and (
      nullif(trim(coalesce(p_city, '')), '') is null
      or lower(candidate.city) like '%' || lower(trim(p_city)) || '%'
    )
    and (p_min_experience is null or candidate.experience_years >= p_min_experience)
    and (
      nullif(trim(coalesce(p_work_type, '')), '') is null
      or candidate.work_type = p_work_type
    )
    and (p_remote_available is null or candidate.remote_available = p_remote_available)
  order by relevance desc, candidate.updated_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.search_candidate_profiles(text, text, text, numeric, text, boolean, integer, integer) from public;
grant execute on function public.search_candidate_profiles(text, text, text, numeric, text, boolean, integer, integer) to authenticated;

-- 7) لا يوجد رفع CV خارجي جديد. ملفات CV القديمة تبقى قابلة للقراءة حسب سياساتها
-- الحالية، لكن لا يسمح هذا الملف بأي upload جديد.
drop policy if exists "public can upload cv files" on storage.objects;
revoke insert on storage.objects from anon, authenticated;

drop policy if exists "public submits applications" on public.applications;
create policy "candidates submit profile applications"
on public.applications
for insert
to authenticated
with check (
  candidate_id = auth.uid()
  and job_id is null
  and cv_request_id is not null
  and cv_path is null
  and exists (
    select 1 from public.candidate_profiles
    where user_id = auth.uid()
  )
);