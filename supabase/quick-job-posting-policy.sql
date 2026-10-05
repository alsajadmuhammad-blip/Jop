-- Run once in Supabase SQL Editor after the job publishing and province
-- migrations. Quick ads may omit a contact method and expire 15 days after
-- approval/publication; detailed ads keep their explicit deadline and contact.

begin;

alter table public.jobs
  drop constraint if exists job_contact_method_check;
alter table public.jobs
  add constraint job_contact_method_check
  check (
    ad_type = 'quick'
    or contact_email is not null
    or contact_whatsapp is not null
  ) not valid;

alter table public.job_requests
  drop constraint if exists job_request_contact_method_check;
alter table public.job_requests
  drop constraint if exists job_requests_contact_method_check;
alter table public.job_requests
  add constraint job_request_contact_method_check
  check (
    ad_type = 'quick'
    or contact_email is not null
    or contact_whatsapp is not null
  ) not valid;

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
    when request_row.ad_type = 'quick' then baghdad_today + 15
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
    'published',
    published_deadline,
    auth.uid()
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

commit;
