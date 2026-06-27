
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { StoreOwnerNavbar } from "./navbar";
import { PlusCircle, AlertTriangle, Edit, Trash2, Package, Image as ImageIcon, Package2, LogOut, Info, ShoppingCart as ShoppingCartIcon, Truck, Globe, CreditCard, CalendarDays, CheckCircle2, Clock, ExternalLink, Tag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { differenceInDays, parseISO } from "date-fns";
import type { Product, Store, Section, StorePackage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Removed ProductFormDialog - now using separate page
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { deleteProduct, fetchProductsByStore, fetchStoreById, fetchStoreSections, createStoreSection, updateStoreSection, deleteStoreSection, fetchStorePackages } from "@/services/supabase-db";
import { Label } from "@/components/ui/label";
import { supabase } from '@/services/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogoUploader } from "@/components/dashboard/logo-uploader";
import { StoreOrdersTab } from "@/components/dashboard/store-orders-tab";

// ===== Dashboard Product Card =====
// Lightweight card — no portals, no GPU-layer transforms. Confirm dialog is shared at the grid level.
function DashboardProductCard({
  product,
  onEdit,
  onDeleteRequest,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDeleteRequest: (product: Product) => void;
}) {
  return (
    <article
      style={{ contain: "layout style paint" }}
      className="flex flex-col overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm"
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="w-10 h-10 text-slate-200" />
          </div>
        )}
        {product.stock === 0 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            نفد
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        {product.sectionName && (
          <span className="text-[10px] font-medium text-primary/70 leading-none">
            {product.sectionName}
          </span>
        )}
        <h3
          className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug flex-1"
          title={product.name}
        >
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-sm font-bold text-primary leading-none">
            {product.price.toLocaleString()}
            <span className="text-[10px] font-medium mr-0.5">د.ع</span>
          </p>
          {product.stock > 0 && (
            <p className="text-[10px] text-slate-400">{product.stock} قطعة</p>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex border-t border-slate-100">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 py-2 text-xs font-medium text-primary hover:bg-primary/5"
        >
          تعديل
        </button>
        <div className="w-px bg-slate-100" />
        <button
          onClick={() => onDeleteRequest(product)}
          className="flex-1 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          حذف
        </button>
      </div>
    </article>
  );
}


// ===== Store Settings Tab Content =====
function StoreSettingsTab({ store, onSettingChange, onLogoSave }: {
    store: Store;
    onSettingChange: (key: keyof Store, value: any) => void;
    onLogoSave: (newLogoUrl: string) => Promise<void>;
}) {
    const getBusinessHourValue = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;
    const businessHours = store.businessHours ?? { open: 9, close: 23 };

    const handleBusinessHoursChange = (part: "open" | "close", value: string) => {
        const hour = parseInt(value.split(":")[0] ?? "0", 10);
        if (Number.isNaN(hour)) return;
        const newHours = { ...businessHours, [part]: hour };
        onSettingChange("businessHours", newHours);
    };

    const handleUseCurrentLocation = () => {
      if (!navigator.geolocation) {
        alert('المتصفح لا يدعم تحديد الموقع.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lon = Number(pos.coords.longitude.toFixed(6));
          onSettingChange('latitude', lat);
          onSettingChange('longitude', lon);
        },
        (err) => {
          console.error('Geolocation error', err);
          alert('تعذر الحصول على الموقع. تأكد من السماح بالوصول للموقع.');
        },
        { enableHighAccuracy: true }
      );
    };

    return (
        <div className="space-y-4">
            {/* شعار المتجر */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">هوية المتجر</h3>
                    <p className="text-sm text-slate-500 mt-0.5">شعار المتجر الظاهر للعملاء.</p>
                </div>
                <div className="p-5">
                    <LogoUploader store={store} onSave={onLogoSave} />
                </div>
            </div>

            {/* إعدادات التشغيل */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">إعدادات التشغيل</h3>
                    <p className="text-sm text-slate-500 mt-0.5">أوقات العمل وخيارات التوصيل.</p>
                </div>
                <div className="p-5 space-y-5">
                    <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">ساعات الدوام</Label>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <span className="text-xs text-slate-400">من</span>
                                <input
                                    type="time"
                                    step={3600}
                                    min="00:00"
                                    max="23:00"
                                    value={getBusinessHourValue(businessHours.open)}
                                    onChange={(event) => handleBusinessHoursChange("open", event.target.value)}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                />
                            </div>
                            <div className="pt-5 text-slate-300 font-bold">—</div>
                            <div className="flex flex-col gap-1.5 flex-1">
                                <span className="text-xs text-slate-400">إلى</span>
                                <input
                                    type="time"
                                    step={3600}
                                    min="00:00"
                                    max="23:00"
                                    value={getBusinessHourValue(businessHours.close)}
                                    onChange={(event) => handleBusinessHoursChange("close", event.target.value)}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">خدمة التوصيل</p>
                            <p className="text-xs text-slate-400 mt-0.5">تفعيل خيار التوصيل لعملائك</p>
                        </div>
                        <Switch
                            id="delivery-switch"
                            checked={!!store.hasDelivery}
                            onCheckedChange={(checked) => onSettingChange("hasDelivery", checked)}
                            dir="ltr"
                        />
                    </div>
                </div>
            </div>

            {/* الموقع الجغرافي */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">الموقع الجغرافي</h3>
                    <p className="text-sm text-slate-500 mt-0.5">يُمكّن العملاء من فتح موقع متجرك على الخريطة.</p>
                </div>
                <div className="p-5 space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-600 mb-3">اضغط لتحديد موقع متجرك تلقائياً بدون إدخال يدوي.</p>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleUseCurrentLocation} size="sm" className="rounded-xl font-semibold">تحديد الموقع تلقائياً</Button>
                            {store.latitude && (
                                <Button onClick={handleUseCurrentLocation} variant="outline" size="sm" className="rounded-xl">تحديث الموقع</Button>
                            )}
                        </div>
                    </div>
                    {store.latitude && store.longitude ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">خط العرض</p>
                                <p className="text-sm font-medium text-slate-800">{store.latitude}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">خط الطول</p>
                                <p className="text-sm font-medium text-slate-800">{store.longitude}</p>
                            </div>
                            <a
                                href={`geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${encodeURIComponent(store.name)})`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <Globe className="h-4 w-4" />
                                عرض الموقع على الخريطة
                            </a>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 text-center py-2">لم يتم تحديد الموقع بعد.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

const PAGE_SIZE = 20;

// ===== Products Tab Content =====
function ProductsTab({ products, sections, productLimit, onAdd, onEdit, onDelete }: {
    products: Product[];
    sections: Section[];
    productLimit: number;
    onAdd: () => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [sectionFilter, setSectionFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    // Single shared delete dialog — avoids a portal per card
    const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

    const isUnlimited = productLimit >= Number.MAX_SAFE_INTEGER;
    const limitReached = !isUnlimited && products.length >= productLimit;

    const filtered = useMemo(() => {
        let list = products;
        if (sectionFilter !== 'all') {
            list = list.filter((p) => (p.sectionId ?? '') === sectionFilter);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q));
        }
        return list;
    }, [products, search, sectionFilter]);

    const visible = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    const handleSearch = (v: string) => { setSearch(v); setVisibleCount(PAGE_SIZE); };
    const handleSection = (v: string) => { setSectionFilter(v); setVisibleCount(PAGE_SIZE); };

    const confirmDelete = () => {
        if (pendingDelete) onDelete(pendingDelete.id);
        setPendingDelete(null);
    };

    return (
        <>
        {/* Single shared confirm dialog — rendered once, not per-card */}
        <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
                    <AlertDialogDescription>
                        هل أنت متأكد من حذف &quot;{pendingDelete?.name}&quot;؟ لا يمكن التراجع.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="mt-0">إلغاء</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={confirmDelete}>حذف</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">المنتجات</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {products.length}{!isUnlimited && `/${productLimit}`}
                    </span>
                </div>
                <Button
                    onClick={onAdd}
                    disabled={limitReached}
                    size="sm"
                    className="rounded-lg gap-1.5 font-semibold"
                >
                    <PlusCircle className="h-4 w-4" />
                    إضافة منتج
                </Button>
            </div>

            {/* Search + Filter */}
            {products.length > 0 && (
                <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2 border-b border-slate-100">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="ابحث عن منتج…"
                        className="flex-1 min-w-0 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                    />
                    {sections.length > 0 && (
                        <Select value={sectionFilter} onValueChange={handleSection}>
                            <SelectTrigger className="h-9 w-36 rounded-lg text-sm">
                                <SelectValue placeholder="كل الأقسام" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الأقسام</SelectItem>
                                {sections.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}

            {/* Grid */}
            {products.length > 0 ? (
                filtered.length > 0 ? (
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {visible.map((product) => (
                                <DashboardProductCard
                                    key={product.id}
                                    product={product}
                                    onEdit={onEdit}
                                    onDeleteRequest={setPendingDelete}
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex items-center justify-center pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg text-xs font-semibold"
                                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                                >
                                    عرض المزيد ({filtered.length - visibleCount} منتج متبقٍ)
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                        <p className="text-sm font-semibold text-slate-600">لا توجد نتائج</p>
                        <p className="text-xs text-slate-400 mt-1">جرّب كلمة بحث أخرى أو اختر قسماً مختلفاً</p>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                        <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">لا توجد منتجات بعد</p>
                    <p className="text-xs text-slate-400 mt-1 mb-5">أضف أول منتج لتبدأ عرض بضاعتك</p>
                    <Button onClick={onAdd} size="sm" className="rounded-lg gap-1.5 font-semibold" disabled={limitReached}>
                        <PlusCircle className="h-4 w-4" />
                        إضافة أول منتج
                    </Button>
                </div>
            )}
        </div>
        </>
    );
}


// ===== Main Dashboard Component =====
export default function StoreDashboardPage() {
  const { user, userRole, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isStoreActive, setIsStoreActive] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [activeView, setActiveView] = useState('products');
  const [loading, setLoading] = useState(true);
  const [storeLoadAttempted, setStoreLoadAttempted] = useState(false);
  const [storeLoadUserId, setStoreLoadUserId] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const loadStore = useCallback(async () => {
    const authUserId = user?.id ?? null;
    setLoading(true);
    setStoreLoadAttempted(true);
    setStoreLoadUserId(authUserId);

    try {
      let storeId = user?.storeId ?? null;

      const conditions = [
        user?.id ? `owner_id.eq.${user.id}` : null,
        user?.id ? `"ownerId".eq.${user.id}` : null,
        user?.email ? `owner_email.eq.${user.email}` : null,
        user?.email ? `"ownerEmail".eq.${user.email}` : null,
      ]
        .filter(Boolean)
        .join(',');

      if (conditions) {
        const { data: fallbackStore, error: fallbackError } = await supabase
          .from('stores')
          .select('*')
          .or(conditions)
          .limit(1);

        if (fallbackError) {
          console.error('Store lookup failed:', fallbackError);
        } else if (fallbackStore && fallbackStore.length > 0) {
          storeId = fallbackStore[0].id;
        }
      }

      if (!storeId) {
        toast({ variant: 'destructive', title: 'خطأ في بيانات المتجر', description: 'لم يتم العثور على متجر مرتبط بحسابك.' });
        setStore(null);
        setProducts([]);
        return;
      }

      const storeData = await fetchStoreById(storeId);
      if (!storeData) {
        setStore(null);
      } else {
        const activationDays = storeData.activationDate ? differenceInDays(new Date(), parseISO(storeData.activationDate as string)) : 0;
        const subscriptionDuration = storeData.subscriptionDuration || 30;
        const daysLeft = subscriptionDuration - activationDays;

        setRemainingDays(daysLeft);
        setIsStoreActive(!!storeData.isActive);

        const expired = !!storeData.isActive && daysLeft <= 0;
        setIsSubscriptionExpired(expired);

        if (expired) {
          toast({ variant: 'destructive', title: 'الاشتراك منتهي', description: 'انتهت صلاحية الاشتراك. تواصل مع الإدارة لتجديده.', duration: Infinity });
        }

        setStore(storeData);
      }

      const sectionsRows = await fetchStoreSections(storeId);
      setSections(sectionsRows);

      const productsRows = await fetchProductsByStore(storeId);
      setProducts(productsRows);

      const packageRows = await fetchStorePackages();
      setPackages(packageRows);

      // حفظ البيانات في sessionStorage للعودة السريعة
      if (user?.id) {
        sessionStorage.setItem(`store_${user.id}`, JSON.stringify(storeData));
        sessionStorage.setItem(`products_${user.id}`, JSON.stringify(productsRows));
        sessionStorage.setItem(`sections_${user.id}`, JSON.stringify(sectionsRows));
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({ variant: 'destructive', title: 'خطأ في الاتصال', description: 'فشل تحميل بيانات المتجر.' });
    } finally {
      setLoading(false);
      setSessionRestored(true);
    }
  }, [user, toast]);

  const validViews = ['products', 'orders', 'sections', 'subscription', 'settings'];

  const handleViewChange = (view: string) => {
    if (!validViews.includes(view)) return;
    setActiveView(view);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get('tab') || 'products';
    handleViewChange(view);
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setStore(null);
      setProducts([]);
      setStoreLoadAttempted(false);
      setStoreLoadUserId(null);
      setSessionRestored(false);
      return;
    }

    if (userRole !== 'store') {
      router.push('/login');
      return;
    }

    // محاولة استعادة الجلسة من sessionStorage
    if (!sessionRestored && store === null) {
      const cachedStore = sessionStorage.getItem(`store_${user.id}`);
      const cachedProducts = sessionStorage.getItem(`products_${user.id}`);
      const cachedSections = sessionStorage.getItem(`sections_${user.id}`);
      
      if (cachedStore && cachedProducts && cachedSections) {
        try {
          const parsedStore = JSON.parse(cachedStore);
          setStore(parsedStore);
          setProducts(JSON.parse(cachedProducts));
          setSections(JSON.parse(cachedSections));
          // إعادة حساب الاشتراك من بيانات الكاش
          const activationDays = parsedStore.activationDate
            ? differenceInDays(new Date(), parseISO(parsedStore.activationDate as string))
            : 0;
          const subDuration = parsedStore.subscriptionDuration || 30;
          const daysLeft = subDuration - activationDays;
          setRemainingDays(daysLeft);
          setIsStoreActive(!!parsedStore.isActive);
          setIsSubscriptionExpired(!!parsedStore.isActive && daysLeft <= 0);
          setLoading(false);
          setSessionRestored(true);
          return;
        } catch (e) {
          console.error('Failed to restore session:', e);
          sessionStorage.removeItem(`store_${user.id}`);
          sessionStorage.removeItem(`products_${user.id}`);
          sessionStorage.removeItem(`sections_${user.id}`);
        }
      }
    }

    const isSameUser = user.id === storeLoadUserId;
    if (store !== null || (storeLoadAttempted && isSameUser)) {
      return;
    }

    loadStore();

    return () => {
      // Nothing to clean up
    };
  }, [user, userRole, authLoading, router, toast, store, storeLoadAttempted, storeLoadUserId, loadStore, sessionRestored]);

  const fullStoreData = useMemo(() => {
    // If the store doc doesn't exist yet (e.g. pending review), create a temporary one for the UI
    if (!store && user && userRole === 'store') {
        return {
            id: user.storeId || 'temp-id',
            name: user.name || 'متجري',
            products: products,
            productLimit: 50, // Default limit for pending stores
            isActive: false,
            // Add other necessary default properties for the UI to not break
            description: '',
            rating: 0,
            reviews: 0,
            location: '',
            type: 'إلكتروني',
            hasDelivery: false,
            ownerId: user.id,
            createdAt: new Date(),
        } as unknown as Store;
    }
    if (!store) return null;
    return { ...store, products };
  }, [store, products, user, userRole]);

  const updateStore = async (storeId: string, data: Partial<Store>) => {
    const dbData: any = {};
    
    // Convert all camelCase to snake_case for database
    if (data.name !== undefined) dbData.name = data.name;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.logoUrl !== undefined) {
      dbData.logo_url = data.logoUrl;
      dbData.logoUrl = data.logoUrl;  // Also update camelCase column for compatibility
    }
    if (data.coverImageUrl !== undefined) {
      dbData.cover_image_url = data.coverImageUrl;
      dbData.coverImageUrl = data.coverImageUrl;  // Also update camelCase column for compatibility
    }
    if (data.rating !== undefined) dbData.rating = data.rating;
    if (data.reviews !== undefined) dbData.reviews = data.reviews;
    if (data.location !== undefined) dbData.location = data.location;
    if (data.latitude !== undefined) dbData.latitude = data.latitude;
    if (data.longitude !== undefined) dbData.longitude = data.longitude;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.marketType !== undefined) {
      dbData.market_type = data.marketType;
      dbData.marketType = data.marketType;
    }
    if (data.businessHours !== undefined) {
      dbData.business_hours = data.businessHours;
      dbData.businessHours = data.businessHours;
    }
    if (data.whatsappNumber !== undefined) {
      dbData.whatsapp_number = data.whatsappNumber;
      dbData.whatsappNumber = data.whatsappNumber;
    }
    if (data.hasDelivery !== undefined) {
      dbData.has_delivery = data.hasDelivery;
      dbData.hasDelivery = data.hasDelivery;
    }
    if (data.isActive !== undefined) {
      dbData.is_active = data.isActive;
      dbData.isActive = data.isActive;
    }
    if (data.productLimit !== undefined) {
      dbData.product_limit = data.productLimit;
      dbData.productLimit = data.productLimit;
    }
    if (data.subscriptionDuration !== undefined) {
      dbData.subscription_duration = data.subscriptionDuration;
      dbData.subscriptionDuration = data.subscriptionDuration;
    }
    if (data.activationDate !== undefined) {
      dbData.activation_date = data.activationDate;
      dbData.activationDate = data.activationDate;
    }
    if (data.ownerId !== undefined) {
      dbData.owner_id = data.ownerId;
      dbData.ownerId = data.ownerId;
    }
    if (data.ownerEmail !== undefined) {
      dbData.owner_email = data.ownerEmail;
      dbData.ownerEmail = data.ownerEmail;
    }
    if (data.registeredByAgentId !== undefined) {
      dbData.registered_by_agent_id = data.registeredByAgentId;
      dbData.registeredByAgentId = data.registeredByAgentId;
    }

    const { error } = await supabase.from('stores').update(dbData).eq('id', storeId);
    if (error) throw error;
  };

  const handleLogoSave = async (newLogoUrl: string): Promise<void> => {
    if (!store) return;
    try {
      await updateStore(store.id, { logoUrl: newLogoUrl });
      setStore({ ...store, logoUrl: newLogoUrl });
      toast({ title: "تم تحديث الشعار بنجاح." });
    } catch (err) {
      console.error("Failed to save logo:", err);
      toast({ title: "فشل تحديث الشعار", variant: "destructive" });
    }
  };
  


  const handleStoreSettingChange = async (key: keyof Store, value: any) => {
    if (!store) return;
    try {
      await updateStore(store.id, { [key]: value } as Partial<Store>);
      setStore({ ...store, [key]: value } as Store);
      toast({ title: "تم حفظ التغييرات بنجاح." });
    } catch (err) {
      console.error("Failed to update store setting:", err);
      toast({ title: "فشل حفظ التغييرات", variant: "destructive" });
    }
  };

  const isProductLimitReached = useMemo(() => {
    if (!fullStoreData) return true;
    const limit = fullStoreData.productLimit ?? Number.MAX_SAFE_INTEGER;
    // If limit is essentially infinite, it's not reached.
    if (limit >= Number.MAX_SAFE_INTEGER) return false;
    return fullStoreData.products.length >= limit;
  }, [fullStoreData]);

  const isUnlimited = (fullStoreData?.productLimit ?? Number.MAX_SAFE_INTEGER) >= Number.MAX_SAFE_INTEGER;
  const showExpirationWarning = remainingDays !== null && remainingDays <= 5 && remainingDays > 0;
  const isPendingReview = userRole === 'store' && (!store || !store.isActive);
  const currentPackage = useMemo(() => {
    if (!store) return null;
    return packages.find((pkg) => pkg.slug === store.packageName) || packages.find((pkg) => pkg.isActive) || null;
  }, [packages, store]);
  const handleAddProduct = () => {
    if (isProductLimitReached) {
        const isUnlimited = (fullStoreData?.productLimit ?? Number.MAX_SAFE_INTEGER) >= Number.MAX_SAFE_INTEGER;
        toast({ 
            variant: "destructive", 
            title: "تم الوصول للحد الأقصى", 
            description: isUnlimited ? "حدث خطأ ما." : `لا يمكنك إضافة المزيد من المنتجات. الحد الأقصى لباقتك هو ${fullStoreData?.productLimit ?? 'غير معروف'} منتج.`
        });
        return;
    }
    router.push('/dashboard/store/add-product');
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/dashboard/store/add-product?id=${product.id}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    const storeId = store?.id || user?.storeId;
    if (!storeId) {
      toast({ title: "فشل حذف المنتج", description: "لم يتم العثور على المتجر المرتبط بحسابك.", variant: "destructive" });
      return;
    }

    try {
      const success = await deleteProduct(productId, storeId);
      if (!success) throw new Error('فشل حذف المنتج.');
      toast({ title: "تم حذف المنتج بنجاح.", variant: "destructive" });
      const productsRows = await fetchProductsByStore(storeId);
      setProducts(productsRows);
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({ title: "فشل حذف المنتج", variant: "destructive" });
    }
  };

  const handleCreateSection = async () => {
    const storeId = store?.id || user?.storeId;
    if (!storeId || !newSectionName.trim()) {
      return;
    }

    try {
      const section = await createStoreSection(storeId, newSectionName.trim());
      if (!section) throw new Error('فشل إنشاء القسم.');
      setSections((prev) => [...prev, section]);
      setNewSectionName('');
      toast({ title: 'تم إنشاء القسم بنجاح.' });
    } catch (error) {
      console.error('Failed to create section:', error);
      toast({ title: 'فشل إنشاء القسم', variant: 'destructive' });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const success = await deleteStoreSection(sectionId);
      if (!success) throw new Error('فشل حذف القسم.');
      setSections((prev) => prev.filter((section) => section.id !== sectionId));
      toast({ title: 'تم حذف القسم بنجاح.', variant: 'destructive' });
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast({ title: 'فشل حذف القسم', variant: 'destructive' });
    }
  };

  // Product saving is now handled in the add-product page
  
  if (loading || authLoading) {
    return <div className="flex items-center justify-center h-screen bg-muted/40"><p>جاري تحميل بيانات المتجر...</p></div>;
  }

  if (!fullStoreData) {
      // This state can occur if the user is a store owner but their store document was deleted.
      // It's an edge case but we should handle it.
      return (
        <div className="flex items-center justify-center h-screen bg-muted/40">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>خطأ في بيانات المتجر</AlertTitle>
            <AlertDescription>
                لا يمكننا العثور على بيانات متجرك. يرجى التواصل مع الإدارة.
            </AlertDescription>
          </Alert>
        </div>
      )
  }

  const tabMotion = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18 } };

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex flex-col">

      {/* ══════════════════ HEADER ══════════════════ */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-[0_1px_0_0_rgba(0,0,0,.06)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">

          {/* Top row */}
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Store identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {fullStoreData.logoUrl ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <Image src={fullStoreData.logoUrl} alt={fullStoreData.name} fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                    <Package2 className="h-5 w-5 text-primary" />
                  </div>
                )}
                {fullStoreData.isActive && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900 leading-snug">{fullStoreData.name}</p>
                <p className="text-xs text-slate-400 font-medium">لوحة التحكم</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild size="sm" className="rounded-lg gap-1.5 bg-primary text-white hover:bg-primary/90 shadow-sm">
                <Link href={`/store?id=${fullStoreData.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">عرض المتجر</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="pb-2.5">
            <StoreOwnerNavbar activeTab={activeView} onTabChange={handleViewChange} />
          </div>
        </div>
      </header>

      {/* ══════════════════ BANNER ALERTS ══════════════════ */}
      {(isPendingReview || isSubscriptionExpired || showExpirationWarning) && (
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4 space-y-2">
          {isPendingReview && (
            <Alert className="border-amber-200 bg-amber-50 py-3">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              <AlertDescription className="text-sm font-medium text-amber-800">متجرك قيد المراجعة من فريقنا، سيتم تفعيله قريباً.</AlertDescription>
            </Alert>
          )}
          {isSubscriptionExpired && (
            <Alert variant="destructive" className="py-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-sm font-medium">انتهى اشتراكك — تواصل مع الإدارة لتجديده واستعادة متجرك.</AlertDescription>
            </Alert>
          )}
          {showExpirationWarning && !isSubscriptionExpired && (
            <Alert className="border-orange-200 bg-orange-50 py-3">
              <Clock className="h-4 w-4 shrink-0 text-orange-500" />
              <AlertDescription className="text-sm font-medium text-orange-800">تنبيه — متبقي <strong>{remainingDays}</strong> أيام فقط لانتهاء اشتراكك.</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* ══════════════════ MAIN ══════════════════ */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6">

        {/* ─── تبويب المنتجات ─── */}
        {activeView === 'products' && (
          <motion.div key="products" {...tabMotion} className="space-y-5">

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {([
                {
                  label: 'المنتجات',
                  value: `${products.length}`,
                  sub: `من ${isUnlimited ? '∞' : fullStoreData.productLimit}`,
                  icon: <Package className="h-4 w-4" />,
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  label: 'الحالة',
                  value: fullStoreData.isActive ? 'نشط' : 'متوقف',
                  sub: fullStoreData.isActive ? 'يقبل الطلبات' : 'مغلق',
                  icon: <CheckCircle2 className="h-4 w-4" />,
                  color: fullStoreData.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50',
                },
                {
                  label: 'التوصيل',
                  value: fullStoreData.hasDelivery ? 'متاح' : 'معطل',
                  sub: fullStoreData.hasDelivery ? 'فعال' : 'غير متاح',
                  icon: <Truck className="h-4 w-4" />,
                  color: fullStoreData.hasDelivery ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-100',
                },
                {
                  label: 'الاشتراك',
                  value: remainingDays !== null && remainingDays > 0 ? `${remainingDays} يوم` : 'منتهي',
                  sub: remainingDays !== null && remainingDays > 0 ? 'متبقٍ' : 'للتجديد',
                  icon: <CreditCard className="h-4 w-4" />,
                  color: (remainingDays ?? 0) > 5 ? 'text-purple-600 bg-purple-50' : 'text-red-500 bg-red-50',
                },
              ] as const).map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <p className="text-lg font-bold text-slate-900 leading-none">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{stat.sub}</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Products list */}
            <ProductsTab
              products={products}
              sections={sections}
              productLimit={fullStoreData.productLimit}
              onAdd={handleAddProduct}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
          </motion.div>
        )}

        {/* ─── تبويب الطلبات ─── */}
        {activeView === 'orders' && (
          <motion.div key="orders" {...tabMotion}>
            <StoreOrdersTab storeId={fullStoreData.id} />
          </motion.div>
        )}

        {/* ─── تبويب الأقسام ─── */}
        {activeView === 'sections' && (
          <motion.div key="sections" {...tabMotion} className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">أقسام المتجر</h2>
                  <p className="text-sm text-slate-500 mt-0.5">نظّم منتجاتك في أقسام لتسهيل تصفح العملاء.</p>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{sections.length} قسم</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                  placeholder="اسم القسم الجديد…"
                  className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
                <Button
                  onClick={handleCreateSection}
                  disabled={!newSectionName.trim()}
                  className="shrink-0 rounded-xl px-5 font-semibold"
                >
                  إضافة
                </Button>
              </div>
            </div>

            {sections.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {sections.map((section, i) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Tag className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{section.name}</p>
                        {section.createdAt && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{new Date(section.createdAt).toLocaleDateString('ar-EG')}</p>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف القسم</AlertDialogTitle>
                          <AlertDialogDescription>هل أنت متأكد من حذف قسم "{section.name}"؟ سيتم إلغاء ارتباط المنتجات بهذا القسم.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDeleteSection(section.id)}>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                  <Tag className="h-7 w-7 text-slate-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-slate-700">لا توجد أقسام بعد</p>
                <p className="text-xs text-slate-400 mt-1">أضف قسماً من الحقل أعلاه لتنظيم منتجاتك</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── تبويب الاشتراك ─── */}
        {activeView === 'subscription' && (
          <motion.div key="subscription" {...tabMotion} className="space-y-5">

            {/* Current subscription card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">الاشتراك الحالي</h2>
                  <p className="text-sm text-slate-500 mt-0.5">تفاصيل باقتك وصلاحية اشتراكك.</p>
                </div>
                <Badge
                  variant={isSubscriptionExpired ? 'destructive' : 'default'}
                  className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold ${!isSubscriptionExpired ? 'bg-emerald-500 hover:bg-emerald-500' : ''}`}
                >
                  {isSubscriptionExpired ? 'منتهي' : 'نشط'}
                </Badge>
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: 'الباقة',
                    value: currentPackage?.name || 'غير محددة',
                    icon: <CreditCard className="h-5 w-5 text-purple-500" />,
                    bg: 'bg-purple-50',
                  },
                  {
                    label: 'الأيام المتبقية',
                    value: remainingDays !== null && remainingDays > 0 ? `${remainingDays} يوم` : 'منتهي',
                    icon: <CalendarDays className="h-5 w-5 text-blue-500" />,
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'حد المنتجات',
                    value: isUnlimited ? 'غير محدود' : `${fullStoreData.productLimit} منتج`,
                    icon: <Package className="h-5 w-5 text-amber-500" />,
                    bg: 'bg-amber-50',
                  },
                  {
                    label: 'تاريخ التفعيل',
                    value: fullStoreData.activationDate
                      ? new Date(fullStoreData.activationDate).toLocaleDateString('ar-EG')
                      : 'غير محدد',
                    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
                    bg: 'bg-emerald-50',
                  },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl ${item.bg} p-4`}>
                    <div className="mb-3">{item.icon}</div>
                    <p className="text-base font-bold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>

              {currentPackage && (
                <div className="px-6 pb-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">وصف الباقة</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{currentPackage.description || 'لا يوجد وصف إضافي لهذه الباقة.'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                        المدة: {currentPackage.subscriptionDuration || 30} يوم
                      </span>
                      <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                        السعر: {currentPackage.price ? `${currentPackage.price.toLocaleString()} د.ع` : 'مجاناً'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Available packages */}
            {packages.filter((p) => p.isActive).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">الباقات المتاحة</h2>
                  <p className="text-sm text-slate-500 mt-0.5">اختر الباقة المناسبة لتوسيع نطاق متجرك.</p>
                </div>
                <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {packages.filter((pkg) => pkg.isActive).map((pkg, i) => {
                    const isCurrent = currentPackage?.id === pkg.id;
                    return (
                      <motion.article
                        key={pkg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                          isCurrent
                            ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/20'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-md'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute top-4 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">باقتك الحالية</span>
                        )}
                        <div className="mb-4 mt-1">
                          <p className="text-base font-bold text-slate-900">{pkg.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{pkg.slug}</p>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed flex-1">{pkg.description || 'لا يوجد وصف إضافي لهذه الباقة.'}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2">
                            <span className="text-xs text-slate-500">الحد الأقصى</span>
                            <span className="text-xs font-semibold text-slate-800">
                              {pkg.productLimit >= Number.MAX_SAFE_INTEGER ? 'غير محدود' : `${pkg.productLimit} منتج`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2">
                            <span className="text-xs text-slate-500">المدة</span>
                            <span className="text-xs font-semibold text-slate-800">{pkg.subscriptionDuration} يوم</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2">
                            <span className="text-xs text-slate-500">السعر</span>
                            <span className="text-xs font-bold text-primary">
                              {pkg.price === 0 ? 'مجاناً' : `${pkg.price.toLocaleString()} د.ع`}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isCurrent ? 'outline' : 'default'}
                          className="mt-4 w-full rounded-xl font-semibold"
                          onClick={() => toast({ title: 'للتجديد تواصل مع الإدارة' })}
                        >
                          {isCurrent ? 'تجديد الاشتراك' : 'طلب الترقية'}
                        </Button>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── تبويب الإعدادات ─── */}
        {activeView === 'settings' && (
          <motion.div key="settings" {...tabMotion}>
            <StoreSettingsTab
              store={fullStoreData}
              onSettingChange={handleStoreSettingChange}
              onLogoSave={handleLogoSave}
            />
          </motion.div>
        )}

      </main>
    </div>
  );
}

