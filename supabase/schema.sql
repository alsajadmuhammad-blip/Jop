-- مسار: database + RLS + private CV storage
create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('candidate', 'admin', 'hr');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.post_status as enum ('draft', 'published', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_status as enum ('new', 'reviewing', 'shortlisted', 'rejected', 'hired');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'candidate',
  organization text,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references auth.users(id) on delete set null,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text not null,
  category text not null default 'عام',
  city text not null default 'العراق',
  job_type text not null default 'دوام كامل',
  description text not null,
  requirements text[] not null default '{}',
  salary_range text,
  status public.post_status not null default 'draft',
  deadline date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.cv_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  specialization text not null,
  organization_name text not null,
  details text not null,
  status public.post_status not null default 'draft',
  deadline date,
  hr_group_id uuid references public.hr_groups(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  cv_request_id uuid references public.cv_requests(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  cv_path text not null,
  note text,
  status public.application_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint application_target_check check (job_id is null and cv_request_id is not null)
);

alter table public.applications drop constraint if exists application_target_check;
alter table public.applications add constraint application_target_check check (job_id is null and cv_request_id is not null);

create index if not exists jobs_status_created_at_idx on public.jobs(status, created_at desc);
create index if not exists cv_requests_status_created_at_idx on public.cv_requests(status, created_at desc);
create index if not exists applications_created_at_idx on public.applications(created_at desc);

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_hr()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'hr');
$$;

create or replace function public.is_hr_for_organization(target_organization text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'hr'
      and organization is not null
      and lower(trim(organization)) = lower(trim(target_organization))
  );
$$;

alter table public.profiles enable row level security;
alter table public.hr_groups enable row level security;
alter table public.jobs enable row level security;
alter table public.cv_requests enable row level security;
alter table public.applications enable row level security;

drop policy if exists "public profiles are private" on public.profiles;
create policy "users can read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage hr groups" on public.hr_groups;
create policy "admins manage hr groups" on public.hr_groups for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "hr reads own group" on public.hr_groups;
create policy "hr reads own group" on public.hr_groups for select using (user_id = auth.uid());

drop policy if exists "public reads published jobs" on public.jobs;
create policy "public reads published jobs" on public.jobs for select using (status = 'published' or public.is_admin());
drop policy if exists "admins manage jobs" on public.jobs;
create policy "admins manage jobs" on public.jobs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads published cv requests" on public.cv_requests;
create policy "public reads published cv requests" on public.cv_requests for select using (
  status = 'published'
  or public.is_admin()
  or public.is_hr_for_organization(organization_name)
);
drop policy if exists "admins manage cv requests" on public.cv_requests;
create policy "admins manage cv requests" on public.cv_requests for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public submits applications" on public.applications;
create policy "public submits applications" on public.applications for insert with check (job_id is null and cv_request_id is not null);
drop policy if exists "admins and hr read applications" on public.applications;
create policy "admins and assigned hr read applications" on public.applications for select using (
  public.is_admin()
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
create policy "admins and assigned hr update applications" on public.applications for update using (
  public.is_admin()
  or (
    cv_request_id is not null
    and exists (
      select 1
      from public.cv_requests request
      where request.id = applications.cv_request_id
        and public.is_hr_for_organization(request.organization_name)
    )
  )
) with check (public.is_admin() or public.is_hr());

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do update set public = false;

drop policy if exists "public can upload cv files" on storage.objects;
create policy "public can upload cv files" on storage.objects for insert to anon, authenticated with check (bucket_id = 'cvs');
drop policy if exists "team can read cv files" on storage.objects;
create policy "team can read assigned cv files" on storage.objects for select to authenticated using (
  bucket_id = 'cvs'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.applications application
      join public.cv_requests request on request.id = application.cv_request_id
      where application.cv_path = storage.objects.name
        and public.is_hr_for_organization(request.organization_name)
    )
  )
);