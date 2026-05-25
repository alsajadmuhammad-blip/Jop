
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { StoreOwnerNavbar } from "./navbar";
import { PlusCircle, MoreHorizontal, AlertTriangle, Edit, Trash2, Settings, Package, Image as ImageIcon, PanelLeft, Package2, Shield, LogOut, Info, ShoppingCart as ShoppingCartIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { differenceInDays, parseISO } from "date-fns";
import type { Product, Store, Section } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "@/components/dashboard/product-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createProduct, deleteProduct, fetchProductsByStore, fetchStoreById, fetchStoreSections, mapProductRow, mapStoreRow, updateProduct, createStoreSection, updateStoreSection, deleteStoreSection } from "@/services/supabase-db";
import { uploadProductImageForStore } from "@/services/supabase-storage";
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
// ...existing code...
import { LogoUploader } from "@/components/dashboard/logo-uploader";
import { CoverImageUploader } from "@/components/dashboard/cover-image-uploader";
import { BackButton } from "@/components/layout/back-button";
import { StoreOrdersTab } from "@/components/dashboard/store-orders-tab";

// ===== New Dashboard Product Card =====
function DashboardProductCard({ product, onEdit, onDelete }: { product: Product, onEdit: (product: Product) => void, onDelete: (productId: string) => void }) {
  return (
    <article className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg border border-slate-200/80 rounded-3xl bg-background">
        <div className="relative h-40 w-full overflow-hidden border-b bg-muted flex items-center justify-center">
            {product.imageUrl ? (
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
            ) : (
                <ImageIcon className="w-10 h-10 text-muted-foreground/50"/>
            )}
        </div>
        <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold truncate" title={product.name}>{product.name}</h3>
              {product.sectionName ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {product.sectionName}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-bold text-primary">{product.price.toLocaleString()} د.ع</p>
            <p className={product.stock > 0 ? "mt-2 text-xs font-medium text-success" : "mt-2 text-xs font-medium text-destructive"}>
              {product.stock > 0 ? `المخزون: ${product.stock}` : 'نفد المخزون'}
            </p>
        </div>
        <div className="mt-auto p-4 pt-0 flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                <Edit className="ml-1 h-3 w-3" />
                تعديل
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-9 w-9">
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف المنتج "{product.name}" نهائياً. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(product.id)}>نعم، حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </article>
  );
}


// ===== Store Settings Tab Content =====
function StoreSettingsTab({ store, onSettingChange, onLogoSave, onCoverImageSave }: {
    store: Store;
    onSettingChange: (key: keyof Store, value: any) => void;
    onLogoSave: (newLogoUrl: string) => Promise<void>;
    onCoverImageSave: (newCoverUrl: string) => Promise<void>;
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
        <div className="space-y-8">
            <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-2">هوية المتجر</h3>
                <p className="text-muted-foreground text-sm mb-6">قم بتحديث شعار وصورة الغلاف الخاصة بمتجرك.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="flex flex-col items-center gap-4 border p-4 rounded-lg bg-muted/20">
                        <Label className="font-semibold">شعار المتجر</Label>
                        <div className="relative rounded-xl object-contain border p-2 bg-white w-[90px] h-[90px]">
                            {store.logoUrl ? (
                                <Image alt="Store Logo" fill src={store.logoUrl} className="object-contain" />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <LogoUploader store={store} onSave={onLogoSave} />
                    </div>
                    <div className="flex flex-col items-center gap-4 border p-4 rounded-lg bg-muted/20">
                        <Label className="font-semibold">صورة الغلاف</Label>
                        <div className="relative rounded-xl object-cover aspect-video w-full border p-1 bg-white">
                            {store.coverImageUrl ? (
                                <Image alt="Store Cover" fill src={store.coverImageUrl} className="object-cover rounded-md" />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <CoverImageUploader store={store} onSave={onCoverImageSave} />
                    </div>
                </div>
            </div>

            <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-2">إعدادات التشغيل</h3>
                <p className="text-muted-foreground text-sm mb-6">تحكم في أوقات العمل وخيارات التوصيل.</p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <Label>أوقات الدوام</Label>
                        <div className="grid gap-3 mt-2 sm:grid-cols-[1fr_auto]">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500">من</span>
                                <input
                                    type="time"
                                    step={3600}
                                    min="00:00"
                                    max="23:00"
                                    value={getBusinessHourValue(businessHours.open)}
                                    onChange={(event) => handleBusinessHoursChange("open", event.target.value)}
                                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500">إلى</span>
                                <input
                                    type="time"
                                    step={3600}
                                    min="00:00"
                                    max="23:00"
                                    value={getBusinessHourValue(businessHours.close)}
                                    onChange={(event) => handleBusinessHoursChange("close", event.target.value)}
                                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 self-end">
                        <Switch id="delivery-switch" checked={!!store.hasDelivery} onCheckedChange={(checked) => onSettingChange("hasDelivery", checked)} dir="ltr" />
                        <Label htmlFor="delivery-switch" className="cursor-pointer">توفير خدمة التوصيل</Label>
                    </div>
                </div>
            </div>

                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-2">الموقع الجغرافي</h3>
                  <p className="text-muted-foreground text-sm mb-4">اضبط إحداثيات المتجر (خط العرض وخط الطول) ليتمكن العملاء من فتح موقع المتجر على خرائط هواتفهم.</p>
                  <div className="grid gap-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-700 mb-2">اضغط الزر لتحديد موقع متجرك تلقائياً. لن تحتاج لتعبئة الإحداثيات يدوياً.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleUseCurrentLocation} size="sm">تحديد الموقع الذكي</Button>
                        <Button onClick={handleUseCurrentLocation} variant="outline" size="sm">تحديث الموقع</Button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">خط العرض</p>
                        <p className="mt-2 text-sm text-slate-900">{store.latitude ?? 'لم يتم التحديد'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">خط الطول</p>
                        <p className="mt-2 text-sm text-slate-900">{store.longitude ?? 'لم يتم التحديد'}</p>
                      </div>
                    </div>
                    {store.latitude && store.longitude && (
                      <a
                        href={`geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${encodeURIComponent(store.name)})`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        عرض الموقع على الخريطة
                      </a>
                    )}
                  </div>
                </div>
        </div>
    );
}

// ===== Products Tab Content =====
function ProductsTab({ products, productLimit, onAdd, onEdit, onDelete }: {
    products: Product[];
    productLimit: number;
    onAdd: () => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
}) {
    const isUnlimited = productLimit >= Number.MAX_SAFE_INTEGER;
    
    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold">منتجاتك</h2>
                    <p className="text-muted-foreground">
                        ({products.length}/{isUnlimited ? '∞' : productLimit}) منتجات.
                    </p>
                </div>
                <Button onClick={onAdd} disabled={!isUnlimited && products.length >= productLimit}>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة منتج
                </Button>
            </div>
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <DashboardProductCard key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-lg bg-background border-2 border-dashed">
                    <Package className="mx-auto h-16 w-16 text-muted-foreground" strokeWidth={1} />
                    <h2 className="mt-4 text-xl font-semibold">لم تقم بإضافة أي منتجات بعد</h2>
                    <p className="mt-2 text-muted-foreground">
                        انقر على زر "إضافة منتج" لبدء عرض بضاعتك.
                    </p>
                    <Button onClick={onAdd} className="mt-6" disabled={!isUnlimited && products.length >= productLimit}>
                        <PlusCircle className="ml-2 h-4 w-4" /> إضافة أول منتج
                    </Button>
                </div>
            )}
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
  const [newSectionName, setNewSectionName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isStoreActive, setIsStoreActive] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [activeView, setActiveView] = useState('products');
  const [loading, setLoading] = useState(true);
  const [storeLoadAttempted, setStoreLoadAttempted] = useState(false);
  const [storeLoadUserId, setStoreLoadUserId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({ variant: 'destructive', title: 'خطأ في الاتصال', description: 'فشل تحميل بيانات المتجر.' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const validViews = ['products', 'orders', 'sections', 'settings'];

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
      return;
    }

    if (userRole !== 'store') {
      router.push('/login');
      return;
    }

    if (user.firstLogin && pathname !== '/dashboard/store/change-password') {
      router.push('/dashboard/store/change-password');
      return;
    }

    const isSameUser = user.id === storeLoadUserId;
    if (store !== null || (storeLoadAttempted && isSameUser)) {
      return;
    }

    loadStore();

    return () => {
      // Nothing to clean up
    };
  }, [user, userRole, authLoading, router, pathname, toast, store, storeLoadAttempted, storeLoadUserId, loadStore]);

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
  
  const handleCoverImageSave = async (newCoverUrl: string): Promise<void> => {
    if (!store) return;
    try {
      await updateStore(store.id, { coverImageUrl: newCoverUrl });
      setStore({ ...store, coverImageUrl: newCoverUrl });
      toast({ title: "تم تحديث صورة الغلاف بنجاح." });
    } catch (err) {
      console.error("Failed to save cover image:", err);
      toast({ title: "فشل تحديث الصورة", variant: "destructive" });
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
    setEditingProduct(undefined);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
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

  const handleSaveProduct = async (productData: Omit<Product, "id" | "storeId"> & { imageFile?: File | null }) => {
    const storeId = user?.storeId || store?.id;
    if (!storeId) {
      toast({ title: "فشل حفظ المنتج", description: "لم يتم العثور على هوية المتجر.", variant: "destructive" });
      return;
    }

    const finalProductData = { ...productData };

    try {
      if (productData.imageFile) {
        const uploadResult = await uploadProductImageForStore(productData.imageFile, storeId);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'فشل رفع صورة المنتج.');
        }
        finalProductData.imageUrl = uploadResult.url || finalProductData.imageUrl || undefined;
      }

      if (editingProduct) {
        if (!finalProductData.imageUrl) finalProductData.imageUrl = editingProduct.imageUrl;
        const updated = await updateProduct(editingProduct.id, {
          name: finalProductData.name,
          description: finalProductData.description,
          price: finalProductData.price,
          imageUrl: finalProductData.imageUrl,
          sectionId: finalProductData.sectionId,
          sku: finalProductData.sku,
          stock: finalProductData.stock,
        });
        if (!updated) throw new Error('فشل تحديث المنتج.');
        toast({ title: "تم تحديث المنتج بنجاح." });
      } else {
        if (isProductLimitReached) {
          toast({ variant: 'destructive', title: 'تم الوصول للحد الأقصى', description: 'لا يمكنك إضافة المزيد من المنتجات.' });
          return;
        }
        const created = await createProduct({
          name: finalProductData.name,
          description: finalProductData.description,
          price: finalProductData.price,
          sectionId: finalProductData.sectionId,
          sku: finalProductData.sku,
          stock: finalProductData.stock,
          imageUrl: finalProductData.imageUrl || undefined,
          storeId,
        });
        if (!created) throw new Error('فشل إضافة المنتج.');
        toast({ title: "تمت إضافة المنتج بنجاح." });
      }

      const productsRows = await fetchProductsByStore(storeId);
      setProducts(productsRows);

      setIsDialogOpen(false);
      setEditingProduct(undefined);
    } catch (error) {
      console.error("Failed to save product:", error);
      toast({ title: "فشل حفظ المنتج", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };
  
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

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
                <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm shadow-sm">
                    <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <BackButton href="/dashboard/store" />
                            <div className="min-w-0">
                                 <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                                    {fullStoreData.name}
                                </h1>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                    لوحة التحكم
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="flex-shrink-0 md:hidden">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                <div className="px-4 md:px-8">
                  <StoreOwnerNavbar activeTab={activeView} onTabChange={handleViewChange} />
                </div>

                <main className="flex-1 px-4 md:px-8 py-6 space-y-6">
                    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">المنتجات</p>
                            <p className="mt-3 text-3xl font-semibold text-slate-950">{products.length}</p>
                            <p className="text-sm text-slate-500 mt-1">إجمالي العناصر في المتجر</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">الحالة</p>
                            <p className="mt-3 text-3xl font-semibold text-slate-950">{fullStoreData.isActive ? 'نشط' : 'متوقف'}</p>
                            <p className="text-sm text-slate-500 mt-1">حالة عرض المتجر</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">التوصيل</p>
                            <p className="mt-3 text-3xl font-semibold text-slate-950">{fullStoreData.hasDelivery ? 'متاح' : 'غير متاح'}</p>
                            <p className="text-sm text-slate-500 mt-1">خيار التوصيل الحالي</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">الاشتراك</p>
                            <p className="mt-3 text-3xl font-semibold text-slate-950">{remainingDays !== null ? `${remainingDays} يوم` : 'غير معروف'}</p>
                            <p className="text-sm text-slate-500 mt-1">باقي من أيام الاشتراك</p>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-xl">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">نظرة سريعة</p>
                        <h2 className="mt-3 text-2xl font-semibold">{fullStoreData.name}</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            {fullStoreData.description || 'لوحة تحكم متجرك منظمة لتسريع إدارة المنتجات والطلبات والإعدادات.'}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button asChild size="sm" variant="secondary" className="rounded-full px-4 py-2">
                                <Link href={`/store?id=${fullStoreData.id}`}>عرض المتجر</Link>
                            </Button>
                            <Button size="sm" className="rounded-full px-4 py-2" onClick={() => handleViewChange('settings')}>
                                تعديل الإعدادات
                            </Button>
                        </div>
                    </div>
                </div>

                {isPendingReview && (
                      <Alert className="bg-primary/10 border-primary/20 text-primary">
                        <Info className="h-4 w-4 flex-shrink-0" />
                        <AlertTitle>جاري المراجعة</AlertTitle>
                        <AlertDescription className="text-sm mt-1">
                            متجرك قيد المراجعة من إدارتنا وسيتم تفعيله قريباً.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isSubscriptionExpired && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <AlertTitle>الاشتراك منتهي!</AlertTitle>
                        <AlertDescription className="text-sm mt-1">
                            تواصل مع الإدارة لتجديد الاشتراك.
                        </AlertDescription>
                      </Alert>
                    )}

                    {showExpirationWarning && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <AlertTitle>تنبيه!</AlertTitle>
                        <AlertDescription className="text-sm">متبقي {remainingDays} أيام لانتهاء الاشتراك.</AlertDescription>
                      </Alert>
                    )}

                    {activeView === 'products' && (
                        <ProductsTab 
                            products={products}
                            productLimit={fullStoreData.productLimit}
                            onAdd={handleAddProduct}
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                        />
                    )}

                    {activeView === 'orders' && (
                        <StoreOrdersTab storeId={fullStoreData.id} />
                    )}

                    {activeView === 'sections' && (
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4">
<div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                              <div>
                                <h2 className="text-2xl font-bold">أقسام المتجر</h2>
                                <p className="text-sm text-muted-foreground mt-1">أنشئ ونظّم الأقسام التي سيختار منها العملاء منتجاتك.</p>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                <input
                                  type="text"
                                  value={newSectionName}
                                  onChange={(event) => setNewSectionName(event.target.value)}
                                  placeholder="أضف اسم قسم جديد"
                                  className="w-full min-w-0 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                />
                                <Button type="button" onClick={handleCreateSection} className="whitespace-nowrap">
                                  إضافة قسم
                                </Button>
                              </div>
                            </div>

                          {sections.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                              {sections.map((section) => (
                                <div key={section.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                                  <div>
                                    <p className="text-lg font-semibold">{section.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{section.createdAt ? new Date(section.createdAt).toLocaleDateString('ar-EG') : 'بدون تاريخ'}</p>
                                  </div>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteSection(section.id)}>
                                    حذف
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                              <p className="text-sm font-medium text-slate-900">لا توجد أقسام بعد.</p>
                              <p className="text-sm text-muted-foreground mt-2">أضف قسمًا جديدًا كي تتمكن من تنظيم منتجاتك بشكل احترافي.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {activeView === 'settings' && (
                        <StoreSettingsTab 
                            store={fullStoreData}
                            onSettingChange={handleStoreSettingChange}
                            onLogoSave={handleLogoSave}
                            onCoverImageSave={handleCoverImageSave}
                        />
                    )}
                </main>
             </div>

      <ProductFormDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSave={handleSaveProduct}
            product={editingProduct}
            sections={sections}
        />
    </>
    );
}

