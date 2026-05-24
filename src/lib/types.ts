
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
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

export type StorePackage = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  productLimit: number;
  subscriptionDuration: number;
  isActive: boolean;
  metadata?: Record<string, any> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Store = {
  id: string;
  name:string;
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
   * - 'spare-parts' = مركز قطع غيار
   * - 'phones' = متجر هواتف
   * - 'clothes' = ملابس
   * - ...
   */
  marketType: string;
  businessHours?: {
    open: number; // 24-hour format
    close: number; // 24-hour format
  };
  products: Product[];
  whatsappNumber?: string;
  hasDelivery: boolean;
  isActive: boolean; // Admin control
  productLimit: number; // Admin control. Use a large number (e.g., Number.MAX_SAFE_INTEGER) for "unlimited".
  subscriptionDuration: number; // Admin control, in days
  activationDate: string | null; // ISO date string, can be null for pending stores
  ownerId: string | null; // UID of the user who owns the store, null for pending
  ownerEmail?: string; // Store owner email for activation
  password?: string; // Store owner password for activation
  packageName?: string; // Subscription package name (e.g., 'basic', 'advanced', 'unlimited')
  paymentProofUrl?: string; // Payment proof image/document URL
  createdAt: string | number | null; // ISO date string, timestamp, or null
  registeredByAgentId?: string | null; // UID of the representative who registered the store
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
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  paymentMethod?: 'whatsapp' | 'cash' | 'transfer'; // How the order was initiated
};
