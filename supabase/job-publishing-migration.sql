-- مسار: إضافة بيانات التواصل وطلبات نشر الوظائف إلى قاعدة موجودة
-- نفّذ هذا الملف مرة واحدة في Supabase SQL Editor بعد تطبيق schema.sql الأساسي.

do $$ begin
  create type public.job_request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

alter table public.jobs add column if not exists contact_email text;
alter table public.jobs add column if not exists contact_whatsapp text;
alter table public.jobs drop constraint if exists job_contact_method_check;
alter table public.jobs add constraint job_contact_method_check
  check (contact_email is not null or contact_whatsapp is not null) not valid;

create table if not exists public.job_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text not null,
  contact_name text not null,
  contact_email text,
  contact_whatsapp text,
  category text not null default 'عام',
  city text not null default 'العراق',
  job_type text not null default 'دوام كامل',
  description text not null,
  requirements text[] not null default '{}',
  salary_range text,
  deadline date,
  status public.job_request_status not null default 'pending',
  approved_job_id uuid references public.jobs(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint job_request_contact_method_check
    check (contact_email is not null or contact_whatsapp is not null)
);

create index if not exists job_requests_status_created_at_idx
  on public.job_requests(status, created_at desc);

alter table public.job_requests enable row level security;

drop policy if exists "public submits job requests" on public.job_requests;
create policy "public submits job requests"
on public.job_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and (contact_email is not null or contact_whatsapp is not null)
);

drop policy if exists "admins manage job requests" on public.job_requests;
create policy "admins manage job requests"
on public.job_requests
for all
using (public.is_admin())
with check (public.is_admin());

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

  insert into public.jobs (
    title, company_name, category, city, job_type, description, requirements,
    salary_range, contact_email, contact_whatsapp, status, deadline, created_by
  )
  values (
    request_row.title, request_row.company_name, request_row.category, request_row.city,
    request_row.job_type, request_row.description, request_row.requirements,
    request_row.salary_range, request_row.contact_email, request_row.contact_whatsapp,
    'published', request_row.deadline, auth.uid()
  )
  returning id into new_job_id;

  update public.job_requests
  set status = 'approved',
      approved_job_id = new_job_id,
      reviewed_at = now()
  where id = p_request_id;

  return new_job_id;
end;
$$;

revoke all on function public.approve_job_request(uuid) from public;
grant execute on function public.approve_job_request(uuid) to authenticated;