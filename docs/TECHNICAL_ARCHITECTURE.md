# البنية التقنية للمشروع

## نظرة عامة
- التطبيق مبني بـ `Next.js 16` باستخدام App Router وTypeScript.
- يتم تصدير التطبيق كـ static website عبر `next build` + `output: 'export'`.
- الاستضافة تتم على `Firebase Hosting` من مجلد `out` الناتج.
- الخلفية الحقيقية هي `Supabase`، وتستخدم لمصادقة المستخدمين وقاعدة البيانات والتخزين ودوال Edge Functions.

## كيف يعمل المشروع

### الواجهة الأمامية
- جميع الصفحات يتم تقديمها كـ static SPA.
- يتم تنفيذ المصادقة والاستعلامات مباشرةً من المتصفح عبر عميل Supabase (`@supabase/supabase-js`).
- لا يوجد في المشروع مسارات داخلية (`/api` أو `route.ts`) تابعة لـ Next.js.
- الإعدادات الخاصة بـ Supabase تُحمَّل من متغيرات بيئة واضحة وتُدمج أثناء البناء.

### الخلفية
- Supabase هو مصدر الحقيقة:
  - `auth` لمصادقة المستخدمين.
  - `postgres` لقاعدة البيانات.
  - `storage` لتخزين الصور والملفات.
  - `functions` لتنفيذ عمليات الخلفية الحساسة، لكن يتم استدعاؤها مباشرة من الواجهة الأمامية.
- Firebase يستخدم فقط لاستضافة الملفات الثابتة، وليس لتشغيل منطق خلفي.

## متغيرات البيئة المطلوبة
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_CREATE_PRODUCT_FUNCTION_URL`
- `NEXT_PUBLIC_SUPABASE_CREATE_SECTION_FUNCTION_URL`
- `NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL`
- `NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL`

> ملاحظة مهمة: المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` تُدمج في حزمة العميل عند وقت البناء. لذلك يجب أن تكون صحيحة عند تنفيذ `npm run build`.

## نشر Firebase الثابت
- `firebase.json` يعيد جميع الطلبات إلى `/index.html`.
- هذه الطريقة مناسبة لتطبيق SPA ثابت ولا تعتمد على خادم Next.js.
- يجب أن يتم إنشاء التطبيق (`npm run build`) قبل النشر.
- في بيئة Firebase Hosting لا يوجد ملف `.env.local` على الخادم؛ فقط القيم التي تم تضمينها في البناء.

## لماذا يظهر خطأ `Invalid API key`

هذا الخطأ عادة يعني أحد الأسباب التالية:

1. `NEXT_PUBLIC_SUPABASE_ANON_KEY` غير صحيح أو تم تغييره في مشروع Supabase.
2. `NEXT_PUBLIC_SUPABASE_URL` لا يتطابق مع مشروع Supabase نفسه.
3. تم بناء التطبيق مع مفتاح خاطئ، ومن ثم تم نشر الملفات الثابتة القديمة.
4. استدعاء دوال Supabase من المتصفح باستخدام رأس `apikey` أو `Authorization` غير صحيح.

## خطوات الإصلاح

1. تحقق من أن القيم في `.env.local` صحيحة تمامًا.
2. شغّل `npm run build` محليًا بعد تحديث القيم.
3. احفظ الملفات الناتجة وأعد نشر `firebase deploy --only hosting`.
4. تأكد من أن المتصفح لا يستخدم نسخة مخبأة قديمة.

## الخلاصة
- بنيتك تعتمد على `Next.js` كواجهة ثابتة و`Supabase` كخدمة لوجستية.
- لا تعتمد على وظائف Firebase أو مسارات API ضمن المشروع.
- إذا ظهر `Invalid API key`، فالغالب أن المشكلة في إعدادات Supabase أو في عملية البناء والنشر، وليس في وجود مسار داخلي.
