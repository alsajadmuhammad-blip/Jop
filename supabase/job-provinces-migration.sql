-- Add a dedicated governorate to job listings and publication requests.
-- Run after platform-features.sql and search-pagination.sql.

alter table public.jobs
  add column if not exists province text not null default '';

alter table public.job_requests
  add column if not exists province text not null default '';

-- Preserve recognizable legacy locations as their matching governorate.
-- Values that are not clearly a governorate/city are left blank for manual review.
update public.jobs
set province = case
  when lower(btrim(city)) in ('بغداد', 'مدينة الصدر', 'الكرخ', 'الرصافة') then 'بغداد'
  when lower(btrim(city)) in ('البصرة', 'الزبير', 'الفاو', 'القرنة', 'شط العرب') then 'البصرة'
  when lower(btrim(city)) in ('نينوى', 'الموصل', 'تلعفر', 'سنجار') then 'نينوى'
  when lower(btrim(city)) in ('أربيل', 'اربيل', 'شَقْلاوة', 'شقلاوة', 'سوران') then 'أربيل'
  when lower(btrim(city)) in ('السليمانية', 'سليمانية', 'رانية', 'كلار') then 'السليمانية'
  when lower(btrim(city)) in ('دهوك', 'زاخو') then 'دهوك'
  when lower(btrim(city)) in ('كركوك', 'الحويجة') then 'كركوك'
  when lower(btrim(city)) in ('ديالى', 'بعقوبة', 'خانقين', 'المقدادية') then 'ديالى'
  when lower(btrim(city)) in ('الأنبار', 'الانبار', 'الرمادي', 'الفلوجة', 'حديثة', 'القائم') then 'الأنبار'
  when lower(btrim(city)) in ('بابل', 'الحلة', 'المسيب', 'المحاويل') then 'بابل'
  when lower(btrim(city)) in ('كربلاء', 'كربلا', 'الهندية') then 'كربلاء'
  when lower(btrim(city)) in ('النجف', 'الكوفة') then 'النجف'
  when lower(btrim(city)) in ('واسط', 'الكوت', 'العزيزية') then 'واسط'
  when lower(btrim(city)) in ('صلاح الدين', 'تكريت', 'سامراء', 'بلد') then 'صلاح الدين'
  when lower(btrim(city)) in ('ذي قار', 'الناصرية', 'الشطرة') then 'ذي قار'
  when lower(btrim(city)) in ('ميسان', 'العمارة', 'المجر') then 'ميسان'
  when lower(btrim(city)) in ('المثنى', 'السماوة', 'الرميثة') then 'المثنى'
  when lower(btrim(city)) in ('القادسية', 'الديوانية', 'عفك') then 'القادسية'
  when lower(btrim(city)) = 'حلبجة' then 'حلبجة'
  else province
end
where btrim(province) = ''
  and nullif(btrim(city), '') is not null;

update public.job_requests
set province = case
  when lower(btrim(city)) in ('بغداد', 'مدينة الصدر', 'الكرخ', 'الرصافة') then 'بغداد'
  when lower(btrim(city)) in ('البصرة', 'الزبير', 'الفاو', 'القرنة', 'شط العرب') then 'البصرة'
  when lower(btrim(city)) in ('نينوى', 'الموصل', 'تلعفر', 'سنجار') then 'نينوى'
  when lower(btrim(city)) in ('أربيل', 'اربيل', 'شَقْلاوة', 'شقلاوة', 'سوران') then 'أربيل'
  when lower(btrim(city)) in ('السليمانية', 'سليمانية', 'رانية', 'كلار') then 'السليمانية'
  when lower(btrim(city)) in ('دهوك', 'زاخو') then 'دهوك'
  when lower(btrim(city)) in ('كركوك', 'الحويجة') then 'كركوك'
  when lower(btrim(city)) in ('ديالى', 'بعقوبة', 'خانقين', 'المقدادية') then 'ديالى'
  when lower(btrim(city)) in ('الأنبار', 'الانبار', 'الرمادي', 'الفلوجة', 'حديثة', 'القائم') then 'الأنبار'
  when lower(btrim(city)) in ('بابل', 'الحلة', 'المسيب', 'المحاويل') then 'بابل'
  when lower(btrim(city)) in ('كربلاء', 'كربلا', 'الهندية') then 'كربلاء'
  when lower(btrim(city)) in ('النجف', 'الكوفة') then 'النجف'
  when lower(btrim(city)) in ('واسط', 'الكوت', 'العزيزية') then 'واسط'
  when lower(btrim(city)) in ('صلاح الدين', 'تكريت', 'سامراء', 'بلد') then 'صلاح الدين'
  when lower(btrim(city)) in ('ذي قار', 'الناصرية', 'الشطرة') then 'ذي قار'
  when lower(btrim(city)) in ('ميسان', 'العمارة', 'المجر') then 'ميسان'
  when lower(btrim(city)) in ('المثنى', 'السماوة', 'الرميثة') then 'المثنى'
  when lower(btrim(city)) in ('القادسية', 'الديوانية', 'عفك') then 'القادسية'
  when lower(btrim(city)) = 'حلبجة' then 'حلبجة'
  else province
end
where btrim(province) = ''
  and nullif(btrim(city), '') is not null;

create index if not exists jobs_published_province_created_at_idx
  on public.jobs (province, created_at desc, id desc)
  where status = 'published';

-- Include governorates in public keyword search.
alter table public.jobs
  add column if not exists search_text text not null default '';

create or replace function public.refresh_job_search_text()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_text := lower(concat_ws(
    ' ',
    new.title,
    new.company_name,
    new.province,
    new.city,
    new.category,
    new.job_type
  ));
  return new;
end;
$$;

drop trigger if exists jobs_search_text on public.jobs;
create trigger jobs_search_text
before insert or update of title, company_name, province, city, category, job_type
on public.jobs
for each row execute function public.refresh_job_search_text();

update public.jobs
set search_text = lower(concat_ws(' ', title, company_name, province, city, category, job_type))
where search_text is distinct from lower(concat_ws(' ', title, company_name, province, city, category, job_type));

-- Preserve the existing approval flow while copying the requested governorate.
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
    request_row.internal_applications,
    'published',
    request_row.deadline,
    coalesce(request_row.created_by, auth.uid())
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

-- The bar only lists governorates that currently have published jobs.
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
          and nullif(btrim(province), '') is not null
      ) public_provinces
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_public_job_filter_options() from public;
grant execute on function public.get_public_job_filter_options() to anon, authenticated;