# خطة التطوير - مرحلة التخزين والإعدادات

> **📌 تاريخ البدء**: 13 مايو 2026
> **🎯 الهدف**: استخدام Supabase Storage حصراً لجميع الملفات والصور

## ✅ المراحل المكتملة

### المرحلة 1: الإعدادات (مكتمل ✓)
- [x] إنشاء `.env.local` بكل الإعدادات الفعلية
- [x] إنشاء `.env.example` كقالب
- [x] إنشاء `firebase.json` الصحيح
- [x] توثيق مخطط قاعدة البيانات الكامل
- [x] توثيق استراتيجية التخزين

---

## ⏳ المراحل التالية

### المرحلة 2: إنشاء Utility للتخزين (الآتي)
- [ ] إنشاء ملف `src/services/supabase-storage.ts`
- [ ] تطبيق دوال الرفع الأساسية
- [ ] تطبيق دوال الحذف
- [ ] تطبيق دوال الحصول على الروابط

### المرحلة 3: تعديل الكود الموجود (الآتي)
- [ ] تحديث مكون `logo-uploader.tsx`
- [ ] تحديث مكون `cover-image-uploader.tsx`
- [ ] تحديث مكون `product-form-dialog.tsx`
- [ ] تحديث جميع المكونات التي تتعامل مع الملفات

### المرحلة 4: تطبيق نقطة تجميعية للبيانات (الآتي)
- [ ] إنشاء `src/services/data-service.ts` جديد
- [ ] دمج Supabase Storage مع قاعدة البيانات
- [ ] إدارة دورة حياة الملفات (رفع، حذف، تحديث)

### المرحلة 5: الاختبار الشامل (الآتي)
- [ ] اختبار رفع الملفات
- [ ] اختبار استرجاع الملفات
- [ ] اختبار الصور في المكونات المختلفة
- [ ] اختبار الأداء

---

## 📊 الملفات المطلوب إنشاؤها/تعديلها

### ملفات جديدة:
1. `src/services/supabase-storage.ts` - Utility للرفع والحذف
2. `docs/SUPABASE_DATABASE_SCHEMA.md` - مخطط قاعدة البيانات ✓
3. `docs/SUPABASE_STORAGE_STRATEGY.md` - استراتيجية التخزين ✓

### ملفات موجودة تحتاج تحديث:
1. `src/components/dashboard/logo-uploader.tsx`
2. `src/components/dashboard/cover-image-uploader.tsx`
3. `src/components/dashboard/product-form-dialog.tsx`
4. `src/services/data-client.ts`
5. `src/services/data.ts`

---

## 🔑 قواعد العمل

### ✅ يجب الالتزام به:
1. **Supabase Storage حصراً** - لا Firebase، لا خوادم خارجية
2. **واجهات برمجية موحدة** - استخدام `supabase-storage.ts` فقط
3. **معالجة الأخطاء** - رسائل خطأ واضحة ومحاولات إعادة محاولة
4. **التحقق من الملفات** - نوع، حجم، امتداد قبل الرفع
5. **مسارات منظمة** - `{bucket}/{folder}/{filename}`

### ❌ يجب تجنبه:
1. رفع ملفات مباشرة بدون utility
2. استخدام Firebase Storage
3. حفظ الملفات محلياً
4. قيم ملموسة (hardcoded) - استخدم المتغيرات
5. ملفات كبيرة بدون ضغط

---

## 📋 قائمة التحقق

### قبل البدء في كل مرحلة:
- [ ] اقرأ التوثيق الكامل للمرحلة
- [ ] افهم المخطط الكامل للقاعدة
- [ ] تحقق من الإعدادات الصحيحة
- [ ] اختبر الاتصال بـ Supabase

### بعد إكمال كل مرحلة:
- [ ] اختبر التطبيق محلياً
- [ ] تحقق من عدم وجود أخطاء في Console
- [ ] تحقق من البيانات في Supabase Dashboard
- [ ] اكتب تعليقات واضحة في الكود

---

## 🚀 الخطوات التالية الفورية

### 1️⃣ إنشاء Buckets في Supabase (فوراً)
```bash
# اذهب إلى: https://app.supabase.com
# اختر المشروع: markazi-iq
# اذهب إلى: Storage → Create New Bucket

# أنشئ الـ Buckets التالية:
# - product-images (public)
# - store-logos (public)
# - store-covers (public)
# - hero-carousel (public)
# - payment-proofs (private)
```

### 2️⃣ التحقق من الإعدادات
```bash
# التحقق من أن المتغيرات موجودة:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3️⃣ إنشاء ملف `supabase-storage.ts`
- [x] معدّ في التوثيق
- [ ] يحتاج التطبيق الفعلي

---

## 📞 جهات الاتصال والموارد

- **Supabase Docs**: https://supabase.com/docs/guides/storage
- **Next.js File Upload**: https://nextjs.org/docs/app/building-your-application/forms-and-mutations
- **مشروع Markazi**: https://app.supabase.com/project/tjfogjumpyygftwwbmxb

---

**آخر تحديث**: 13 مايو 2026
**الحالة**: ⏳ في الانتظار الخطوة التالية
