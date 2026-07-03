
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
};

/** يحسب السعر بعد الخصم */
export function getDiscountedPrice(product: Pick<Product, 'price' | 'discountPercent'>): number {
  if (!product.discountPercent || product.discountPercent <= 0) return product.price;
  return Math.round(product.price * (1 - product.discountPercent / 100));
}

/** هل المنتج عليه خصم فعّال؟ */
export function hasActiveDiscount(product: Pick<Product, 'discountPercent'>): boolean {
  return !!(product.discountPercent && product.discountPercent > 0 && product.discountPercent < 100);
}

export type Section = {
  id: string;
  name: string;
  storeId: string;
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
  paymentSystem?: 'salary' | 'commission'; // For representatives
  totalEarnings?: number; // For representatives
  monthlySalary?: number; // For salary-based representatives
  requiredStoresCount?: number; // Number of stores required for salary
  monthlyActivations?: number; // For salary-based representatives
  lastResetDate?: string; // ISO date string for resetting monthly count
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
