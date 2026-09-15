-- مسار: ربط مستخدم Supabase Auth بدور الأدمن
--
-- الخطوة الأولى:
-- 1) افتح Supabase Dashboard.
-- 2) Authentication > Users > Add user.
-- 3) أنشئ المستخدم بالبريد وكلمة المرور، وفعّل Auto Confirm User إذا أردت دخوله مباشرة.
-- 4) بدّل القيمتين أدناه ثم نفّذ هذا الملف في SQL Editor.
--
-- لا تضع كلمة المرور هنا. Supabase Auth هو المسؤول عن تخزينها بشكل آمن.

do $$
declare
  admin_user_id uuid;
  admin_email text := lower(trim('ADMIN_EMAIL_HERE'));
  admin_name text := 'اسم الأدمن';
begin
  select id
    into admin_user_id
  from auth.users
  where lower(email) = admin_email
  limit 1;

  if admin_user_id is null then
    raise exception 'لم يتم العثور على مستخدم Auth بهذا البريد: %', admin_email;
  end if;

  insert into public.profiles (id, full_name, role, organization)
  values (admin_user_id, admin_name, 'admin', 'مسار')
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = 'admin',
        organization = excluded.organization;
end $$;

-- تحقق من النتيجة:
select
  p.id,
  p.full_name,
  p.role,
  p.organization,
  u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';