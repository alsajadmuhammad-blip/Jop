# ملاحظات التكامل مع Supabase Edge Function

## نظرة عامة

عند إنشاء متجر جديد، يتم إرسال البيانات من الواجهة الأمامية إلى Supabase Edge Function المسماة `create-store`.

## البيانات المرسلة

### الصيغة الجديدة (بعد التحسينات)

```typescript
POST /functions/v1/create-store

{
  // معلومات صاحب الحساب
  ownerEmail: string,
  ownerName: string,
  ownerPassword: string,
  
  // معلومات المتجر
  storeName: string,
  storeDescription: string,        // جديد
  marketType: string,
  storeType: string,
  location: string,
  latitude: number | null,
  longitude: number | null,
  
  // الخدمات والإعدادات
  whatsappNumber: string,
  hasDelivery: boolean,             // جديد
  businessHours: object,            // جديد
  
  // الباقة
  packageName: string,
  
  // الصور
  logoUrl: string | null,           // جديد
  coverUrl: string | null,          // جديد
}
```

## التغييرات المتوقعة في Edge Function

### 1. معالجة حقول جديدة

```typescript
// في create-store function يجب إضافة:

// حفظ الوصف
await supabase.from('stores').insert({
  // ... الحقول الحالية
  description: data.storeDescription,
  has_delivery: data.hasDelivery,
  business_hours: data.businessHours,
  logo_url: data.logoUrl,
  cover_image_url: data.coverUrl,
})
```

### 2. التحقق من صحة البيانات

```typescript
// في Edge Function يجب إضافة التحقق من:

// التحقق من ساعات العمل
const businessHours = data.businessHours;
if (businessHours) {
  const validDays = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  for (const day of validDays) {
    if (businessHours[day]) {
      // التحقق من صيغة الوقت HH:MM
      if (!isValidTimeFormat(businessHours[day].open)) {
        throw new Error(`Invalid time format for ${day} opening time`);
      }
      if (!isValidTimeFormat(businessHours[day].close)) {
        throw new Error(`Invalid time format for ${day} closing time`);
      }
    }
  }
}

// التحقق من خدمة التوصيل
if (typeof data.hasDelivery !== 'boolean') {
  throw new Error('hasDelivery must be a boolean');
}

// التحقق من الوصف
if (data.storeDescription && data.storeDescription.length > 500) {
  throw new Error('Store description too long (max 500 characters)');
}
```

### 3. معالجة الأخطاء

```typescript
// يجب إضافة معالجة للأخطاء الجديدة:

try {
  // ... الكود الحالي
  
  if (data.logoUrl && !isValidUrl(data.logoUrl)) {
    throw new Error('Invalid logo URL');
  }
  
  if (data.coverUrl && !isValidUrl(data.coverUrl)) {
    throw new Error('Invalid cover image URL');
  }
  
} catch (error) {
  console.error('Error creating store:', error);
  return {
    success: false,
    error: error.message,
  };
}
```

## كيفية التحديث

### خطوات التحديث في Edge Function:

1. **فتح Supabase Dashboard**
   ```
   https://app.supabase.com → Project → Edge Functions
   ```

2. **اختر function: `create-store`**

3. **أضف المعالجة للحقول الجديدة:**
   ```typescript
   // في جزء INSERT query
   const { data: store, error: storeError } = await supabase
     .from('stores')
     .insert({
       // ... الحقول القديمة
       name: payload.storeName,
       owner_id: user.id,
       owner_email: payload.ownerEmail,
       
       // الحقول الجديدة:
       description: payload.storeDescription || '',
       has_delivery: payload.hasDelivery || false,
       business_hours: payload.businessHours || null,
       logo_url: payload.logoUrl || null,
       cover_image_url: payload.coverUrl || null,
     })
   ```

4. **اختبر بالبيانات الجديدة:**
   ```bash
   curl -X POST \
     'https://[project-id].supabase.co/functions/v1/create-store' \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer [anon-key]' \
     -d '{
       "ownerEmail": "test@example.com",
       "ownerName": "تست",
       "ownerPassword": "Test@123",
       "storeName": "متجر الاختبار",
       "storeDescription": "وصف الاختبار",
       "whatsappNumber": "966501234567",
       "marketType": "أدوية",
       "packageName": "basic",
       "storeType": "فعلي",
       "location": "بغداد",
       "hasDelivery": true,
       "businessHours": {
         "saturday": {"open": "09:00", "close": "22:00", "closed": false}
       },
       "logoUrl": "https://...",
       "coverUrl": "https://..."
     }'
   ```

## التوافقية العكسية

### البيانات القديمة
إذا تم إرسال بيانات بدون الحقول الجديدة (من نسخة قديمة من الكود):
```
يجب استخدام قيم افتراضية:
- storeDescription: ""
- hasDelivery: false
- businessHours: null
- logoUrl: null
- coverUrl: null
```

## الاختبار

### 1. اختبار محلي

```bash
# تشغيل Edge Function محلياً
supabase functions serve create-store

# الاختبار من terminal آخر
curl -X POST \
  'http://localhost:54321/functions/v1/create-store' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [anon-key]' \
  -d '{...}'
```

### 2. اختبار في الإنتاج

```
تم إنشاء المتجر بنجاح؟
✓ فتح Supabase Dashboard
✓ اذهب إلى جدول stores
✓ تحقق من البيانات الجديدة
✓ تأكد من وجود:
  - description
  - has_delivery
  - business_hours
  - logo_url
  - cover_image_url
```

## قائمة التحقق

- [ ] التحقق من معالجة الحقول الجديدة
- [ ] إضافة التحقق من صحة الحقول الجديدة
- [ ] اختبار مع بيانات صحيحة
- [ ] اختبار مع بيانات خاطئة
- [ ] التحقق من التوافقية العكسية
- [ ] تحديث الرسائل والأخطاء
- [ ] تسجيل التغييرات

## المراقبة

بعد النشر، راقب:

```
Supabase Dashboard → Edge Functions → Logs

ابحث عن:
❌ رسائل خطأ جديدة
⚠️ تحذيرات الأداء
✓ معدل النجاح
```

## المراجع السريعة

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Schema: stores table](/docs/SUPABASE_DATABASE_SCHEMA.md)

---

**آخر تحديث:** مايو 2026
