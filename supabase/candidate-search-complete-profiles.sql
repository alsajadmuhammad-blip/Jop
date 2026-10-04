-- Run once in the Supabase SQL Editor on existing projects after
-- search-pagination.sql has already been applied.
-- Replaces only the candidate-search helper and RPCs; safe to run again.
-- Keep these definitions in sync with search-pagination.sql.

create or replace function public.candidate_profile_is_complete(
  p_profile public.candidate_profiles
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    nullif(btrim((p_profile).full_name), '') is not null
    and nullif(btrim((p_profile).headline), '') is not null
    and nullif(btrim((p_profile).specialization), '') is not null
    and nullif(btrim((p_profile).province), '') is not null
    and nullif(btrim((p_profile).city), '') is not null
    and coalesce(cardinality((p_profile).skills), 0) > 0
    and nullif(btrim((p_profile).experience_details), '') is not null
    and nullif(btrim((p_profile).education), '') is not null
    and nullif(btrim((p_profile).summary), '') is not null;
$$;

revoke all on function public.candidate_profile_is_complete(public.candidate_profiles) from public, anon;
grant execute on function public.candidate_profile_is_complete(public.candidate_profiles) to authenticated;

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
        from public.candidate_profiles skill_owner
        cross join lateral unnest(skill_owner.skills) as item(skill)
        where public.candidate_profile_is_complete(skill_owner)
          and nullif(btrim(skill), '') is not null
      ) distinct_skills
    )
  )
  into result
  from public.candidate_profiles candidate
  where public.candidate_profile_is_complete(candidate);

  return result;
end;
$$;

revoke all on function public.get_candidate_search_options() from public, anon;
grant execute on function public.get_candidate_search_options() to authenticated;

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
      public.candidate_profile_is_complete(candidate)
      and (keyword_value is null or candidate.search_text like keyword_pattern escape E'\\')
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