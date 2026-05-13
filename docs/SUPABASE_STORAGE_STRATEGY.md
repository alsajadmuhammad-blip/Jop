# استراتيجية التخزين - Supabase Storage فقط

> **🚀 قاعدة ذهبية**: جميع الملفات والصور يجب أن تُخزّن **حصراً في Supabase Storage** وليس في Firebase.

## 📋 ملخص الاستراتيجية

| الملف | الموقع | Bucket في Supabase | ملاحظات |
|------|--------|-------------------|--------|
| صور المنتجات | `products.imageUrl` | `product-images` | ✅ Supabase Storage |
| شعار المتجر | `stores.logoUrl` | `store-logos` | ✅ Supabase Storage |
| صورة غلاف المتجر | `stores.coverImageUrl` | `store-covers` | ✅ Supabase Storage |
| صور الشريط المتحرك | `hero_carousel_items.src` | `hero-carousel` | ✅ Supabase Storage |
| إثبات الدفع | `stores.paymentProofUrl` | `payment-proofs` | ✅ Supabase Storage |
| صور المستخدمين | `users.profile_image` | `user-profiles` | ✅ Supabase Storage (مستقبلاً) |

---

## 🔧 الإعدادات المطلوبة

### 1. إنشاء Buckets في Supabase

اذهب إلى Supabase Dashboard → Storage → Create Bucket

```sql
-- تشغيل في Supabase SQL Editor

-- 1. Bucket للصور المنتجات
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 5242880);

-- 2. Bucket لشعارات المتاجر
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('store-logos', 'store-logos', true, 5242880);

-- 3. Bucket لصور أغلفة المتاجر
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('store-covers', 'store-covers', true, 10485760);

-- 4. Bucket للشريط المتحرك الرئيسي
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('hero-carousel', 'hero-carousel', true, 10485760);

-- 5. Bucket لإثباتات الدفع
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('payment-proofs', 'payment-proofs', false, 5242880);
```

### 2. قواعد الأمان (Storage Policies)

```sql
-- جميع المستخدمين يمكنهم قراءة الصور العامة
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('product-images', 'store-logos', 'store-covers', 'hero-carousel'));

-- المستخدمون المصرحون فقط يمكنهم رفع الملفات
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('product-images', 'store-logos', 'store-covers'));

-- مالك المتجر يمكنه حذف ملفاته
CREATE POLICY "Owner Delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id IN ('product-images', 'store-logos', 'store-covers'));
```

---

## 📦 Packages المطلوب

```bash
npm install @supabase/supabase-js
```

✅ موجود بالفعل في `package.json`

---

## 🔐 متغيرات البيئة

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tjfogjumpyygftwwbmxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💻 كود يوتيليتي لرفع الملفات (Supabase Storage)

### ملف جديد: `src/services/supabase-storage.ts`

```typescript
import { supabase } from './supabase';

export interface UploadFileOptions {
  bucket: 'product-images' | 'store-logos' | 'store-covers' | 'hero-carousel' | 'payment-proofs';
  file: File;
  path: string;
  onProgress?: (progress: number) => void;
}

/**
 * رفع ملف إلى Supabase Storage
 * @param options خيارات الرفع
 * @returns رابط الملف العام أو null في حالة الخطأ
 */
export async function uploadFile(options: UploadFileOptions): Promise<string | null> {
  try {
    const { bucket, file, path, onProgress } = options;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      throw new Error('يجب أن يكون الملف صورة');
    }

    // التحقق من حجم الملف (5MB للصور العادية، 10MB للأغلفة)
    const maxSize = bucket === 'store-covers' || bucket === 'hero-carousel' ? 10485760 : 5242880;
    if (file.size > maxSize) {
      throw new Error(`حجم الملف يتجاوز الحد المسموح (${maxSize / 1024 / 1024}MB)`);
    }

    // رفع الملف
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // الحصول على رابط الملف العام
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('خطأ في رفع الملف:', error);
    return null;
  }
}

/**
 * حذف ملف من Supabase Storage
 */
export async function deleteFile(
  bucket: 'product-images' | 'store-logos' | 'store-covers' | 'hero-carousel' | 'payment-proofs',
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('خطأ في حذف الملف:', error);
    return false;
  }
}

/**
 * الحصول على رابط عام لملف
 */
export function getPublicUrl(
  bucket: 'product-images' | 'store-logos' | 'store-covers' | 'hero-carousel' | 'payment-proofs',
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

/**
 * رفع صورة المنتج
 */
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  return uploadFile({
    bucket: 'product-images',
    file,
    path: `${productId}/${file.name}`,
  });
}

/**
 * رفع شعار المتجر
 */
export async function uploadStoreLogo(file: File, storeId: string): Promise<string | null> {
  return uploadFile({
    bucket: 'store-logos',
    file,
    path: `${storeId}/logo`,
  });
}

/**
 * رفع صورة غلاف المتجر
 */
export async function uploadStoreCover(file: File, storeId: string): Promise<string | null> {
  return uploadFile({
    bucket: 'store-covers',
    file,
    path: `${storeId}/cover`,
  });
}

/**
 * رفع صورة الشريط المتحرك
 */
export async function uploadHeroCarouselImage(file: File): Promise<string | null> {
  const timestamp = Date.now();
  return uploadFile({
    bucket: 'hero-carousel',
    file,
    path: `carousel-${timestamp}`,
  });
}

/**
 * رفع إثبات الدفع
 */
export async function uploadPaymentProof(file: File, storeId: string): Promise<string | null> {
  return uploadFile({
    bucket: 'payment-proofs',
    file,
    path: `${storeId}/proof-${Date.now()}`,
  });
}
```

---

## 📝 أمثلة على الاستخدام

### مثال 1: رفع صورة منتج

```typescript
import { uploadProductImage } from '@/services/supabase-storage';

async function handleProductImageUpload(file: File, productId: string) {
  try {
    const imageUrl = await uploadProductImage(file, productId);
    if (imageUrl) {
      // حفظ الرابط في قاعدة البيانات
      await updateProductImage(productId, imageUrl);
      toast({ title: 'تم رفع الصورة بنجاح' });
    }
  } catch (error) {
    toast({ title: 'خطأ في رفع الصورة', variant: 'destructive' });
  }
}
```

### مثال 2: استخدام في مكون React

```typescript
import { uploadStoreLogo } from '@/services/supabase-storage';
import { useState } from 'react';

export function LogoUploader() {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const logoUrl = await uploadStoreLogo(file, 'store-id-here');
      console.log('شعار تم رفعه:', logoUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleUpload}
      disabled={uploading}
    />
  );
}
```

---

## ⚠️ نقاط مهمة جداً

### ❌ ما يجب تجنبه

1. **لا تستخدم Firebase Storage** ❌
2. **لا تحفظ الصور محلياً** ❌
3. **لا ترسل الصور إلى خوادم خارجية** ❌
4. **لا تستخدم Base64** ❌ (استخدم الرفع المباشر)

### ✅ ما يجب فعله

1. **استخدم Supabase Storage حصراً** ✅
2. **حفظ الرابط فقط في قاعدة البيانات** ✅
3. **استخدم الرفع المباشر (Direct Upload)** ✅
4. **تحقق من نوع وحجم الملف قبل الرفع** ✅
5. **أعد محاولة الرفع في حالة الفشل** ✅

---

## 🔄 هيكل المسارات في Storage

```
product-images/
  ├── {productId}/
  │   ├── image1.jpg
  │   ├── image2.jpg
  │   └── ...

store-logos/
  ├── {storeId}/
  │   └── logo.jpg (أو .png)

store-covers/
  ├── {storeId}/
  │   └── cover.jpg (أو .png)

hero-carousel/
  ├── carousel-{timestamp}.jpg
  ├── carousel-{timestamp}.jpg
  └── ...

payment-proofs/
  ├── {storeId}/
  │   ├── proof-{timestamp}.jpg
  │   └── proof-{timestamp}.jpg
```

---

**آخر تحديث**: 13 مايو 2026
**الحالة**: ✅ معتمد وجاهز للتطبيق
