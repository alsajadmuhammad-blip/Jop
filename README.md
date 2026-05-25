# مشروع مركزي

تطبيق ويب متكامل مبني باستخدام Next.js و TypeScript و Supabase لإدارة المنصة المركزية للمتاجر والصيدليات.

## لمحة عامة

- إطار العمل: `Next.js 16` (App Router)
- لغة التطوير: `TypeScript`
- تنسيق الواجهة: `Tailwind CSS`
- قاعدة البيانات/المصادقة/التخزين: `Supabase`
- دعم تطبيق الويب التقدمي: `next-pwa`
- مكتبات UI: `Radix UI`, `lucide-react`
- الحركات: `framer-motion`
- إدارة النماذج والتحقق: `react-hook-form`, `zod`

## ما يحتويه المشروع

- `src/app/`: صفحات التطبيق وأجزاء الواجهة الرئيسية
- `src/components/`: مكونات الواجهة القابلة لإعادة الاستخدام
- `src/services/`: طبقة الاتصال مع Supabase وعمليات CRUD
- `src/lib/`: أنواع البيانات، الأدوات، والبيانات الثابتة
- `docs/`: مستندات دعم وتقارير التصميم وقاعدة البيانات

## الميزات الأساسية

- صفحة رئيسية تفاعلية
- بحث متقدم في المتاجر والمنتجات
- دعم أدوار متعددة: `customer`, `store`, `admin`, `representative`
- لوحة تحكم للإدارة والمتاجر والمندوبين
- رفع صور المتاجر والمنتجات عبر Supabase Storage
- إدارة منتجات المتجر وأقسامه
- إنشاء طلبات الشراء وخيارات الدفع عبر WhatsApp

## متطلبات المشروع

- Node.js 18+ أو أحدث
- متغيرات بيئة Supabase
- `npm install` أو `pnpm install`

## إعداد بيئة التطوير

1. انسخ ملف المثال:

```bash
cp .env.example .env.local
```

2. اضبط المتغيرات التالية في `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_CREATE_PRODUCT_FUNCTION_URL=
NEXT_PUBLIC_SUPABASE_CREATE_SECTION_FUNCTION_URL=
NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL=https://<your-project>.supabase.co/functions/v1/store-owner-creator
NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL=
```

> يجب أن يكون `NEXT_PUBLIC_SUPABASE_ANON_KEY` هو مفتاح الـ `anon` الحالي من لوحة تحكم Supabase. إذا ظهرت رسالة "Invalid API key" عند تسجيل الدخول أو عند الاتصال بقاعدة البيانات، فهذا يعني أن المفتاح العام في `.env.local` غير صالح أو تم تغيير المفتاح في Supabase.

3. ثم شغّل التطبيق محلياً:

```bash
npm install
npm run dev
```

## تشغيل المشروع

- `npm run dev` لتشغيل بيئة التطوير
- `npm run build` لإنشاء بناء الإنتاج
- `npm run start` لتشغيل النسخة المُعدة
- `npm run lint` لفحص جودة الشفرة
- `npm run typecheck` للتحقق من أنواع TypeScript

## ملاحظات مهمة

- الملف `مخطط قاعدة البيانات` هو المخطط الرسمي المستخدم في قاعدة بيانات Supabase.
- تم إزالة التجاهل التلقائي لأخطاء TypeScript أثناء البناء لتأمين جودة أعلى.
- يوفّر المشروع دعمًا لكلٍ من `snake_case` و `camelCase` في استعلامات Supabase، لكن يُفضل استخدام `camelCase` في الكود الجديد.
- إصدار `output: 'export'` في `next.config.js` يعني أن التطبيق مُهيّأ للتصدير الثابت. لاحظ أن بعض ميزات PWA قد تحتاج اختبارًا إضافيًا بعد التصدير.

## بنية قاعدة البيانات

الجدول الرئيسي في التطبيق هو:

- `stores`
- `products`
- `orders`
- `users`
- `store_sections`
- `hero_carousel_items`
- `inventory_movements`

## نصائح التطوير

- نظف الحقول بين camelCase و snake_case عند التواصل مع Supabase
- راجع دوال `src/services/supabase-db.ts` عند إضافة ميزات جديدة إلى البيانات
- إذا احتجت إلى دعم عمليات خلفية إضافية، فاستخدم دوال Supabase Edge Functions المعرفة في المتغيرات البيئية
 
