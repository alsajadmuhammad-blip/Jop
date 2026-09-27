-- مسار: إضافة نوع الإعلان السريع أو المفصل للوظائف وطلبات النشر.
-- نفّذ هذا الملف بعد schema.sql و platform-features.sql على قاعدة موجودة.

alter table public.jobs
  add column if not exists ad_type text not null default 'detailed';

alter table public.jobs
  drop constraint if exists jobs_ad_type_check;

alter table public.jobs
  add constraint jobs_ad_type_check
  check (ad_type in ('detailed', 'quick')) not valid;

alter table public.job_requests
  add column if not exists ad_type text not null default 'detailed';

alter table public.job_requests
  drop constraint if exists job_requests_ad_type_check;

alter table public.job_requests
  add constraint job_requests_ad_type_check
  check (ad_type in ('detailed', 'quick')) not valid;

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

  select * into request_row
  from public.job_requests
  where id = p_request_id
  for update;

  if not found then raise exception 'طلب نشر الوظيفة غير موجود'; end if;
  if request_row.status <> 'pending' then raise exception 'تمت مراجعة هذا الطلب مسبقاً'; end if;

  insert into public.jobs (
    title, company_name, ad_type, category, city, job_type, description, requirements,
    salary_range, contact_email, contact_whatsapp, internal_applications,
    status, deadline, created_by
  )
  values (
    request_row.title, request_row.company_name, request_row.ad_type, request_row.category,
    request_row.city, request_row.job_type, request_row.description, request_row.requirements,
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

revoke all on function public.approve_job_request(uuid) from public;
grant execute on function public.approve_job_request(uuid) to authenticated;