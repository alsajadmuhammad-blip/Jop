
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  /** نسبة الخصم من 1 إلى 99، القيمة 0 أو undefined تعني لا يوجد خصم */
  discountPercent?: number;
  imageUrl?: string;
  storeId: string;
  categoryId?: string;
  sectionId?: string;
  sectionName?: string;
  sku?: string;
  stock: number;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** صور إضافية (ثاني صورة فما فوق) */
  images?: string[];
  /** فلاش سيل — يُضاف عند جلب المنتجات إذا كان هناك عرض نشط */
  flashPrice?: number;
  flashEndsAt?: string; // ISO string
  /** تقييم المنتج (0–5) */
  rating?: number;
  /** عدد المقيّمين */
  reviews?: number;
  /** حد التنبيه لانخفاض المخزون (افتراضي 5) */
  lowStockThreshold?: number;
  /** هل هذا المنتج له متغيرات (مقاس / لون / ...)؟ */
  hasVariants?: boolean;
  /** تعريف أنواع المتغيرات لهذا المنتج (مثال: [{name:"اللون",values:["أسود","أبيض"]}]) */
  variantAttributes?: VariantAttributeDef[];
  /** كل تركيبات المتغيرات الفعلية (تُجلب بشكل منفصل عادة) */
  variants?: ProductVariant[];
};

/** تعريف نوع متغيّر واحد (اسم + القيم الممكنة) — يُخزَّن على المنتج نفسه */
export type VariantAttributeDef = {
  name: string;      // مثال: "المقاس" أو "اللون"
  values: string[];  // مثال: ["S","M","L"]
};

/** تركيبة متغيّر واحدة فعلية للمنتج (مثال: {المقاس:"L", اللون:"أسود"}) */
export type ProductVariant = {
  id: string;
  productId: string;
  storeId: string;
  /** القيم المختارة لكل نوع متغيّر — مثال: {"المقاس":"L","اللون":"أسود"} */
  attributes: Record<string, string>;
  sku?: string;
  /** سعر خاص بهذه التركيبة — إن لم يُحدَّد يُستخدم سعر المنتج الأساسي */
  price?: number;
  stock: number;
  imageUrl?: string;
  isActive?: boolean;
};

/** يبني تسمية نصية مقروءة لتركيبة متغيّر (مثال: "أسود / L") */
export function formatVariantLabel(attributes: Record<string, string>): string {
  return Object.values(attributes).filter(Boolean).join(' / ');
}

/** يحسب السعر الفعّال آخذاً بعين الاعتبار المتغيّر المختار إن وُجد */
export function getVariantEffectivePrice(
  product: Pick<Product, 'price' | 'discountPercent' | 'flashPrice' | 'flashEndsAt'>,
  variant?: Pick<ProductVariant, 'price'> | null,
): number {
  if (variant?.price != null && variant.price > 0) {
    // المتغيّر له سعر خاص — الخصومات/الفلاش تبقى مرتبطة بالمنتج الأساسي فقط
    return variant.price;
  }
  return getEffectivePrice(product);
}

/** أقل سعر بين كل تركيبات المتغيرات النشطة، أو سعر المنتج الأساسي إن لم توجد متغيرات */
export function getStartingPrice(product: Pick<Product, 'price' | 'discountPercent' | 'flashPrice' | 'flashEndsAt' | 'variants' | 'hasVariants'>): number {
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    const active = product.variants.filter(v => v.isActive !== false);
    const pool = active.length > 0 ? active : product.variants;
    const prices = pool.map(v => getVariantEffectivePrice(product, v));
    return Math.min(...prices);
  }
  return getEffectivePrice(product);
}

/** إجمالي المخزون عبر كل التركيبات (أو مخزون المنتج نفسه إن لم توجد متغيرات) */
export function getTotalVariantStock(product: Pick<Product, 'stock' | 'variants' | 'hasVariants'>): number {
  if (product.hasVariants && product.variants) {
    return product.variants.reduce((s, v) => s + (v.stock || 0), 0);
  }
  return product.stock;
}

/** يحسب السعر بعد الخصم العادي */
export function getDiscountedPrice(product: Pick<Product, 'price' | 'discountPercent'>): number {
  if (!product.discountPercent || product.discountPercent <= 0) return product.price;
  return Math.round(product.price * (1 - product.discountPercent / 100));
}

/** هل المنتج عليه خصم فعّال؟ */
export function hasActiveDiscount(product: Pick<Product, 'discountPercent'>): boolean {
  return !!(product.discountPercent && product.discountPercent > 0 && product.discountPercent < 100);
}

/** هل المنتج عليه فلاش سيل نشط؟ */
export function hasActiveFlashSale(product: Pick<Product, 'flashPrice' | 'flashEndsAt'>): boolean {
  return !!(
    product.flashPrice &&
    product.flashPrice > 0 &&
    product.flashEndsAt &&
    new Date(product.flashEndsAt) > new Date()
  );
}

/** السعر الفعلي للمنتج (فلاش سيل > خصم عادي > سعر أصلي) */
export function getEffectivePrice(product: Pick<Product, 'price' | 'discountPercent' | 'flashPrice' | 'flashEndsAt'>): number {
  if (hasActiveFlashSale(product) && product.flashPrice) return product.flashPrice;
  return getDiscountedPrice(product);
}

export type Section = {
  id: string;
  name: string;
  storeId: string;
  imageUrl?: string;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
};

/** public = للعام | renewal = للتجديد فقط | both = للاثنين */
export type PackageVisibility = 'public' | 'renewal' | 'both';

export type StorePackage = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  productLimit: number;
  subscriptionDuration: number;
  isActive: boolean;
  visibility: PackageVisibility;
  /**
   * نقاط هدف المسوّق: عدد النقاط التي تُحتسب للمسوّق عند تفعيل متجر بهذه الباقة.
   * القيمة الافتراضية 1. يمكن ضبطها من لوحة التحكم لجعل الباقات المميزة تُحتسب بنقاط أكثر.
   * يجب إضافة عمود target_points INTEGER DEFAULT 1 في جدول store_packages بـ Supabase.
   */
  targetPoints?: number;
  metadata?: Record<string, any> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Store = {
  id: string;
  name: string;
  slug?: string;               // URL-friendly identifier (e.g. "my-store")
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rating: number;
  reviews: number;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  type: "فعلي" | "إلكتروني";
  /**
   * نوع السوق/النشاط لهذا المتجر (مثال: 'هواتف'، 'قطع غيار'، 'ملابس'، ...)
   */
  marketType: string;
  businessHours?: {
    open: number;  // 24-hour format
    close: number; // 24-hour format
  };
  products: Product[];
  whatsappNumber?: string;
  hasDelivery: boolean;
  isActive: boolean;           // Admin control
  productLimit: number;        // Admin control. Use Number.MAX_SAFE_INTEGER for "unlimited".
  subscriptionDuration: number; // Admin control, in days
  activationDate: string | null; // ISO date string, null for pending stores
  ownerId: string | null;      // UID of the user who owns the store
  ownerEmail?: string;
  password?: string;
  packageId?: string;          // FK → store_packages.id
  packageName?: string;
  paymentProofUrl?: string;
  createdAt: string | number | null;
  registeredByAgentId?: string | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type User = {
  id: string; // Row ID in the database (typically same as Auth UID)
  name?: string; // For customers
  email: string;
  storeId: string | null; // Can be null for customers
  role: 'customer' | 'store' | 'admin' | 'representative'; // User roles are now required
  paymentSystem?: 'salary' | 'commission'; // For representatives/partners
  totalEarnings?: number; // For representatives/partners
  monthlySalary?: number; // For salary-based partners
  requiredStoresCount?: number; // Number of stores required for salary
  commissionPercent?: number;   // نسبة عمولة على كل متجر إضافي بعد الهدف (أو على كل متجر في نظام النسبة)
  packageDiscountPercent?: number; // خصم % على سعر الباقة يمنحه الشريك للمتاجر التي تستخدم كوده
  partnerCode?: string;         // الكود الفريد للشريك (يدخله صاحب المتجر عند التسجيل)
  monthlyActivations?: number; // For salary-based partners — نقاط شهرية (مش عدد متاجر فقط)
  lastResetDate?: string; // ISO date string for resetting monthly count
  /**
   * نقاط كل باقة لهذا الشريك تحديداً — JSONB في قاعدة البيانات
   * مثال: { "pkg-uuid-1": 2, "pkg-uuid-2": 1 }
   * إذا لم تُحدَّد → 1 نقطة افتراضية
   */
  packagePoints?: Record<string, number> | null;
  firstLogin?: boolean; // True if user hasn't changed password yet after registration
};

export type HeroCarouselItem = {
  id: string; // Use ID for stable key
  src: string;
  hint: string;
  text: string;
  storeId?: string; // Link slide to a store
};

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'delivering' | 'delivered' | 'cancelled';

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Order = {
  id: string;
  storeId: string;
  storeName: string;
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerPhoneBackup?: string | null;
  customerGovernorate?: string | null;
  customerAddress?: string | null;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: 'whatsapp' | 'cash' | 'transfer';
};
