-- Allow an HR account to open the professional profile of a candidate
-- who submitted an internal application to that HR organization's request.
-- Run after schema.sql and candidate-search.sql.

drop policy if exists "assigned hr reads applicant profiles" on public.candidate_profiles;
create policy "assigned hr reads applicant profiles"
on public.candidate_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.applications application
    join public.cv_requests request on request.id = application.cv_request_id
    where application.candidate_id = candidate_profiles.user_id
      and public.is_hr_for_organization(request.organization_name)
  )
);

grant select on public.candidate_profiles to authenticated;