# إعداد قاعدة البيانات Supabase

## المشكلة
إذا ظهرت رسالة "فشل تحميل بيانات المستخدم" بعد تسجيل الدخول، فهذا يعني أن جدول `users` غير مُعد بشكل صحيح في Supabase.

## الحل

### الخطوة 1: تشغيل SQL لإعداد الجداول الأساسية
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك (`tjfogjumpyygftwwbmxb`)
3. اذهب إلى **SQL Editor**
4. شغّل الكود الموجود في الملفات التالية بالترتيب:
   - `docs/supabase-users-setup.sql`
   - `docs/supabase-stores-setup.sql`
   - `docs/supabase-products-setup.sql`
   - `docs/supabase-hero-carousel-setup.sql`
   - `docs/supabase-orders-setup.sql`
5. تأكّد من أن جميع الجداول تعمل بدون أخطاء قبل المتابعة.

### الخطوة 2: إنشاء حساب المشرف
بعد تشغيل SQL، أنشئ حساب المشرف:

1. في Supabase Dashboard → **Authentication > Users**
2. اضغط **Add user**
3. Email: `admin@markazi.com`
4. Password: `Admin@12345`
5. ☑️ Auto confirm user
6. احفظ الـ UUID الذي يظهر

### الخطوة 3: إضافة المشرف في قاعدة البيانات
في SQL Editor، شغّل:

```sql
INSERT INTO public.users (id, name, email, role) VALUES
('UUID_الذي_حصلت_عليه', 'المشرف العام', 'admin@markazi.com', 'admin');
```

### الخطوة 4: التحقق
1. أعد تشغيل التطبيق
2. جرب تسجيل الدخول بـ `admin@markazi.com` و `Admin@12345`
3. يجب أن يعمل الآن بدون أخطاء

## ملاحظات مهمة
- **Firebase**: فقط للاستضافة (hosting)
- **Supabase**: للمصادقة والقاعدة البيانات
- إذا استمرت المشكلة، تحقق من Console في المتصفح لرؤية رسائل الخطأ التفصيلية