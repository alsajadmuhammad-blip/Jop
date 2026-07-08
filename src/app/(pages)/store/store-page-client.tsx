"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { fetchActiveFlashSalesByStore } from "@/services/flash-sales";
import { getStorePage, setStorePage } from "@/services/store-page-cache";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreHero } from "./store-hero";
import { StoreSectionsGrid } from "./store-sections-grid";
import { StoreProductsSection } from "./store-products-section";
import { StoreInfoSidebar } from "./store-info-sidebar";
import type { Product, Store, Section } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Skeleton className="w-full h-[240px] rounded-none" />
      <div className="bg-white px-4 pt-4 pb-5 space-y-4">
        <div className="flex gap-3 -mt-12">
          <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
          <div className="flex-1 pt-14 space-y-2">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-12 rounded-2xl" />
      </div>
      <div className="px-3 pt-2 space-y-3">
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <Skeleton className="aspect-[4/3] rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

/** دمج بيانات المنتجات مع الفلاش سيل */
function mergeFlash(
  products: Product[],
  flashData: Awaited<ReturnType<typeof fetchActiveFlashSalesByStore>>,
): Product[] {
  if (!flashData.length) return products;
  const flashMap = new Map(flashData.map(fs => [fs.productId, fs]));
  return products.map(p => {
    const fs = flashMap.get(p.id);
    return fs ? { ...p, flashPrice: fs.flashPrice, flashEndsAt: fs.endsAt } : p;
  });
}

export default function StorePageClient() {
  const searchParams  = useSearchParams();
  const storeId       = searchParams.get("id");

  const [store, setStore]               = useState<Store | null>(null);
  const [products, setProducts]         = useState<Product[]>([]);
  const [sections, setSections]         = useState<Section[]>([]);
  const [loading, setLoading]           = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Ref يتتبع أي storeIds لها refresh جارٍ في الخلفية.
   * مُفصَّل حسب storeId لمنع تداخل المتاجر عند التنقل السريع.
   */
  const refreshingStores = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }

    setErrorMessage(null);

    /* ─── إلغاء أي timeout معلّق إذا تغيّر storeId قبل تنفيذه ─── */
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    /* ─── Cache hit: عرض فوري + refresh صامت في الخلفية ─── */
    const cached = getStorePage(storeId);
    if (cached) {
      setStore(cached.store);
      setProducts(cached.products);
      setSections(cached.sections);
      setLoading(false);

      /* refresh صامت — مرة واحدة فقط لكل متجر في نفس الوقت */
      if (!refreshingStores.current.has(storeId)) {
        refreshingStores.current.add(storeId);

        refreshTimer = setTimeout(async () => {
          if (cancelled) {
            refreshingStores.current.delete(storeId);
            return;
          }
          try {
            const [productsData, flashSalesData] = await Promise.all([
              fetchProductsByStore(storeId),
              fetchActiveFlashSalesByStore(storeId),
            ]);
            if (!cancelled) {
              const updated = mergeFlash(productsData, flashSalesData);
              setProducts(updated);
              setStorePage(storeId, {
                store: cached.store,
                products: updated,
                sections: cached.sections,
              });
            }
          } catch { /* silent */ } finally {
            refreshingStores.current.delete(storeId);
          }
        }, 300);
      }

      return () => {
        cancelled = true;
        if (refreshTimer) clearTimeout(refreshTimer);
      };
    }

    /* ─── Cache miss: تحميل كامل ─── */
    setLoading(true);

    (async () => {
      try {
        const [fetchedStore, productsData, sectionsData, flashSalesData] = await Promise.all([
          fetchStoreById(storeId),
          fetchProductsByStore(storeId),
          fetchStoreSections(storeId),
          fetchActiveFlashSalesByStore(storeId),
        ]);

        if (cancelled) return;

        if (!fetchedStore)          throw new Error("لم يتم العثور على المتجر.");
        if (!fetchedStore.isActive) throw new Error("هذا المتجر غير متاح حالياً.");

        const productsWithFlash = mergeFlash(productsData, flashSalesData);

        setStorePage(storeId, {
          store: fetchedStore,
          products: productsWithFlash,
          sections: sectionsData,
        });
        setStore(fetchedStore);
        setProducts(productsWithFlash);
        setSections(sectionsData);
      } catch (err: any) {
        if (!cancelled) setErrorMessage(err?.message || "حدث خطأ أثناء تحميل المتجر.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (!storeId) return <div className="min-h-screen bg-slate-50" />;
  if (loading)  return <LoadingSkeleton />;

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-xl border border-slate-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">تعذّر تحميل المتجر</h2>
          <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-8">

      {/* هيرو المتجر */}
      <StoreHero store={store} productCount={products.length} />

      <div className="relative" style={{ zIndex: 10, background: "#f8fafc" }}>

        {/* أقسام المتجر */}
        {sections.length > 0 && (
          <StoreSectionsGrid sections={sections} storeId={storeId!} />
        )}

        {/* المنتجات + الشريط الجانبي */}
        <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 pt-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_268px]">
            <StoreProductsSection products={products} sections={sections} storeId={storeId!} />
            <StoreInfoSidebar store={store} />
          </div>
        </div>

      </div>

    </div>
  );
}
