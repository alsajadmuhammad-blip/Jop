-- Run in Supabase SQL Editor after schema.sql and platform-features.sql.
-- Replaces the quick-posting/deadline policies and approval function.
-- Keeps optional quick-ad deadlines, direct applications, and the original
-- signed-in publisher when an administrator approves a job request.

begin;

alter table public.jobs
  add column if not exists internal_applications boolean not null default false;

alter table public.job_requests
  add column if not exists internal_applications boolean not null default false;

alter table public.job_requests
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- A quick request can omit contact details, including when the publisher
-- enables in-platform applications instead of publishing an email/phone.
drop policy if exists "public submits job requests" on public.job_requests;
create policy "public submits job requests"
on public.job_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and (
    ad_type = 'quick'
    or contact_email is not null
    or contact_whatsapp is not null
  )
  and (created_by is null or created_by = auth.uid())
);

-- Pending quick requests may omit a date; approval assigns 15 days from that
-- approval date. Detailed requests and linked published jobs keep a date.
alter table public.job_requests
  drop constraint if exists job_requests_deadline_required_check;

alter table public.job_requests
  add constraint job_requests_deadline_required_check
  check (
    (status = 'pending' and ad_type = 'quick' and deadline is null)
    or status not in ('pending', 'approved')
    or deadline is not null
    or (status = 'approved' and approved_job_id is null)
  ) not valid;

create or replace function public.enforce_job_request_deadline()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  baghdad_today date := (now() at time zone 'Asia/Baghdad')::date;
begin
  if new.status = 'pending'
     and new.ad_type = 'quick'
     and new.deadline is null then
    return new;
  end if;

  if new.status = 'approved'
     and new.approved_job_id is null
     and new.deadline is null then
    return new;
  end if;

  if new.status in ('pending', 'approved')
     and (new.deadline is null or new.deadline < baghdad_today) then
    raise exception 'يجب تحديد آخر موعد صالح للتقديم قبل إرسال الطلب أو الموافقة عليه';
  end if;

  return new;
end;
$$;

drop trigger if exists job_requests_enforce_deadline on public.job_requests;
drop trigger if exists job_requests_enforce_deadline_insert on public.job_requests;
drop trigger if exists job_requests_enforce_deadline_update on public.job_requests;

create trigger job_requests_enforce_deadline_insert
before insert on public.job_requests
for each row execute function public.enforce_job_request_deadline();

create trigger job_requests_enforce_deadline_update
before update of status, deadline on public.job_requests
for each row execute function public.enforce_job_request_deadline();

-- Let a signed-in publisher see their own expired/closed jobs in the
-- applications inbox without making those jobs public again.
drop policy if exists "public reads published jobs" on public.jobs;
create policy "public reads published jobs"
on public.jobs
for select
using (
  public.is_admin()
  or created_by = auth.uid()
  or (
    status = 'published'
    and deadline >= (now() at time zone 'Asia/Baghdad')::date
  )
);

drop policy if exists "admins and assigned hr read applications" on public.applications;
create policy "admins and assigned hr read applications"
on public.applications
for select
to authenticated
using (
  public.is_admin()
  or (
    job_id is not null
    and exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
        and jobs.created_by = auth.uid()
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

create or replace function public.approve_job_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.job_requests%rowtype;
  new_job_id uuid;
  baghdad_today date := (now() at time zone 'Asia/Baghdad')::date;
  published_deadline date;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح بالموافقة على طلبات الوظائف';
  end if;

  select *
  into request_row
  from public.job_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'طلب نشر الوظيفة غير موجود';
  end if;

  if request_row.status <> 'pending' then
    raise exception 'تمت مراجعة هذا الطلب مسبقاً';
  end if;

  published_deadline := case
    when request_row.ad_type = 'quick'
      then coalesce(request_row.deadline, baghdad_today + 15)
    else request_row.deadline
  end;

  if published_deadline is null or published_deadline < baghdad_today then
    raise exception 'يجب تحديد آخر موعد صالح للتقديم قبل الموافقة على الطلب';
  end if;

  insert into public.jobs (
    title,
    company_name,
    ad_type,
    category,
    province,
    city,
    job_type,
    description,
    requirements,
    salary_range,
    contact_email,
    contact_whatsapp,
    internal_applications,
    status,
    deadline,
    created_by
  )
  values (
    request_row.title,
    request_row.company_name,
    request_row.ad_type,
    request_row.category,
    request_row.province,
    request_row.city,
    request_row.job_type,
    request_row.description,
    request_row.requirements,
    request_row.salary_range,
    request_row.contact_email,
    request_row.contact_whatsapp,
    coalesce(request_row.internal_applications, false),
    'published',
    published_deadline,
    coalesce(request_row.created_by, auth.uid())
  )
  returning id into new_job_id;

  update public.job_requests
  set status = 'approved',
      deadline = published_deadline,
      approved_job_id = new_job_id,
      reviewed_at = now()
  where id = p_request_id;

  return new_job_id;
end;
$$;

revoke all on function public.approve_job_request(uuid) from public;
grant execute on function public.approve_job_request(uuid) to authenticated;

-- Make the publisher account able to review the submissions on its own jobs.
drop policy if exists "admins and hr update applications" on public.applications;
drop policy if exists "admins and assigned hr update applications" on public.applications;
create policy "admins and hr update applications"
on public.applications
for update
to authenticated
using (
  public.is_admin()
  or (
    job_id is not null
    and exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
        and jobs.created_by = auth.uid()
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
)
with check (
  public.is_admin()
  or (
    job_id is not null
    and exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
        and jobs.created_by = auth.uid()
    )
  )
  or public.is_hr()
);

create index if not exists applications_job_created_at_idx
  on public.applications(job_id, created_at desc)
  where job_id is not null;

commit;
