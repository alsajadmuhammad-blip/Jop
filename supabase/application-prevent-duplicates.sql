-- Prevent a candidate from applying to the same internal job more than once.
-- Run after schema.sql, candidate-search.sql, and platform-features.sql.

alter table public.applications enable row level security;

alter table public.applications
  drop constraint if exists application_target_check;

alter table public.applications
  add constraint application_target_check check (
    (
      job_id is not null
      and cv_request_id is null
      and candidate_id is not null
      and cv_path is null
    )
    or (
      job_id is null
      and cv_request_id is not null
      and (
        (candidate_id is not null and cv_path is null)
        or (candidate_id is null and cv_path is not null)
      )
    )
  );

drop policy if exists "public submits applications" on public.applications;
drop policy if exists "candidates submit profile applications" on public.applications;
drop policy if exists "candidates submits profile applications" on public.applications;
drop policy if exists "candidates submit applications" on public.applications;

create policy "candidates submit applications"
on public.applications
for insert
to authenticated
with check (
  candidate_id = auth.uid()
  and (
    (
      job_id is not null
      and cv_request_id is null
      and cv_path is null
      and exists (
        select 1
        from public.jobs
        where jobs.id = applications.job_id
          and jobs.status = 'published'
          and jobs.internal_applications = true
      )
    )
    or (
      job_id is null
      and cv_request_id is not null
      and cv_path is null
      and exists (
        select 1
        from public.candidate_profiles
        where user_id = auth.uid()
      )
    )
  )
);

drop policy if exists "candidates read own applications" on public.applications;
create policy "candidates read own applications"
on public.applications
for select
to authenticated
using (candidate_id = auth.uid());

create unique index if not exists applications_candidate_job_unique_idx
  on public.applications(candidate_id, job_id)
  where candidate_id is not null and job_id is not null;