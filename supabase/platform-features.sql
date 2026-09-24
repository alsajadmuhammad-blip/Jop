-- مسار: migration for internal applications, saved jobs, and candidate location.
-- Run after schema.sql and candidate-search.sql.

alter table public.candidate_profiles add column if not exists province text not null default '';
alter table public.jobs add column if not exists internal_applications boolean not null default false;
alter table public.job_requests add column if not exists internal_applications boolean not null default false;
alter table public.job_requests add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.applications add column if not exists candidate_id uuid references auth.users(id) on delete set null;
alter table public.applications alter column cv_path drop not null;

alter table public.applications drop constraint if exists application_target_check;
alter table public.applications add constraint application_target_check check (
  (job_id is not null and cv_request_id is null)
  or (job_id is null and cv_request_id is not null)
);

create table if not exists public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists saved_jobs_user_saved_at_idx
  on public.saved_jobs(user_id, saved_at desc);

create or replace function public.approve_job_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.job_requests%rowtype;
  new_job_id uuid;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح بالموافقة على طلبات الوظائف';
  end if;

  select * into request_row from public.job_requests
  where id = p_request_id for update;

  if not found then raise exception 'طلب نشر الوظيفة غير موجود'; end if;
  if request_row.status <> 'pending' then raise exception 'تمت مراجعة هذا الطلب مسبقاً'; end if;

  insert into public.jobs (
    title, company_name, category, city, job_type, description, requirements,
    salary_range, contact_email, contact_whatsapp, internal_applications,
    status, deadline, created_by
  )
  values (
    request_row.title, request_row.company_name, request_row.category, request_row.city,
    request_row.job_type, request_row.description, request_row.requirements,
    request_row.salary_range, request_row.contact_email, request_row.contact_whatsapp,
    request_row.internal_applications, 'published', request_row.deadline,
    coalesce(request_row.created_by, auth.uid())
  )
  returning id into new_job_id;

  update public.job_requests
  set status = 'approved', approved_job_id = new_job_id, reviewed_at = now()
  where id = p_request_id;
  return new_job_id;
end;
$$;

alter table public.saved_jobs enable row level security;

drop policy if exists "users manage own saved jobs" on public.saved_jobs;
create policy "users manage own saved jobs"
on public.saved_jobs for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "public submits applications" on public.applications;
create policy "candidates submit applications"
on public.applications for insert to authenticated
with check (
  candidate_id = auth.uid()
  and (
    (
      job_id is not null
      and cv_request_id is null
      and exists (
        select 1 from public.jobs
        where jobs.id = applications.job_id
          and jobs.status = 'published'
          and jobs.internal_applications = true
      )
    )
    or (job_id is null and cv_request_id is not null)
  )
);

drop policy if exists "admins and assigned hr read applications" on public.applications;
create policy "admins and assigned hr read applications"
on public.applications for select to authenticated
using (
  public.is_admin()
  or (
    job_id is not null
    and exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id and jobs.created_by = auth.uid()
    )
  )
  or (
    cv_request_id is not null
    and exists (
      select 1
      from public.cv_requests request
      where request.id = applications.cv_request_id
        and public.is_hr_for_organization(request.organization_name)
    )
  )
);

drop policy if exists "admins and hr update applications" on public.applications;
create policy "admins and hr update applications"
on public.applications for update to authenticated
using (
  public.is_admin()
  or (
    job_id is not null
    and exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id and jobs.created_by = auth.uid()
    )
  )
  or (
    cv_request_id is not null
    and exists (
      select 1 from public.cv_requests request
      where request.id = applications.cv_request_id
        and public.is_hr_for_organization(request.organization_name)
    )
  )
)
with check (public.is_admin() or public.is_hr());

drop policy if exists "public submits job requests" on public.job_requests;
create policy "public submits job requests"
on public.job_requests for insert to anon, authenticated
with check (
  status = 'pending'
  and (contact_email is not null or contact_whatsapp is not null)
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists "requesters read own job requests" on public.job_requests;
create policy "requesters read own job requests"
on public.job_requests for select to authenticated
using (created_by = auth.uid() or public.is_admin());