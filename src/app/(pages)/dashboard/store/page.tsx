
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, MoreHorizontal, AlertTriangle, Edit, Trash2, Settings, Package, Image as ImageIcon, PanelLeft, Package2, Shield, LogOut, Info, ShoppingCart as ShoppingCartIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { differenceInDays, parseISO } from "date-fns";
import type { Product, Store } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "@/components/dashboard/product-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createProduct, deleteProduct, mapProductRow, mapStoreRow, updateProduct } from "@/services/supabase-db";
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
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
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
            <h3 className="text-sm font-semibold truncate" title={product.name}>{product.name}</h3>
            <p className="mt-3 text-sm font-bold text-primary">{product.price.toLocaleString()} د.ع</p>
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
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const handleBusinessHoursChange = (part: "open" | "close", value: string) => {
        if (!store.businessHours) return;
        const hour = parseInt(value, 10);
        const newHours = { ...store.businessHours, [part]: hour };
        onSettingChange("businessHours", newHours);
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
                        <div className="flex items-center gap-2 mt-2">
                            <Select value={store.businessHours?.open?.toString() ?? "9"} onValueChange={(value) => handleBusinessHoursChange("open", value)}>
                                <SelectTrigger className="w-28"><SelectValue placeholder="فتح" /></SelectTrigger>
                                <SelectContent>{hours.map((h) => <SelectItem key={`open-${h}`} value={h.toString()}>{h}:00</SelectItem>)}</SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">إلى</span>
                            <Select value={store.businessHours?.close?.toString() ?? "23"} onValueChange={(value) => handleBusinessHoursChange("close", value)}>
                                <SelectTrigger className="w-28"><SelectValue placeholder="إغلاق" /></SelectTrigger>
                                <SelectContent>{hours.map((h) => <SelectItem key={`close-${h}`} value={h.toString()}>{h}:00</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 self-end">
                        <Switch id="delivery-switch" checked={!!store.hasDelivery} onCheckedChange={(checked) => onSettingChange("hasDelivery", checked)} dir="ltr" />
                        <Label htmlFor="delivery-switch" className="cursor-pointer">توفير خدمة التوصيل</Label>
                    </div>
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

      const { data: storeRow, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError && storeError.code !== 'PGRST116') {
        throw storeError;
      }

      if (!storeRow) {
        setStore(null);
      } else {
        const storeData = mapStoreRow(storeRow);
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

      const { data: productsRows, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId);

      if (productsError) throw productsError;
      setProducts((productsRows || []).map(mapProductRow));
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({ variant: 'destructive', title: 'خطأ في الاتصال', description: 'فشل تحميل بيانات المتجر.' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get('tab') || 'products';
    setActiveView(view);
  }, []);

  useEffect(() => {
    if (!router || typeof window === 'undefined') return;
    const basePath = '/dashboard/store';
    const currentQuery = window.location.search ? window.location.search.substring(1) : '';
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    const newUrl = activeView === 'products' ? basePath : `${basePath}?tab=${encodeURIComponent(activeView)}`;
    if (currentUrl !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [activeView, router, pathname]);

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
    if (data.logoUrl !== undefined) dbData.logo_url = data.logoUrl;
    if (data.coverImageUrl !== undefined) dbData.cover_image_url = data.coverImageUrl;
    if (data.rating !== undefined) dbData.rating = data.rating;
    if (data.reviews !== undefined) dbData.reviews = data.reviews;
    if (data.location !== undefined) dbData.location = data.location;
    if (data.latitude !== undefined) dbData.latitude = data.latitude;
    if (data.longitude !== undefined) dbData.longitude = data.longitude;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.marketType !== undefined) dbData.market_type = data.marketType;
    if (data.businessHours !== undefined) dbData.business_hours = data.businessHours;
    if (data.whatsappNumber !== undefined) dbData.whatsapp_number = data.whatsappNumber;
    if (data.hasDelivery !== undefined) dbData.has_delivery = data.hasDelivery;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;
    if (data.productLimit !== undefined) dbData.product_limit = data.productLimit;
    if (data.subscriptionDuration !== undefined) dbData.subscription_duration = data.subscriptionDuration;
    if (data.activationDate !== undefined) dbData.activation_date = data.activationDate;
    if (data.ownerId !== undefined) dbData.owner_id = data.ownerId;
    if (data.ownerEmail !== undefined) dbData.owner_email = data.ownerEmail;
    if (data.registeredByAgentId !== undefined) dbData.registered_by_agent_id = data.registeredByAgentId;

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
    if (!storeId) return;

    try {
      const success = await deleteProduct(productId, storeId);
      if (!success) throw new Error('فشل حذف المنتج.');
      toast({ title: "تم حذف المنتج بنجاح.", variant: "destructive" });
      const { data: productsRows, error } = await supabase.from('products').select('*').eq('store_id', storeId);
      if (error) throw error;
      setProducts((productsRows || []).map(mapProductRow));
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({ title: "فشل حذف المنتج", variant: "destructive" });
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
          categoryId: finalProductData.categoryId,
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
          imageUrl: finalProductData.imageUrl || undefined,
          categoryId: finalProductData.categoryId,
          storeId,
        });
        if (!created) throw new Error('فشل إضافة المنتج.');
        toast({ title: "تمت إضافة المنتج بنجاح." });
      }

      const { data: productsRows, error } = await supabase.from('products').select('*').eq('store_id', storeId);
      if (error) throw error;
      setProducts((productsRows || []).map(mapProductRow));

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
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader className="border-b">
                 <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                        <Package2 className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold truncate">{fullStoreData.name}</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleViewChange("products")} isActive={activeView === "products"}>
                            <Package className="h-5 w-5 flex-shrink-0" />
                            <span>المنتجات</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleViewChange("orders")} isActive={activeView === "orders"}>
                            <ShoppingCartIcon className="h-5 w-5 flex-shrink-0" />
                            <span>الطلبات</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => handleViewChange("settings")} isActive={activeView === "settings"}>
                            <Settings className="h-5 w-5 flex-shrink-0" />
                             <span>الإعدادات</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut className="h-5 w-5 flex-shrink-0" />
                            <span>خروج</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             <div className="min-h-screen bg-background flex flex-col">
                <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm shadow-sm">
                    <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <BackButton href="/dashboard/store" />
                            <SidebarTrigger className="md:hidden flex-shrink-0"/>
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
                      <Alert className="bg-blue-50 border-blue-200 text-blue-900">
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
        </SidebarInset>

        <ProductFormDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSave={handleSaveProduct}
            product={editingProduct}
        />
    </SidebarProvider>
  );
}

