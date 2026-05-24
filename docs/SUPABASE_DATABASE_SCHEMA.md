# Supabase Database Schema - المخطط المعتمد

> **⚠️ مهم جداً**: هذا هو المخطط الرسمي والمعتمد الحالي في قاعدة بيانات Supabase في الإنتاج.
> جميع التطويرات يجب أن تتوافق مع هذا المخطط تماماً.

## جداول قاعدة البيانات

### 1. جدول `hero_carousel_items` - صور الشريط المتحرك الرئيسي
```sql
CREATE TABLE public.hero_carousel_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  src TEXT NOT NULL,                         -- رابط الصورة في Supabase Storage
  hint TEXT NULL,                             -- نص تلميح
  text TEXT NULL,                             -- نص إضافي
  store_id UUID NULL,                         -- معرف المتجر (قديم)
  "storeId" UUID NULL,                        -- معرف المتجر (جديد - معايير camelCase)
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT hero_carousel_items_pkey PRIMARY KEY (id),
  CONSTRAINT hero_carousel_items_storeId_fkey FOREIGN KEY ("storeId") REFERENCES stores (id) ON DELETE SET NULL,
  CONSTRAINT hero_carousel_items_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS hero_carousel_items_store_id_idx ON public.hero_carousel_items USING btree (store_id);
```

**الغرض**: تخزين بيانات الصور والنصوص التي تظهر في الشريط المتحرك الرئيسي

---

### 2. جدول `categories` - الفئات
```sql
CREATE TABLE public.categories (
  id CHARACTER VARYING(100) NOT NULL,
  name CHARACTER VARYING(255) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
```

**الغرض**: تخزين فئات المنتجات (أدوية، أجهزة طبية، إلخ)

---

### 3. جدول `orders` - الطلبات
```sql
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  "storeId" UUID NOT NULL,
  store_name CHARACTER VARYING(255) NOT NULL,
  "storeName" CHARACTER VARYING(255) NOT NULL,
  customer_id UUID NOT NULL,
  "customerId" UUID NOT NULL,
  customer_name CHARACTER VARYING(255) NULL,
  "customerName" CHARACTER VARYING(255) NULL,
  customer_phone CHARACTER VARYING(20) NULL,
  "customerPhone" CHARACTER VARYING(20) NULL,
  items JSONB NOT NULL,                       -- بيانات العناصر بصيغة JSON
  total_amount NUMERIC(12, 2) NOT NULL,
  "totalAmount" NUMERIC(12, 2) NOT NULL,
  status CHARACTER VARYING(50) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  payment_method CHARACTER VARYING(50) NULL DEFAULT 'whatsapp',
  "paymentMethod" CHARACTER VARYING(50) NULL DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customerId_fkey FOREIGN KEY ("customerId") REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT orders_storeId_fkey FOREIGN KEY ("storeId") REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS orders_store_id_idx ON public.orders USING btree (store_id);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders USING btree (customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders USING btree (created_at DESC);
```

**الغرض**: تخزين بيانات الطلبات الصادرة من العملاء

---

### 4. جدول `products` - المنتجات
```sql
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  "storeId" UUID NOT NULL,
  category_id CHARACTER VARYING(100) NULL,
  "categoryId" CHARACTER VARYING(100) NULL,
  name CHARACTER VARYING(255) NOT NULL,
  description TEXT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT NULL,                        -- رابط الصورة في Supabase Storage
  "imageUrl" TEXT NULL,
  is_featured BOOLEAN NULL DEFAULT false,
  "isFeatured" BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_storeId_fkey FOREIGN KEY ("storeId") REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS products_store_id_idx ON public.products USING btree (store_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products USING btree (category_id);
CREATE INDEX IF NOT EXISTS products_is_featured_idx ON public.products USING btree (is_featured);
```

**الغرض**: تخزين بيانات المنتجات

---

### 5. جدول `store_sections` - أقسام المتجر
```sql
CREATE TABLE public.store_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  "storeId" UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),

  CONSTRAINT store_sections_pkey PRIMARY KEY (id),
  CONSTRAINT store_sections_storeId_fkey FOREIGN KEY ("storeId") REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT store_sections_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS store_sections_store_id_idx ON public.store_sections USING btree (store_id);

**الغرض**: تخزين أقسام المنتجات داخل المتجر لتصنيف المنتجات في واجهة المتجر

---

### 6. جدول `store_packages` - خطط الاشتراك
```sql
CREATE TABLE public.store_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING(255) NOT NULL,
  slug CHARACTER VARYING(255) NOT NULL,
  description TEXT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  product_limit INTEGER NULL DEFAULT 0,
  "productLimit" INTEGER NULL DEFAULT 0,
  subscription_duration INTEGER NULL DEFAULT 0,
  "subscriptionDuration" INTEGER DEFAULT 0,
  is_active BOOLEAN NULL DEFAULT false,
  "isActive" BOOLEAN NULL DEFAULT false,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),

  CONSTRAINT store_packages_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS store_packages_slug_idx ON public.store_packages USING btree (slug);
CREATE INDEX IF NOT EXISTS store_packages_is_active_idx ON public.store_packages USING btree (is_active);

**الغرض**: تخزين خطط الاشتراك التي يمكن تعيينها للمتاجر

---

### 7. جدول `store_package_assignments` - تعيينات خطط الاشتراك
```sql
CREATE TABLE public.store_package_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  "storeId" UUID NOT NULL,
  package_id UUID NOT NULL,
  "packageId" UUID NOT NULL,
  assigned_by UUID NULL,
  "assignedBy" UUID NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "assignedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN NULL DEFAULT true,
  "isActive" BOOLEAN NULL DEFAULT true,
  custom_product_limit INTEGER NULL,
  "customProductLimit" INTEGER NULL,
  custom_subscription_duration INTEGER NULL,
  "customSubscriptionDuration" INTEGER NULL,
  custom_price NUMERIC(12, 2) NULL,
  "customPrice" NUMERIC(12, 2) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),

  CONSTRAINT store_package_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT store_package_assignments_storeId_fkey FOREIGN KEY ("storeId") REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT store_package_assignments_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT store_package_assignments_packageId_fkey FOREIGN KEY ("packageId") REFERENCES store_packages (id) ON DELETE CASCADE,
  CONSTRAINT store_package_assignments_package_id_fkey FOREIGN KEY (package_id) REFERENCES store_packages (id) ON DELETE CASCADE,
  CONSTRAINT store_package_assignments_assignedBy_fkey FOREIGN KEY ("assignedBy") REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT store_package_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS store_package_assignments_store_id_idx ON public.store_package_assignments USING btree (store_id);
CREATE INDEX IF NOT EXISTS store_package_assignments_package_id_idx ON public.store_package_assignments USING btree (package_id);
CREATE INDEX IF NOT EXISTS store_package_assignments_is_active_idx ON public.store_package_assignments USING btree (is_active);

**الغرض**: ربط المتاجر بخطط الاشتراك وتمكين التخصيص الفردي لكل متجر

---

### 8. جدول `inventory_movements` - حركات المخزون
```sql
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  "productId" UUID NOT NULL,
  store_id UUID NOT NULL,
  "storeId" UUID NOT NULL,
  quantity_change INTEGER NOT NULL,
  "quantityChange" INTEGER NOT NULL,
  created_by UUID NULL,
  "createdBy" UUID NULL,
  reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),

  CONSTRAINT inventory_movements_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_movements_productId_fkey FOREIGN KEY ("productId") REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_storeId_fkey FOREIGN KEY ("storeId") REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT inventory_movements_createdBy_fkey FOREIGN KEY ("createdBy") REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS inventory_movements_product_id_idx ON public.inventory_movements USING btree (product_id);
CREATE INDEX IF NOT EXISTS inventory_movements_store_id_idx ON public.inventory_movements USING btree (store_id);
CREATE INDEX IF NOT EXISTS inventory_movements_created_by_idx ON public.inventory_movements USING btree (created_by);

**الغرض**: تسجيل تغييرات المخزون لكل منتج ومتجر مع تتبع المسؤول عن التغيير

---

### 9. جدول `stores` - المتاجر
```sql
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  logo_url TEXT NULL,                         -- رابط الشعار في Supabase Storage
  "logoUrl" TEXT NULL,
  cover_image_url TEXT NULL,                  -- رابط صورة الغلاف في Supabase Storage
  "coverImageUrl" TEXT NULL,
  rating NUMERIC(3, 2) NULL DEFAULT 0,
  reviews INTEGER NULL DEFAULT 0,
  location TEXT NULL,
  latitude NUMERIC NULL,
  longitude NUMERIC NULL,
  type CHARACTER VARYING(50) NULL DEFAULT 'إلكتروني',
  market_type CHARACTER VARYING(100) NULL,
  "marketType" CHARACTER VARYING(100) NULL,
  business_hours JSONB NULL,
  "businessHours" JSONB NULL,
  whatsapp_number CHARACTER VARYING(50) NULL,
  "whatsappNumber" CHARACTER VARYING(50) NULL,
  has_delivery BOOLEAN NULL DEFAULT false,
  "hasDelivery" BOOLEAN NULL DEFAULT false,
  is_active BOOLEAN NULL DEFAULT false,
  "isActive" BOOLEAN NULL DEFAULT false,
  product_limit INTEGER NULL DEFAULT 50,
  "productLimit" INTEGER NULL DEFAULT 50,
  subscription_duration INTEGER NULL DEFAULT 30,
  "subscriptionDuration" INTEGER NULL DEFAULT 30,
  activation_date TIMESTAMP WITH TIME ZONE NULL,
  "activationDate" TIMESTAMP WITH TIME ZONE NULL,
  owner_id UUID NULL,
  "ownerId" UUID NULL,
  owner_email CHARACTER VARYING(255) NULL,
  "ownerEmail" CHARACTER VARYING(255) NULL,
  password TEXT NULL,
  payment_proof_url TEXT NULL,                -- رابط إثبات الدفع في Supabase Storage
  "paymentProofUrl" TEXT NULL,
  package_id UUID NULL,
  "packageId" UUID NULL,
  package_name CHARACTER VARYING(50) NULL,
  "packageName" CHARACTER VARYING(50) NULL,
  registered_by_agent_id UUID NULL,
  "registeredByAgentId" UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_ownerId_fkey FOREIGN KEY ("ownerId") REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT stores_packageId_fkey FOREIGN KEY ("packageId") REFERENCES store_packages (id) ON DELETE SET NULL,
  CONSTRAINT stores_registeredByAgentId_fkey FOREIGN KEY ("registeredByAgentId") REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT stores_registered_by_agent_id_fkey FOREIGN KEY (registered_by_agent_id) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS stores_market_type_idx ON public.stores USING btree (market_type);
CREATE INDEX IF NOT EXISTS stores_owner_id_idx ON public.stores USING btree (owner_id);
CREATE INDEX IF NOT EXISTS stores_package_id_idx ON public.stores USING btree (package_id);
CREATE INDEX IF NOT EXISTS stores_registered_by_agent_id_idx ON public.stores USING btree (registered_by_agent_id);
CREATE INDEX IF NOT EXISTS stores_is_active_idx ON public.stores USING btree (is_active);
```

**الغرض**: تخزين بيانات المتاجر/الصيدليات

---

### 10. جدول `users` - المستخدمون
```sql
CREATE TABLE public.users (
  id UUID NOT NULL,
  name CHARACTER VARYING(255) NOT NULL,
  email CHARACTER VARYING(255) NOT NULL,
  role CHARACTER VARYING(50) NOT NULL DEFAULT 'customer',
  store_id UUID NULL,
  "storeId" UUID NULL,
  first_login BOOLEAN NULL DEFAULT false,
  "firstLogin" BOOLEAN NULL DEFAULT false,
  payment_system CHARACTER VARYING(50) NULL,
  total_earnings NUMERIC(12, 2) NULL DEFAULT 0,
  monthly_salary NUMERIC(12, 2) NULL DEFAULT 0,
  required_stores_count INTEGER NULL DEFAULT 0,
  monthly_activations INTEGER NULL DEFAULT 0,
  last_reset_date TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT users_storeId_fkey FOREIGN KEY ("storeId") REFERENCES stores (id) ON DELETE SET NULL,
  CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE SET NULL,
  CONSTRAINT users_role_check CHECK (
    (role)::text = ANY (ARRAY['customer'::character varying, 'store'::character varying, 'admin'::character varying, 'representative'::character varying]::text[])
  )
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users USING btree (role);
CREATE INDEX IF NOT EXISTS users_store_id_idx ON public.users USING btree (store_id);
```

**الغرض**: تخزين بيانات المستخدمين

---

## ملاحظات مهمة جداً

### 1️⃣ استخدام Dual Naming (الأسماء المزدوجة)
جميع الجداول تحتوي على عمودين لكل حقل:
- `snake_case` (القديم): `store_id`, `image_url`, `created_at`
- `camelCase` (الجديد): `"storeId"`, `"imageUrl"`, `"createdAt"`

**السبب**: دعم الكود المكتوب بطريقتين مختلفتين. يجب استخدام **camelCase فقط** في الكود الجديد.

### 2️⃣ معرفات الصور والملفات
جميع رابط الصور تخزن كـ URLs من **Supabase Storage** فقط:
- `image_url` / `"imageUrl"` - في جدول products
- `logo_url` / `"logoUrl"` - في جدول stores
- `cover_image_url` / `"coverImageUrl"` - في جدول stores
- `src` - في جدول hero_carousel_items
- `payment_proof_url` / `"paymentProofUrl"` - في جدول stores

### 3️⃣ صيغة Timestamps
تستخدم جميع الجداول:
- `TIMESTAMP WITH TIME ZONE` (مع المنطقة الزمنية)
- قيمة افتراضية: `DEFAULT now()`

---

## اتصالات قاعدة البيانات

```
auth.users (من Supabase Auth)
    ↓
    ├── users.id → auth.users.id
    ├── orders.customerId → auth.users.id
    ├── stores.ownerId → auth.users.id
    └── stores.registeredByAgentId → auth.users.id

stores
    ↓
    ├── products.storeId → stores.id
    ├── orders.storeId → stores.id
    ├── hero_carousel_items.storeId → stores.id
    ├── store_sections.storeId → stores.id
    ├── store_package_assignments.storeId → stores.id
    ├── inventory_movements.storeId → stores.id

products
    ↓
    └── inventory_movements.productId → products.id

store_packages
    ↓
    └── store_package_assignments.packageId → store_packages.id

categories
    └── products.categoryId → categories.id
```

---

## ملفات التخزين المرتبطة

> **⚠️ قاعدة ذهبية**: جميع الملفات والصور تخزن **فقط وحصراً** في **Supabase Storage**

### Supabase Storage Buckets (المتوقعة)
- `store-logos` - شعارات المتاجر
- `store-covers` - صور غلاف المتاجر
- `product-images` - صور المنتجات
- `hero-carousel` - صور الشريط المتحرك الرئيسي
- `payment-proofs` - إثباتات الدفع والتحويلات

---

**آخر تحديث**: 13 مايو 2026
**الحالة**: ✅ معتمد ومستخدم في الإنتاج
