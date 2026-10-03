-- Run this script in the Supabase SQL Editor.
-- It does not backfill old published jobs without deadlines; they stay hidden
-- until an administrator adds a valid deadline.

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

alter table public.jobs
  drop constraint if exists jobs_deadline_required_check;
alter table public.jobs
  add constraint jobs_deadline_required_check
  check (status <> 'published' or deadline is not null) not valid;

alter table public.job_requests
  drop constraint if exists job_requests_deadline_required_check;
alter table public.job_requests
  add constraint job_requests_deadline_required_check
  check (status not in ('pending', 'approved') or deadline is not null) not valid;

create or replace function public.enforce_published_job_deadline()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  baghdad_today date := (now() at time zone 'Asia/Baghdad')::date;
begin
  if new.status = 'published'
     and (new.deadline is null or new.deadline < baghdad_today) then
    raise exception 'يجب تحديد آخر موعد للتقديم بتاريخ اليوم أو بعده';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_enforce_published_deadline on public.jobs;
create trigger jobs_enforce_published_deadline
before insert or update on public.jobs
for each row execute function public.enforce_published_job_deadline();

create or replace function public.enforce_job_request_deadline()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  baghdad_today date := (now() at time zone 'Asia/Baghdad')::date;
begin
  if new.status in ('pending', 'approved')
     and (new.deadline is null or new.deadline < baghdad_today) then
    raise exception 'يجب تحديد آخر موعد صالح للتقديم قبل إرسال الطلب أو الموافقة عليه';
  end if;

  return new;
end;
$$;

drop trigger if exists job_requests_enforce_deadline on public.job_requests;
create trigger job_requests_enforce_deadline
before insert or update on public.job_requests
for each row execute function public.enforce_job_request_deadline();

-- Keep expired, missing-deadline, and future jobs out of all non-admin reads.
drop policy if exists "public reads published jobs" on public.jobs;
create policy "public reads published jobs"
on public.jobs
for select
using (
  public.is_admin()
  or (
    status = 'published'
    and deadline >= (now() at time zone 'Asia/Baghdad')::date
  )
);

-- Also guard against a client attempting to apply after the deadline.
create or replace function public.enforce_application_job_deadline()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  job_status public.post_status;
  job_deadline date;
  baghdad_today date := (now() at time zone 'Asia/Baghdad')::date;
begin
  if new.job_id is null then
    return new;
  end if;

  select status, deadline
  into job_status, job_deadline
  from public.jobs
  where id = new.job_id;

  if not found
     or job_status <> 'published'
     or job_deadline is null
     or job_deadline < baghdad_today then
    raise exception 'انتهى موعد التقديم لهذه الوظيفة';
  end if;

  return new;
end;
$$;

drop trigger if exists applications_enforce_job_deadline on public.applications;
create trigger applications_enforce_job_deadline
before insert or update of job_id on public.applications
for each row execute function public.enforce_application_job_deadline();

-- The public list is cursor-paginated by created_at/id and filters by deadline.
create index if not exists jobs_public_deadline_created_idx
  on public.jobs (deadline, created_at desc, id desc)
  where status = 'published';

-- Filter choices must match the same public deadline rule as the listing.
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
          and deadline >= (now() at time zone 'Asia/Baghdad')::date
          and nullif(btrim(province), '') is not null
      ) public_provinces
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_public_job_filter_options() from public;
grant execute on function public.get_public_job_filter_options() to anon, authenticated;

-- Close expired jobs every day; delete only after 30 full days beyond the
-- deadline date. Deletion cascades to applications by the existing FK.
create or replace function public.process_expired_jobs()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  baghdad_today date := (now() at time zone 'Asia/Baghdad')::date;
begin
  update public.jobs
  set status = 'closed'
  where status = 'published'
    and deadline < baghdad_today;

  delete from public.jobs
  where status in ('published', 'closed')
    and deadline < baghdad_today - 30;
end;
$$;

revoke all on function public.process_expired_jobs() from public;
grant execute on function public.process_expired_jobs() to postgres;

-- Supabase pg_cron replaces an existing job if the same case-sensitive name
-- is scheduled again, so this remains safe to re-run.
select cron.schedule(
  'iraq-jobs-expire-and-delete',
  '10 0 * * *',
  'select public.process_expired_jobs();'
);