# نظام الحجز والطلبات - دليل التطبيق

## 📋 النظرة العامة

تم تطبيق نظام حجز ديناميكي يسمح للعملاء بـ:
1. إضافة المنتجات إلى السلة
2. إرسال طلب إلى متجر معين
3. الطلب يُحفظ في **Supabase** 
4. تحويل العميل إلى **WhatsApp** برسالة جاهزة بتفاصيل الطلب
5. تتبع حالة الطلب من صفحة "طلباتي"

ويسمح لصاحب المتجر بـ:
1. عرض جميع الطلبات المستلمة من العملاء
2. تحديث حالة كل طلب (بدء التجهيز، جاهز للتسليم، إلخ)
3. التواصل المباشر مع العميل عبر WhatsApp

---

## 🛠️ الخطوات المطلوبة للتشغيل

### 1️⃣ إعداد قاعدة البيانات في Supabase

#### الخطوة أ: أنشئ جدول `orders`

انسخ والصق كود SQL من `docs/supabase-orders-setup.sql` في **Supabase SQL Editor**:

```bash
1. اذهب إلى https://app.supabase.com
2. انقر على مشروعك
3. اذهب إلى "SQL Editor"
4. انقر على "New Query"
5. انسخ كل الكود من supabase-orders-setup.sql
6. اضغط "Run" (أو Cmd+Enter)
```

#### الخطوة ب: تحقق من الجدول

```sql
SELECT * FROM orders LIMIT 1;
```

---

### 2️⃣ مديقا بيانات الجداول المطلوبة الأخرى

تأكد من وجود هذه الجداول في قاعدة البيانات:

- ✅ `stores` - جدول المتاجر
- ✅ `products` - جدول المنتجات
- ✅ `users` - جدول المستخدمين

---

## 🏗️ بنية النظام

### المكونات الرئيسية:

```
📁 src/
├── services/
│   └── orders.ts          # خدمات إدارة الطلبات (CRUD)
├── components/
│   ├── cart/
│   │   └── cart-sheet.tsx # سلة التسوق مع نموذج الطلب
│   └── dashboard/
│       └── store-orders-tab.tsx # لوحة الطلبات للمتجر
├── app/(pages)/
│   ├── orders/page.tsx    # صفحة تتبع الطلبات للعميل
│   └── dashboard/store/   # لوحة تحكم المتجر
└── lib/
    └── types.ts           # نماذج TypeScript
```

---

## 📤 واجهات API

### خدمة الطلبات (`src/services/orders.ts`)

#### إنشاء طلب جديد
```typescript
await createOrder(
  storeId: string,
  storeName: string,
  customerId: string,
  customerName: string | undefined,
  customerPhone: string | undefined,
  items: OrderItem[],
  totalAmount: number,
  notes?: string
)
```

#### جلب طلبات المتجر
```typescript
const orders = await fetchStoreOrders(storeId: string)
```

#### جلب طلبات العميل
```typescript
const orders = await fetchCustomerOrders(customerId: string)
```

#### تحديث حالة الطلب
```typescript
await updateOrderStatus(orderId: string, status: OrderStatus)
```

---

## 🔄 تدفق استخدام النظام

### من جهة العميل:

```
1. يضيف المنتجات إلى السلة
   ↓
2. يضغط "إتمام الطلب"
   ↓
3. يظهر dialog يطلب:
   - رقم الهاتف ✓
   - ملاحظات (اختيارية)
   ↓
4. يضغط "إرسال الطلب"
   ↓
5. يُحفظ الطلب في Supabase ✓
   ↓
6. يتحول إلى WhatsApp برسالة جاهزة ✓
   ↓
7. يمكنه تتبع الطلب من "طلباتي" ✓
```

### من جهة صاحب المتجر:

```
1. يذهب إلى Dashboard → الطلبات
   ↓
2. يرى جميع الطلبات الجديدة
   ↓
3. يختار حالة جديدة للطلب
   (قاائمة الحالات تتغير حسب الحالة الحالية)
   ↓
4. يؤكد التحديث
   ↓
5. الطلب يُحدّث في قاعدة البيانات ✓
   ↓
6. يمكن للعميل تتبع الحالة ✓
```

---

## 🎯 حالات الطلب (Order Status Flow)

```
┌─────────────┐
│   PENDING   │ ← الحالة الابتدائية
└──────┬──────┘
       ├─→ CANCELLED ✗
       └─→ ACCEPTED ✓
           └──────┬──────┐
                  │      └─→ CANCELLED ✗
                  └─→ PREPARING
                      └──────┬─────────────┐
                             │             └─→ CANCELLED ✗
                             ├─→ READY_FOR_PICKUP
                             │   └─→ DELIVERING
                             └─→ DELIVERING
                                 └──────┬──────┐
                                        │      └─→ CANCELLED ✗
                                        └─→ DELIVERED ✓
```

---

## 💾 نموذج البيانات

### Order
```typescript
type Order = {
  id: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  paymentMethod?: 'whatsapp' | 'cash' | 'transfer';
}

type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
```

---

## 🔒 الأمان والصلاحيات (RLS)

تم تفعيل **Row Level Security** في Supabase:

- ✅ العملاء يرون فقط طلباتهم الخاصة
- ✅ أصحاب المتاجر يرون فقط طلبات متاجرهم
- ✅ يمكن إنشاء وتعديل الطلبات فقط من قِبل المالكين

---

## ⚙️ متطلبات البيئة

تأكد من تعيين متغيرات البيئة:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🧪 الاختبار

### 1. اختبر جلب الطلبات:

```typescript
import { fetchStoreOrders, fetchCustomerOrders } from '@/services/orders';

// جلب طلبات المتجر
const storeOrders = await fetchStoreOrders('store-id-123');
console.log(storeOrders);

// جلب طلبات العميل
const customerOrders = await fetchCustomerOrders('customer-id-456');
console.log(customerOrders);
```

### 2. اختبر إنشاء طلب:

```typescript
import { createOrder } from '@/services/orders';

const order = await createOrder(
  'store-id',
  'محل بقالة',
  'customer-id',
  'أحمد',
  '09123456789',
  [
    {
      productId: '1',
      productName: 'حليب',
      quantity: 2,
      unitPrice: 5000,
      totalPrice: 10000,
    }
  ],
  10000,
  'توصيل إلى المنزل رجاء'
);

console.log(order);
```

---

## 🚀 الميزات المستقبلية المقترحة

- [ ] إضافة نظام الإشعارات (Push Notifications)
- [ ] إضافة رسائل email برسالة تأكيد الطلب
- [ ] إضافة نظام التقييمات والآراء
- [ ] إضافة متابعة الموقع الجغرافي للطلبات
- [ ] إضافة نظام الدفع الإلكتروني
- [ ] إضافة برامج الولاء والحسومات

---

## 📞 استكشاف الأخطاء

### المشكلة: الطلبات لا تظهر
**الحل:**
- تحقق من وجود جدول `orders` في Supabase
- تحقق من صحة `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- افتح Browser DevTools وتحقق من الأخطاء في Console

### المشكلة: RLS errors
**الحل:**
- تأكد من تسجيل الدخول (auth.uid() موجود)
- تحقق من سياسات RLS في Supabase Dashboard

### المشكلة: رقم WhatsApp لا يعمل
**الحل:**
- تأكد من حفظ `whatsapp_number` في جدول `stores`
- استخدم صيغة دولية (مثل: 966123456789)

---

## 📚 المراجع

- [Supabase Documentation](https://supabase.com/docs)
- [WhatsApp API](https://www.whatsapp.com/business/downloads/links/api)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

