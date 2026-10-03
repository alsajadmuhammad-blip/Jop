-- Incremental search/pagination support.
-- Run once in the Supabase SQL Editor after candidate-search.sql.
-- This script does not delete or rewrite profile/job content; it adds searchable
-- text, indexes, and RPCs used by the app's paginated search screens.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Keep a compact, indexable search document instead of concatenating profile/job
-- fields for every search request.
alter table public.candidate_profiles
  add column if not exists search_text text not null default '';

alter table public.jobs
  add column if not exists search_text text not null default '';

alter table public.jobs
  add column if not exists province text not null default '';

create or replace function public.refresh_candidate_profile_search_text()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_text := lower(concat_ws(
    ' ',
    new.full_name,
    new.headline,
    new.specialization,
    new.province,
    new.city,
    new.experience_details,
    new.education,
    new.summary,
    array_to_string(new.skills, ' '),
    array_to_string(new.languages, ' ')
  ));
  return new;
end;
$$;

drop trigger if exists candidate_profiles_search_text on public.candidate_profiles;
create trigger candidate_profiles_search_text
before insert or update of
  full_name, headline, specialization, province, city, experience_details,
  education, summary, skills, languages
on public.candidate_profiles
for each row execute function public.refresh_candidate_profile_search_text();

create or replace function public.refresh_job_search_text()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_text := lower(concat_ws(
    ' ',
    new.title,
    new.company_name,
    new.province,
    new.city,
    new.category,
    new.job_type
  ));
  return new;
end;
$$;

drop trigger if exists jobs_search_text on public.jobs;
create trigger jobs_search_text
before insert or update of title, company_name, province, city, category, job_type
on public.jobs
for each row execute function public.refresh_job_search_text();

-- Backfill existing rows once. Rows already in sync are not rewritten.
update public.candidate_profiles
set search_text = lower(concat_ws(
  ' ',
  full_name,
  headline,
  specialization,
  province,
  city,
  experience_details,
  education,
  summary,
  array_to_string(skills, ' '),
  array_to_string(languages, ' ')
))
where search_text is distinct from lower(concat_ws(
  ' ',
  full_name,
  headline,
  specialization,
  province,
  city,
  experience_details,
  education,
  summary,
  array_to_string(skills, ' '),
  array_to_string(languages, ' ')
));

update public.jobs
set search_text = lower(concat_ws(' ', title, company_name, province, city, category, job_type))
where search_text is distinct from lower(concat_ws(' ', title, company_name, province, city, category, job_type));

-- The extension can already exist in a different schema, so discover the
-- operator class location instead of assuming it is in public or extensions.
do $$
declare
  trigram_schema text;
begin
  select namespace.nspname
  into trigram_schema
  from pg_opclass operator_class
  join pg_namespace namespace on namespace.oid = operator_class.opcnamespace
  join pg_am access_method on access_method.oid = operator_class.opcmethod
  where operator_class.opcname = 'gin_trgm_ops'
    and access_method.amname = 'gin'
  limit 1;

  if trigram_schema is null then
    raise exception 'pg_trgm gin_trgm_ops operator class was not found';
  end if;

  execute format(
    'create index if not exists candidate_profiles_search_text_trgm_idx
     on public.candidate_profiles using gin (search_text %I.gin_trgm_ops)',
    trigram_schema
  );
  execute format(
    'create index if not exists jobs_search_text_trgm_idx
     on public.jobs using gin (search_text %I.gin_trgm_ops)
     where status = %L',
    trigram_schema,
    'published'
  );
end;
$$;

create index if not exists jobs_published_page_idx
  on public.jobs (created_at desc, id desc)
  where status = 'published';

create index if not exists candidate_profiles_updated_page_idx
  on public.candidate_profiles (updated_at desc, user_id desc);

create index if not exists candidate_profiles_province_idx
  on public.candidate_profiles (lower(province));

create index if not exists candidate_profiles_work_type_idx
  on public.candidate_profiles (work_type);

create index if not exists candidate_profiles_availability_idx
  on public.candidate_profiles (availability);

-- Aggregated options avoid transferring up to 1,000 candidate rows to the
-- browser just to construct dropdowns and a directory count.
create or replace function public.get_candidate_search_options()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() and not exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role = 'hr'
      and viewer.can_search_candidates = true
  ) then
    raise exception 'صلاحية البحث عن الملفات غير مفعلة لهذا الحساب';
  end if;

  select jsonb_build_object(
    'total', count(*)::integer,
    'specializations', coalesce(to_jsonb(array_agg(
      distinct nullif(btrim(specialization), '')
      order by nullif(btrim(specialization), '')
    ) filter (where nullif(btrim(specialization), '') is not null)), '[]'::jsonb),
    'provinces', coalesce(to_jsonb(array_agg(
      distinct nullif(btrim(province), '')
      order by nullif(btrim(province), '')
    ) filter (where nullif(btrim(province), '') is not null)), '[]'::jsonb),
    'cities', coalesce(to_jsonb(array_agg(
      distinct nullif(btrim(city), '')
      order by nullif(btrim(city), '')
    ) filter (where nullif(btrim(city), '') is not null)), '[]'::jsonb),
    'workTypes', coalesce(to_jsonb(array_agg(
      distinct nullif(btrim(work_type), '')
      order by nullif(btrim(work_type), '')
    ) filter (where nullif(btrim(work_type), '') is not null)), '[]'::jsonb),
    'availabilities', coalesce(to_jsonb(array_agg(
      distinct nullif(btrim(availability), '')
      order by nullif(btrim(availability), '')
    ) filter (where nullif(btrim(availability), '') is not null)), '[]'::jsonb),
    'experienceYears', coalesce(to_jsonb(array_agg(
      distinct experience_years order by experience_years
    ) filter (where experience_years is not null)), '[]'::jsonb),
    'skills', (
      select coalesce(jsonb_agg(skill_value order by skill_value), '[]'::jsonb)
      from (
        select distinct nullif(btrim(skill), '') as skill_value
        from public.candidate_profiles candidate
        cross join lateral unnest(candidate.skills) as item(skill)
        where nullif(btrim(skill), '') is not null
      ) distinct_skills
    )
  )
  into result
  from public.candidate_profiles;

  return result;
end;
$$;

revoke all on function public.get_candidate_search_options() from public, anon;
grant execute on function public.get_candidate_search_options() to authenticated;

-- Search and filter inside PostgreSQL, then return only the next 10 results.
-- The cursor uses the complete stable ordering tuple so pages do not overlap.
create or replace function public.search_candidate_profiles_page(
  p_keyword text default null,
  p_specialization text default null,
  p_province text default null,
  p_city text default null,
  p_min_experience numeric default null,
  p_work_type text default null,
  p_skill text default null,
  p_availability text default null,
  p_remote_available boolean default null,
  p_after_relevance integer default null,
  p_after_updated_at timestamptz default null,
  p_after_user_id uuid default null,
  p_limit integer default 11
)
returns table (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  headline text,
  specialization text,
  province text,
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
declare
  keyword_value text := nullif(lower(btrim(coalesce(p_keyword, ''))), '');
  keyword_pattern text;
begin
  if not public.is_admin() and not exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role = 'hr'
      and viewer.can_search_candidates = true
  ) then
    raise exception 'صلاحية البحث عن الملفات غير مفعلة لهذا الحساب';
  end if;

  if p_after_user_id is not null and (p_after_relevance is null or p_after_updated_at is null) then
    raise exception 'مؤشر الصفحة غير مكتمل';
  end if;

  keyword_pattern := '%' ||
    replace(replace(replace(coalesce(keyword_value, ''), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_')
    || '%';

  return query
  with matching_candidates as (
    select
      candidate.*,
      case when keyword_value is null then 0 else 10 end::integer as match_relevance
    from public.candidate_profiles candidate
    where
      (keyword_value is null or candidate.search_text like keyword_pattern escape E'\\')
      and (nullif(btrim(coalesce(p_specialization, '')), '') is null
        or lower(candidate.specialization) = lower(btrim(p_specialization)))
      and (nullif(btrim(coalesce(p_province, '')), '') is null
        or lower(candidate.province) = lower(btrim(p_province)))
      and (nullif(btrim(coalesce(p_city, '')), '') is null
        or lower(candidate.city) = lower(btrim(p_city)))
      and (p_min_experience is null or candidate.experience_years >= p_min_experience)
      and (nullif(btrim(coalesce(p_work_type, '')), '') is null
        or candidate.work_type = btrim(p_work_type))
      and (nullif(btrim(coalesce(p_skill, '')), '') is null
        or btrim(p_skill) = any(candidate.skills))
      and (nullif(btrim(coalesce(p_availability, '')), '') is null
        or candidate.availability = btrim(p_availability))
      and (p_remote_available is null or candidate.remote_available = p_remote_available)
  )
  select
    candidate.user_id,
    candidate.full_name,
    candidate.email,
    candidate.phone,
    candidate.headline,
    candidate.specialization,
    candidate.province,
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
    candidate.match_relevance
  from matching_candidates candidate
  where p_after_user_id is null
    or (candidate.match_relevance, candidate.updated_at, candidate.user_id)
      < (p_after_relevance, p_after_updated_at, p_after_user_id)
  order by candidate.match_relevance desc, candidate.updated_at desc, candidate.user_id desc
  limit least(greatest(coalesce(p_limit, 11), 1), 51);
end;
$$;

revoke all on function public.search_candidate_profiles_page(
  text, text, text, text, numeric, text, text, text, boolean,
  integer, timestamptz, uuid, integer
) from public, anon;
grant execute on function public.search_candidate_profiles_page(
  text, text, text, text, numeric, text, text, text, boolean,
  integer, timestamptz, uuid, integer
) to authenticated;

-- Cities are returned as a small aggregate, not one row per published job.
create or replace function public.get_public_job_filter_options()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'provinces',
    coalesce((
      select jsonb_agg(province_value order by province_value)
      from (
        select distinct nullif(btrim(province), '') as province_value
        from public.jobs
        where status = 'published'
          and nullif(btrim(province), '') is not null
      ) public_provinces
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_public_job_filter_options() from public;
grant execute on function public.get_public_job_filter_options() to anon, authenticated;