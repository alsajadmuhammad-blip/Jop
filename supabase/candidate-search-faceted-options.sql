-- HR/admin search filter options that respond to the other active filters.
-- Apply after search-pagination.sql (and candidate-search-complete-profiles.sql when used).

create or replace function public.get_candidate_search_filter_options(
  p_keyword text default null,
  p_specialization text default null,
  p_province text default null,
  p_city text default null,
  p_min_experience numeric default null,
  p_work_type text default null,
  p_skill text default null,
  p_availability text default null,
  p_remote_available boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
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

  keyword_pattern := '%' ||
    replace(replace(replace(coalesce(keyword_value, ''), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_')
    || '%';

  with scoped_candidates as materialized (
    select
      candidate.*,
      (
        keyword_value is null
        or candidate.search_text like keyword_pattern escape E'\\'
      ) as matches_keyword,
      (
        nullif(btrim(coalesce(p_specialization, '')), '') is null
        or lower(btrim(candidate.specialization)) = lower(btrim(p_specialization))
      ) as matches_specialization,
      (
        nullif(btrim(coalesce(p_province, '')), '') is null
        or lower(btrim(candidate.province)) = lower(btrim(p_province))
      ) as matches_province,
      (
        nullif(btrim(coalesce(p_city, '')), '') is null
        or lower(btrim(candidate.city)) = lower(btrim(p_city))
      ) as matches_city,
      (
        p_min_experience is null
        or candidate.experience_years >= p_min_experience
      ) as matches_experience,
      (
        nullif(btrim(coalesce(p_work_type, '')), '') is null
        or lower(btrim(candidate.work_type)) = lower(btrim(p_work_type))
      ) as matches_work_type,
      (
        nullif(btrim(coalesce(p_skill, '')), '') is null
        or exists (
          select 1
          from unnest(coalesce(candidate.skills, '{}'::text[])) as candidate_skill(value)
          where lower(btrim(candidate_skill.value)) = lower(btrim(p_skill))
        )
      ) as matches_skill,
      (
        nullif(btrim(coalesce(p_availability, '')), '') is null
        or lower(btrim(candidate.availability)) = lower(btrim(p_availability))
      ) as matches_availability,
      (
        p_remote_available is null
        or candidate.remote_available = p_remote_available
      ) as matches_remote
    from public.candidate_profiles candidate
    where public.candidate_profile_is_complete(candidate)
  )
  select jsonb_build_object(
    'total', (
      select count(*)::integer
      from scoped_candidates candidate
      where candidate.matches_keyword
        and candidate.matches_specialization
        and candidate.matches_province
        and candidate.matches_city
        and candidate.matches_experience
        and candidate.matches_work_type
        and candidate.matches_skill
        and candidate.matches_availability
        and candidate.matches_remote
    ),
    'specializations', (
      select coalesce(jsonb_agg(option_value order by option_value), '[]'::jsonb)
      from (
        select distinct nullif(btrim(candidate.specialization), '') as option_value
        from scoped_candidates candidate
        where candidate.matches_keyword
          and candidate.matches_province
          and candidate.matches_city
          and candidate.matches_experience
          and candidate.matches_work_type
          and candidate.matches_skill
          and candidate.matches_availability
          and candidate.matches_remote
          and nullif(btrim(candidate.specialization), '') is not null
      ) available
    ),
    'provinces', (
      select coalesce(jsonb_agg(option_value order by option_value), '[]'::jsonb)
      from (
        select distinct nullif(btrim(candidate.province), '') as option_value
        from scoped_candidates candidate
        where candidate.matches_keyword
          and candidate.matches_specialization
          and candidate.matches_city
          and candidate.matches_experience
          and candidate.matches_work_type
          and candidate.matches_skill
          and candidate.matches_availability
          and candidate.matches_remote
          and nullif(btrim(candidate.province), '') is not null
      ) available
    ),
    'cities', (
      select coalesce(jsonb_agg(option_value order by option_value), '[]'::jsonb)
      from (
        select distinct nullif(btrim(candidate.city), '') as option_value
        from scoped_candidates candidate
        where candidate.matches_keyword
          and candidate.matches_specialization
          and candidate.matches_province
          and candidate.matches_experience
          and candidate.matches_work_type
          and candidate.matches_skill
          and candidate.matches_availability
          and candidate.matches_remote
          and nullif(btrim(candidate.city), '') is not null
      ) available
    ),
    'workTypes', (
      select coalesce(jsonb_agg(option_value order by option_value), '[]'::jsonb)
      from (
        select distinct nullif(btrim(candidate.work_type), '') as option_value
        from scoped_candidates candidate
        where candidate.matches_keyword
          and candidate.matches_specialization
          and candidate.matches_province
          and candidate.matches_city
          and candidate.matches_experience
          and candidate.matches_skill
          and candidate.matches_availability
          and candidate.matches_remote
          and nullif(btrim(candidate.work_type), '') is not null
      ) available
    ),
    'availabilities', (
      select coalesce(jsonb_agg(option_value order by option_value), '[]'::jsonb)
      from (
        select distinct nullif(btrim(candidate.availability), '') as option_value
        from scoped_candidates candidate
        where candidate.matches_keyword
          and candidate.matches_specialization
          and candidate.matches_province
          and candidate.matches_city
          and candidate.matches_experience
          and candidate.matches_work_type
          and candidate.matches_skill
          and candidate.matches_remote
          and nullif(btrim(candidate.availability), '') is not null
      ) available
    ),
    'experienceYears', (
      select coalesce(jsonb_agg(option_value order by option_value), '[]'::jsonb)
      from (
        select distinct candidate.experience_years as option_value
        from scoped_candidates candidate
        where candidate.matches_keyword
          and candidate.matches_specialization
          and candidate.matches_province
          and candidate.matches_city
          and candidate.matches_work_type
          and candidate.matches_skill
          and candidate.matches_availability
          and candidate.matches_remote
          and candidate.experience_years is not null
      ) available
    ),
    'skills', (
      select coalesce(jsonb_agg(option_value order by option_value), '[]'::jsonb)
      from (
        select distinct nullif(btrim(candidate_skill.value), '') as option_value
        from scoped_candidates candidate
        cross join lateral unnest(coalesce(candidate.skills, '{}'::text[])) as candidate_skill(value)
        where candidate.matches_keyword
          and candidate.matches_specialization
          and candidate.matches_province
          and candidate.matches_city
          and candidate.matches_experience
          and candidate.matches_work_type
          and candidate.matches_availability
          and candidate.matches_remote
          and nullif(btrim(candidate_skill.value), '') is not null
      ) available
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.get_candidate_search_filter_options(
  text, text, text, text, numeric, text, text, text, boolean
) from public, anon;
grant execute on function public.get_candidate_search_filter_options(
  text, text, text, text, numeric, text, text, text, boolean
) to authenticated;
