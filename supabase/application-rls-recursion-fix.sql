-- Fix the applications RLS recursion caused by candidate profile policies.
-- Run after candidate-search.sql, platform-features.sql, and
-- application-prevent-duplicates.sql in the Supabase SQL editor.

create or replace function public.candidate_profile_exists()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.candidate_profiles
    where user_id = auth.uid()
  );
$$;

revoke all on function public.candidate_profile_exists() from public;
grant execute on function public.candidate_profile_exists() to authenticated;

alter table public.applications enable row level security;

drop policy if exists "public submits applications" on public.applications;
drop policy if exists "candidates submit profile applications" on public.applications;
drop policy if exists "candidates submits profile applications" on public.applications;
drop policy if exists "candidates submit applications" on public.applications;
drop function if exists public.candidate_profile_exists(uuid);

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
      and public.candidate_profile_exists()
      and exists (
        select 1
        from public.jobs job
        where job.id = applications.job_id
          and job.status = 'published'
          and job.internal_applications = true
      )
    )
    or (
      job_id is null
      and cv_request_id is not null
      and cv_path is null
      and public.candidate_profile_exists()
    )
  )
);

drop policy if exists "candidates read own applications" on public.applications;
create policy "candidates read own applications"
on public.applications
for select
to authenticated
using (candidate_id = auth.uid());