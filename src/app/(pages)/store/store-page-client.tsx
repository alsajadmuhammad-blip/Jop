"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { fetchActiveFlashSalesByStore } from "@/services/flash-sales";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreHero } from "./store-hero";
import { StoreSectionsGrid } from "./store-sections-grid";
import { StoreProductsSection } from "./store-products-section";
import { StoreInfoSidebar } from "./store-info-sidebar";
import type { Product, Store, Section } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Skeleton className="w-full h-[240px] rounded-none" />
      <div className="bg-white px-4 pt-4 pb-5 space-y-4">
        <div className="flex gap-3 -mt-12">
          <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
          <div className="flex-1 pt-14 space-y-2">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
        <Skeleton className="h-12 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

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
        const [fetchedStore, productsData, sectionsData, flashSalesData] = await Promise.all([
          fetchStoreById(storeId),
          fetchProductsByStore(storeId),
          fetchStoreSections(storeId),
          fetchActiveFlashSalesByStore(storeId),
        ]);

        if (!fetchedStore) throw new Error("لم يتم العثور على المتجر.");
        if (!fetchedStore.isActive) throw new Error("هذا المتجر غير متاح حالياً.");

        const flashMap = new Map(flashSalesData.map(fs => [fs.productId, fs]));
        const productsWithFlash = productsData.map(p => {
          const fs = flashMap.get(p.id);
          return fs ? { ...p, flashPrice: fs.flashPrice, flashEndsAt: fs.endsAt } : p;
        });

        setStore(fetchedStore);
        setProducts(productsWithFlash);
        setSections(sectionsData);
      } catch (err: any) {
        setErrorMessage(err?.message || "حدث خطأ أثناء تحميل المتجر.");
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  if (!storeId) return <div className="min-h-screen bg-white" />;
  if (loading) return <LoadingSkeleton />;

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

      {/* شبكة الأقسام */}
      {sections.length > 0 && (
        <StoreSectionsGrid sections={sections} storeId={storeId} />
      )}

      {/* جسم الصفحة */}
      <div className={`mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 ${sections.length > 0 ? "pt-3" : "pt-3"}`}>
        <div className="grid gap-3 lg:grid-cols-[1fr_268px]">
          <StoreProductsSection products={products} sections={sections} store={store} storeId={storeId} />
          <StoreInfoSidebar store={store} />
        </div>
      </div>
    </div>
  );
}
