# مسار — منصة الوظائف العراقية

تطبيق React/Vite مستقل عن أي backend داخل Replit. كل البيانات والمصادقة وملفات السير الذاتية تعمل عبر Supabase، وFirebase Hosting مهيأ لاستضافة مجلد `dist`.

## التشغيل المحلي

```bash
npm install
npm run dev
```

يقرأ التطبيق:

- `VITE_SUPABASE_URL` أو `NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` أو `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## تجهيز Supabase

1. افتح SQL Editor في مشروع Supabase.
2. نفّذ الملف `supabase/schema.sql` كاملاً.
3. من Authentication أنشئ حسابات الفريق، ثم أضف سجلاً مقابلاً في `profiles`:

```sql
insert into public.profiles (id, full_name, role, organization)
values ('USER_UUID', 'اسم المستخدم', 'admin', 'مسار');
```

الأدوار المتاحة: `admin` للإدارة، `hr` لجهة الموارد البشرية، و`candidate` للمستخدم العادي.

## Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

قبل النشر، اربط المشروع الصحيح في `.firebaserc`، وضع متغيرات Supabase في بيئة البناء. ملف `firebase.json` يستخدم `dist` ويعيد توجيه كل المسارات إلى `index.html`.

## سير العمل

- الزائر يرى الوظائف وطلبات HR المنشورة.
- المتقدم يرسل اسمه ووسائل التواصل وملف PDF.
- ملف CV يرفع إلى bucket خاص اسمه `cvs`.
- الإدارة وHR يفتحون الملفات من خلال رابط مؤقت من Supabase Storage.
- الإدارة تنشئ الوظائف وطلبات CV وتغلق أو تعيد نشر المنشورات.