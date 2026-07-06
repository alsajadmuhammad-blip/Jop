"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { fetchActiveFlashSalesByStore } from "@/services/flash-sales";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreHero } from "./store-hero";
import type { Product, Store, Section } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

const StoreProductsSection = dynamic(
  () => import("./store-products-section").then((m) => ({ default: m.StoreProductsSection })),
  { loading: () => <Skeleton className="h-64 rounded-2xl" />, ssr: true }
);

const StoreInfoSidebar = dynamic(
  () => import("./store-info-sidebar").then((m) => ({ default: m.StoreInfoSidebar })),
  { loading: () => <Skeleton className="h-48 rounded-2xl" />, ssr: true }
);

/* ── هيكل التحميل ─────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* غلاف */}
      <Skeleton className="w-full h-[220px]" />
      <div className="mx-auto max-w-5xl px-4 sm:px-5 lg:px-8 py-5 space-y-4">
        {/* هوية */}
        <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex gap-3">
            <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-2">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-12 rounded-2xl" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        </div>
        {/* منتجات */}
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   صفحة المتجر الرئيسية
══════════════════════════════════════════════ */
export default function StorePageClient() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }

    setLoading(true);
    setErrorMessage(null);

    (async () => {
      try {
        const fetchedStore = await fetchStoreById(storeId);
        if (!fetchedStore) throw new Error("لم يتم العثور على المتجر.");
        if (!fetchedStore.isActive) throw new Error("هذا المتجر غير متاح حالياً.");

        const [productsData, sectionsData, flashSalesData] = await Promise.all([
          fetchProductsByStore(storeId),
          fetchStoreSections(storeId),
          fetchActiveFlashSalesByStore(storeId),
        ]);

        const flashMap = new Map(flashSalesData.map((fs) => [fs.productId, fs]));
        const productsWithFlash = productsData.map((p) => {
          const fs = flashMap.get(p.id);
          if (fs) return { ...p, flashPrice: fs.flashPrice, flashEndsAt: fs.endsAt };
          return p;
        });

        setStore(fetchedStore);
        setProducts(productsWithFlash);
        setSections(sectionsData);
      } catch (err: any) {
        setErrorMessage(err?.message || "حدث خطأ أثناء تحميل المتجر.");
        setStore(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  if (!storeId) return <div className="min-h-screen bg-slate-50" />;
  if (loading) return <LoadingSkeleton />;

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white border border-red-100 shadow-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">تعذّر تحميل المتجر</h2>
          <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen bg-slate-100/60">

      {/* بطاقة الهيرو — بدون هوامش */}
      <div className="bg-white shadow-sm mb-3">
        <StoreHero store={store} />
      </div>

      {/* جسم الصفحة */}
      <div className="mx-auto max-w-5xl px-3 sm:px-5 lg:px-8 pb-8">
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">

          {/* عمود المنتجات */}
          <div className="min-w-0">
            <StoreProductsSection
              products={products}
              sections={sections}
              store={store}
            />
          </div>

          {/* الشريط الجانبي — ديسكتوب فوق، موبايل تحت */}
          <div className="min-w-0 lg:order-last order-last">
            <StoreInfoSidebar store={store} />
          </div>

        </div>
      </div>
    </div>
  );
}
