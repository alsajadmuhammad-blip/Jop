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

للتشغيل المحلي، انسخ `.env.example` إلى `.env` ثم ضع مفتاح Supabase المحلي داخله:

```bash
cp .env.example .env
```

ملف `.env` مستثنى من Git عمداً، بينما `.env.example` آمن للرفع إلى GitHub لأنه لا يحتوي على المفتاح الفعلي.

## تجهيز Supabase

1. افتح SQL Editor في مشروع Supabase.
2. نفّذ الملف `supabase/schema.sql` كاملاً.
3. إذا كان المشروع يستخدم قاعدة بيانات قديمة سبق تنفيذ مخططها، نفّذ `supabase/job-publishing-migration.sql` لإضافة وسائل التواصل وطلبات نشر الوظائف.
4. لإنشاء الأدمن، أنشئ المستخدم أولاً من Authentication > Users، ثم عدّل البريد والاسم داخل `supabase/admin-account.sql` ونفّذه في SQL Editor.

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

تم ربط `.firebaserc` حالياً بمشروع Firebase `iraq-jobs-1415d`. إعدادات Firebase Web SDK وAnalytics غير مطلوبة للاستضافة فقط؛ Firebase Hosting يحتاج Project ID وملف `firebase.json` فقط. ملف `firebase.json` يستخدم `dist` ويعيد توجيه كل المسارات إلى `index.html`.

إذا لم يكن Firebase CLI مثبتاً:

```bash
npm install -g firebase-tools
firebase login
```

ثم:

```bash
npm run build
firebase use iraq-jobs-1415d
firebase deploy --only hosting
```

## سير العمل

- الزائر يرى الوظائف وطلبات HR المنشورة.
- المتقدم يرسل اسمه ووسائل التواصل وملف PDF إلى طلبات HR المنشورة فقط.
- ملف CV يرفع إلى bucket خاص اسمه `cvs`.
- الإدارة وHR يفتحون الملفات من خلال رابط مؤقت من Supabase Storage.
- الإدارة تنشئ الوظائف وطلبات CV وتغلق أو تعيد نشر المنشورات. الوظائف المعروضة للتصفح فقط، ولا يوجد تقديم مباشر عليها.
- الشركات والجهات ترسل طلب نشر وظيفة من رابط عام، ثم توافق الإدارة على الطلب قبل نشر الوظيفة. يظهر رابط النموذج داخل لوحة الإدارة ويمكن مشاركته خارج المنصة.