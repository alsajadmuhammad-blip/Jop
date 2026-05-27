# التوثيق التقني: تحسينات إدارة المتاجر

## نظرة عامة المعمارية

```
المشرف (Admin)
    ↓
صفحة add-store (/admin/add-store)
    ├─ Form Component (معالجة الإدخال)
    ├─ Tabs Component (تنظيم البيانات)
    ├─ Image Upload (رفع الصور)
    └─ Validation (التحقق من الصحة)
    ↓
Supabase Storage (تخزين الصور)
    └─ Buckets: store-logos, store-covers
    ↓
Edge Function (create-store)
    └─ معالجة إنشاء الحساب والمتجر
    ↓
Supabase Database
    ├─ auth.users (حساب صاحب المتجر)
    ├─ public.stores (بيانات المتجر)
    ├─ public.store_packages (الباقات)
    └─ public.business_hours (ساعات العمل)
```

## الملفات والدوال

### 1. صفحة الإضافة

#### المسار:
```
/workspaces/markazi/src/app/(pages)/admin/add-store/page.tsx
```

#### الحالة (State) الرئيسية:
```typescript
const [form, setForm] = useState({
  // معلومات المتجر
  name: string;
  description: string;
  location: string;
  latitude: string;
  longitude: string;
  
  // معلومات صاحب الحساب
  ownerName: string;
  ownerEmail: string;
  password: string;
  confirmPassword: string;
  whatsappNumber: string;
  
  // الإعدادات
  marketType: string;
  storeType: "فعلي" | "إلكتروني";
  packageName: string;
  hasDelivery: boolean;
  businessHours: {
    [day: string]: {
      open: string;      // HH:MM
      close: string;     // HH:MM
      closed: boolean;
    }
  }
})
```

#### حالة الملفات:
```typescript
const [logoFile, setLogoFile] = useState<File | null>(null);
const [logoPreview, setLogoPreview] = useState<string | null>(null);
const [coverFile, setCoverFile] = useState<File | null>(null);
const [coverPreview, setCoverPreview] = useState<string | null>(null);
```

#### حالة العمليات:
```typescript
const [submitting, setSubmitting] = useState(false);
const [uploadingImages, setUploadingImages] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState(false);
const [activeTab, setActiveTab] = useState("basic");
```

### 2. دوال معالجة الإدخال

#### handleChange()
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value, type, checked } = e.target;
  setForm((f) => ({ 
    ...f, 
    [name]: type === 'checkbox' ? checked : value 
  }));
}
```

#### handleBusinessHourChange()
```typescript
const handleBusinessHourChange = (day: string, field: string, value: string) => {
  setForm((f) => ({
    ...f,
    businessHours: {
      ...f.businessHours,
      [day]: {
        ...f.businessHours[day],
        [field]: value,
      },
    },
  }));
}
```

#### handleBusinessHourToggle()
```typescript
const handleBusinessHourToggle = (day: string) => {
  setForm((f) => ({
    ...f,
    businessHours: {
      ...f.businessHours,
      [day]: {
        ...f.businessHours[day],
        closed: !f.businessHours[day].closed,
      },
    },
  }));
}
```

#### handleLogoChange() و handleCoverChange()
```typescript
const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // التحقق من النوع والحجم
    // عرض المعاينة
    // حفظ الملف
  }
}
```

### 3. التحقق من الصحة

#### validateForm()
```typescript
const validateForm = (): string | null => {
  // مصفوفة من الفحوصات
  if (!form.name?.trim()) return "اسم المتجر مطلوب";
  if (form.name.length < 3) return "حد أدنى 3 أحرف";
  
  if (!form.ownerName?.trim()) return "اسم الصاحب مطلوب";
  
  if (!emailRegex.test(form.ownerEmail)) return "بريد غير صحيح";
  
  if (form.password.length < 6) return "كلمة مرور قصيرة";
  if (form.password !== form.confirmPassword) return "كلمات مختلفة";
  
  if (!/^\d{10,}$/.test(form.whatsappNumber.replace(/\D/g, ''))) 
    return "رقم واتساب غير صحيح";
  
  // ... فحوصات إضافية
  
  return null; // لا توجد أخطاء
}
```

### 4. معالجة الإرسال

#### handleSubmit()
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. التحقق من الصحة
  const validationError = validateForm();
  if (validationError) {
    setError(validationError);
    return;
  }
  
  // 2. رفع الصور (إن وجدت)
  if (logoFile || coverFile) {
    // استدعاء uploadFile() لكل صورة
  }
  
  // 3. إنشاء المتجر
  const result = await createStoreOwner({
    ownerEmail: form.ownerEmail,
    ownerName: form.ownerName,
    ownerPassword: form.password,
    storeName: form.name,
    storeDescription: form.description,
    whatsappNumber: form.whatsappNumber,
    marketType: form.marketType,
    packageName: form.packageName,
    storeType: form.storeType,
    location: form.location,
    latitude: form.latitude ? parseFloat(form.latitude) : null,
    longitude: form.longitude ? parseFloat(form.longitude) : null,
    hasDelivery: form.hasDelivery,
    businessHours: form.businessHours,
    logoUrl: logoUrl,
    coverUrl: coverUrl,
  });
  
  // 4. معالجة النتيجة
  if (result?.success) {
    setSuccess(true);
    setTimeout(() => router.push("/admin"), 2000);
  } else {
    setError(result?.error || "خطأ في الإنشاء");
  }
}
```

## الخدمات المستخدمة

### 1. uploadFile() - رفع الملفات
```typescript
// من: src/services/supabase-storage.ts

const result = await uploadFile({
  bucket: 'store-logos' | 'store-covers',
  file: File,
  path: string,
});

// النتيجة:
{
  success: boolean,
  url?: string,      // رابط الملف العام
  error?: string,    // رسالة الخطأ
}
```

### 2. createStoreOwner() - إنشاء المتجر
```typescript
// من: src/services/supabase-admin.ts

const result = await createStoreOwner({
  ownerEmail: string,
  ownerName: string,
  ownerPassword: string,
  storeName: string,
  storeDescription: string,
  whatsappNumber: string,
  marketType: string,
  packageName: string,
  storeType: string,
  location: string,
  latitude: number | null,
  longitude: number | null,
  hasDelivery: boolean,
  businessHours: object,
  logoUrl: string | null,
  coverUrl: string | null,
});

// النتيجة:
{
  success: boolean,
  error?: string,
  // ... بيانات إضافية
}
```

### 3. fetchStorePackages() - جلب الباقات
```typescript
// من: src/services/supabase-db.ts

const packages = await fetchStorePackages();

// النتيجة: مصفوفة StorePackage[]
```

## معايير التحقق (Validation Rules)

### البريد الإلكتروني
```regex
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

### رقم الواتساب
```
- الحد الأدنى: 10 أرقام
- يتم إزالة جميع الأحرف غير الرقمية
- مثال صحيح: 966501234567
```

### الإحداثيات
```regex
/^-?[0-9]{1,3}\.[0-9]+$/
```

### اسم المتجر واسم الصاحب
```
- الحد الأدنى: 3 أحرف
- الحد الأقصى: 100 حرف
```

### كلمة المرور
```
- الحد الأدنى: 6 أحرف
- يجب أن تتطابق مع التأكيد
```

## صيغ البيانات

### ساعات العمل (businessHours)
```json
{
  "saturday": { "open": "09:00", "close": "22:00", "closed": false },
  "sunday": { "open": "09:00", "close": "22:00", "closed": false },
  "monday": { "open": "09:00", "close": "22:00", "closed": false },
  "tuesday": { "open": "09:00", "close": "22:00", "closed": false },
  "wednesday": { "open": "09:00", "close": "22:00", "closed": false },
  "thursday": { "open": "09:00", "close": "22:00", "closed": false },
  "friday": { "open": "09:00", "close": "22:00", "closed": true }
}
```

### بيانات المتجر المرسلة
```typescript
{
  ownerEmail: "owner@example.com",
  ownerName: "أحمد محمد",
  ownerPassword: "SecurePass123",
  storeName: "صيدلية النور",
  storeDescription: "متخصصة في الأدوية...",
  whatsappNumber: "966501234567",
  marketType: "أدوية",
  packageName: "basic",
  storeType: "فعلي",
  location: "بغداد - الكرادة",
  latitude: 33.3128,
  longitude: 44.3615,
  hasDelivery: true,
  businessHours: { /* ... */ },
  logoUrl: "https://storage.url/logos/...",
  coverUrl: "https://storage.url/covers/..."
}
```

## الأخطاء الشائعة والحلول

### خطأ: "Invalid API key"
```
السبب: مشكلة في إعدادات Supabase
الحل: تحقق من متغيرات البيئة
```

### خطأ: "Email already exists"
```
السبب: البريد الإلكتروني مستخدم مسبقاً
الحل: استخدم بريداً آخر
```

### خطأ: "File upload failed"
```
السبب: مشكلة في Supabase Storage
الحل: تأكد من وجود الـ buckets
```

## الأداء والتحسينات

### حجم الحزمة
```
الحد الأقصى للشعار: 5 MB
الحد الأقصى للغلاف: 10 MB
```

### وقت التنفيذ
```
التحقق من الصحة: < 100ms
رفع الشعار: < 5 ثوان (متوسط)
رفع الغلاف: < 10 ثوان (متوسط)
إنشاء المتجر: < 3 ثوان
```

## الأمان

### حماية البيانات
```
✓ التحقق من صحة البيانات على الجانب العميل
✓ التحقق من صحة الملفات قبل الرفع
✓ استخدام HTTPS للنقل
✓ كلمات مرور محفوظة في auth.users
```

### التحكم في الوصول
```
✓ يجب أن يكون المستخدم admin
✓ التحقق من الجلسة على الخادم
✓ فحص الصلاحيات في Edge Function
```

## المتطلبات والتبعيات

```
- Next.js 16+
- React 18+
- TypeScript
- Supabase JS Client
- Radix UI Components
- React Hook Form (اختياري)
- Zod (اختياري)
```

## متغيرات البيئة المطلوبة

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL=...
```

## الاختبار

### اختبار الحقول المطلوبة
```
- ترك حقل فارغ → يجب أن تظهر رسالة خطأ
- ملء جميع الحقول → يجب أن ينجح الإرسال
```

### اختبار التحقق
```
- بريد غير صحيح → رسالة خطأ
- رقم واتساب قصير → رسالة خطأ
- كلمات مختلفة → رسالة خطأ
```

### اختبار الصور
```
- ملف كبير جداً → رسالة خطأ
- نوع ملف غير مدعوم → رسالة خطأ
- صورة صحيحة → يجب أن تُرفع بنجاح
```

---

**آخر تحديث:** مايو 2026
**الإصدار:** 2.0
