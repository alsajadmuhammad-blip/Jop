-- Run once in the Supabase SQL Editor on existing projects after schema.sql.
-- Keeps job deletion restricted to admins and reports whether a row was deleted.
create or replace function public.admin_delete_job(p_job_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرح بحذف الوظائف';
  end if;

  delete from public.jobs where id = p_job_id;
  return found;
end;
$$;

revoke all on function public.admin_delete_job(uuid) from public, anon;
grant execute on function public.admin_delete_job(uuid) to authenticated;