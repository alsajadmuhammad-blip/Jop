# دليل سريع: نظام إدارة الباقات 🚀

**التاريخ:** 2026-06-20  
**الإصدار:** 1.0  
**الحالة:** ✅ مُحسّن وموثق

---

## 📍 الهيكل الأساسي

```
صفحة إدارة الباقات (Admin Panel)
    ↓
components/subscriptions-tab.tsx
    ↓
    ├── إضافة / تعديل / حذف الباقات
    └── تعيين الباقات للمتاجر
    ↓
supabase-db.ts (Service Layer)
    ├── createStorePackage()
    ├── updateStorePackage()
    ├── deleteStorePackage()
    ├── fetchStorePackages()
    └── mapStorePackageRow()
    ↓
Supabase Database
    └── store_packages table
```

---

## 📋 جدول store_packages

### الأعمدة الأساسية:

| العمود | النوع | الافتراضي | الوصف |
|--------|-------|---------|-------|
| `id` | UUID | gen_random_uuid() | معرف الباقة |
| `name` | VARCHAR(255) | - | اسم الباقة (مطلوب) |
| `slug` | VARCHAR(255) | - | معرف المسار (مطلوب، فريد) |
| `description` | TEXT | NULL | وصف الباقة |
| `price` | NUMERIC(12,2) | 0 | سعر الاشتراك |
| `product_limit` / `productLimit` | INTEGER | 0 | حد المنتجات المسموح |
| `subscription_duration` / `subscriptionDuration` | INTEGER | 0 | مدة الاشتراك بالأيام |
| `is_active` / `isActive` | BOOLEAN | false | هل الباقة مفعلة |
| `metadata` | JSONB | NULL | بيانات إضافية (مثل المزايا) |
| `created_at` / `createdAt` | TIMESTAMP | now() | وقت الإنشاء |
| `updated_at` / `updatedAt` | TIMESTAMP | now() | آخر تحديث |

### مثال من البيانات:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "الباقة الأساسية",
  "slug": "basic",
  "description": "للمتاجر الصغيرة والناشئة",
  "price": 5000,
  "product_limit": 50,
  "productLimit": 50,
  "subscription_duration": 30,
  "subscriptionDuration": 30,
  "is_active": true,
  "isActive": true,
  "metadata": {
    "features": ["ميزة 1", "ميزة 2", "ميزة 3"]
  },
  "created_at": "2026-06-20T10:00:00+00:00",
  "createdAt": "2026-06-20T10:00:00+00:00"
}
```

---

## 🔧 دوال الخدمة (Service Functions)

### 1. `createStorePackage(pkg)`
**الغرض:** إنشاء باقة جديدة

```typescript
const newPackage = await createStorePackage({
  name: "الباقة المتقدمة",
  slug: "advanced",
  description: "للمتاجر الكبيرة",
  price: 10000,
  productLimit: 100,
  subscriptionDuration: 30,
  isActive: true,
  metadata: {
    features: ["ميزة 1", "ميزة 2"]
  }
});

// النتيجة
if (newPackage) {
  console.log("تم إنشاء الباقة:", newPackage.id);
} else {
  console.error("فشل الإنشاء");
}
```

**ملاحظات:**
- ✅ `description` و `metadata` يمكن أن تكون `undefined` (تصير `null` في DB)
- ✅ يتم إرسال البيانات بصيغة مزدوجة (snake_case و camelCase)
- ✅ عند كون `metadata` فارغاً يصير `null`

---

### 2. `updateStorePackage(packageId, updates)`
**الغرض:** تحديث باقة موجودة

```typescript
const updated = await updateStorePackage(packageId, {
  name: "الباقة المتقدمة المحسّنة",
  price: 12000,
  isActive: true,
  // يمكن تحديث أي حقل تريده
});

if (updated) {
  console.log("تم التحديث بنجاح");
} else {
  console.error("فشل التحديث");
}
```

**ملاحظات:**
- ✅ يمكن تحديث أي حقل بدون الحاجة لتحديث الكل
- ✅ `description` عند تحديثها تصير `null` إذا كانت فارغة
- ✅ `metadata` يصير `null` إذا كان فارغاً أو كائن فارغ

---

### 3. `deleteStorePackage(packageId)`
**الغرض:** حذف باقة

```typescript
const success = await deleteStorePackage(packageId);

if (success) {
  console.log("تم الحذف بنجاح");
} else {
  console.error("فشل الحذف");
}
```

---

### 4. `fetchStorePackages()`
**الغرض:** استرجاع جميع الباقات

```typescript
const packages = await fetchStorePackages();

packages.forEach(pkg => {
  console.log(pkg.name, pkg.price);
});
```

---

## 🎨 مكون الواجهة (UI Component)

### `SubscriptionsTab` - موقع:
`src/app/(pages)/admin/components/subscriptions-tab.tsx`

### الوظائف الرئيسية:

#### 1️⃣ عرض قائمة الباقات
- جدول لسطح المكتب
- بطاقات للهواتف

#### 2️⃣ إضافة باقة جديدة
```
زر "إضافة باقة جديدة" → Dialog
├── اسم الباقة (مطلوب)
├── المعرف/Slug (اختياري - يُولّد تلقائياً)
├── السعر
├── حد المنتجات
├── مدة الاشتراك
├── الوصف
├── المزايا (كل واحدة في سطر)
├── Metadata (JSON)
└── الحالة (مفعل/معطل)
```

#### 3️⃣ تعديل باقة موجودة
- نفس الخطوات أعلاه مع ملء البيانات الحالية

#### 4️⃣ حذف باقة
- تأكيد من المستخدم ثم حذف

#### 5️⃣ تعيين الباقة للمتاجر
- اختيار متجر
- اختيار الباقة
- زر "تعيين"

---

## 🐛 المشاكل الشائعة والحلول

### المشكلة 1: Metadata يظهر كـ `{ features: [] }`
**المشكلة:** عندما لا توجد مزايا، تُحفظ باقة بـ metadata فارغ

**الحل المطبق:**
```typescript
// ✅ الآن يتم إرسال null بدلاً من { features: [] }
if (featureLines.length > 0 || metadata) {
  metadata = { ...(metadata || {}), features: featureLines };
} else {
  metadata = null;
}
```

---

### المشكلة 2: Description لا يتحول إلى NULL عند التحديث
**المشكلة:** عند مسح الوصف، يبقى في DB

**الحل المطبق:**
```typescript
// ✅ الآن يتم تحويل الوصف الفارغ إلى null
if (updates.description !== undefined) {
  payload.description = updates.description || null;
}
```

---

### المشكلة 3: الأعمدة المزدوجة (snake_case vs camelCase)
**المشكلة:** عدم التأكد أي عمود يُرسل

**الحل المطبق:**
```typescript
// ✅ يتم إرسال كلا الإصدارين
payload.product_limit = updates.productLimit;
payload.productLimit = updates.productLimit;
```

---

## 📝 نصائح تطوير

### ✅ الممارسات الجيدة

```typescript
// 1. استخدم undefined للحقول الاختيارية
const updates = {
  name: "اسم جديد",
  description: undefined,  // ✅ جيد
};

// 2. تحقق من null و undefined معاً
if (value != null) {
  // القيمة موجودة
}

// 3. استخدم ?? للقيم الافتراضية
const duration = row.subscriptionDuration ?? row.subscription_duration ?? 0;

// 4. اتحقق من نوع البيانات
if (typeof value === 'number') {
  // تعامل مع الرقم
}
```

### ❌ تجنب

```typescript
// 1. لا تخلط بين snake_case و camelCase
const bad = { storeId: value };  // ❌ ستفقد البيانات

// 2. لا تفترض وجود البيانات
const { description } = row;  // ❌ قد تكون undefined

// 3. لا تُرسل كائنات فارغة
{ metadata: {} }  // ❌ يجب أن تكون null

// 4. لا تنسى معالجة الأخطاء
const result = await updateStorePackage(...);
if (!result) {
  // معالجة الخطأ
}
```

---

## 🧪 اختبار سريع

### 1. اختبر الإنشاء
```typescript
// الخطوة 1: افتح صفحة الإدارة
// الخطوة 2: اضغط "إضافة باقة جديدة"
// الخطوة 3: أدخل البيانات
// الخطوة 4: اضغط "إضافة الباقة"
// التوقع: رسالة نجاح ✅ وظهور الباقة في القائمة
```

### 2. اختبر التعديل
```typescript
// الخطوة 1: اضغط زر التعديل على باقة موجودة
// الخطوة 2: غير السعر مثلاً
// الخطوة 3: اضغط "تحديث الباقة"
// التوقع: رسالة نجاح ✅ والسعر الجديد يظهر
```

### 3. اختبر الحذف
```typescript
// الخطوة 1: اضغط زر الحذف
// الخطوة 2: أكد الحذف
// التوقع: رسالة نجاح ✅ والباقة تختفي من القائمة
```

### 4. اختبر التعيين
```typescript
// الخطوة 1: اختر متجر من القائمة
// الخطوة 2: اختر باقة من dropdown
// الخطوة 3: اضغط "تعيين"
// التوقع: رسالة نجاح ✅ والباقة تُرسل للمتجر
```

---

## 📚 مراجع إضافية

- [SUPABASE_DATABASE_SCHEMA.md](/docs/SUPABASE_DATABASE_SCHEMA.md) - المخطط الكامل
- [SUBSCRIPTIONS_PACKAGE_ANALYSIS_REPORT.md](/docs/SUBSCRIPTIONS_PACKAGE_ANALYSIS_REPORT.md) - التقرير المفصل
- [subscriptions-tab.tsx](/src/app/(pages)/admin/components/subscriptions-tab.tsx) - كود المكون
- [supabase-db.ts](/src/services/supabase-db.ts) - كود الخدمة

---

## 🎯 الخطوات التالية (Optional)

1. **إضافة اختبارات وحدة (Unit Tests)** لجميع الدوال
2. **إضافة validation على الواجهة الأمامية** قبل الإرسال
3. **تحسين رسائل الخطأ** لتكون أكثر وضوحاً
4. **إضافة pagination** إذا كان هناك عدد كبير من الباقات
5. **تطبيق نفس الإصلاحات** على جداول أخرى

---

**آخر تحديث:** 2026-06-20  
**حالة النظام:** ✅ جاهز للإنتاج
