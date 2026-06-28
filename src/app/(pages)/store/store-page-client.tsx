"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreHero } from "./store-hero";
import type { Product, Store, Section } from "@/lib/types";

const StoreProductsSection = dynamic(
  () => import("./store-products-section").then((m) => ({ default: m.StoreProductsSection })),
  { loading: () => <Skeleton className="h-64 rounded-3xl" />, ssr: true }
);

const StoreInfoSidebar = dynamic(
  () => import("./store-info-sidebar").then((m) => ({ default: m.StoreInfoSidebar })),
  { loading: () => <Skeleton className="h-64 rounded-3xl" />, ssr: true }
);

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Skeleton className="w-full h-[230px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-12 rounded-2xl" />
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 mt-6">
          <Skeleton className="h-[400px] rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl hidden lg:block" />
        </div>
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
        const fetchedStore = await fetchStoreById(storeId);
        if (!fetchedStore) throw new Error("لم يتم العثور على المتجر.");
        if (!fetchedStore.isActive) throw new Error("هذا المتجر غير متاح حالياً.");

        const [productsData, sectionsData] = await Promise.all([
          fetchProductsByStore(storeId),
          fetchStoreSections(storeId),
        ]);

        setStore(fetchedStore);
        setProducts(productsData);
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
          <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center text-2xl">⚠️</div>
          <h2 className="text-lg font-bold text-red-900">تعذّر تحميل المتجر</h2>
          <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Full-width hero (no container) */}
      <StoreHero store={store} />

      {/* Page body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

          {/* ── Main column: products ── */}
          <div className="min-w-0">
            <StoreProductsSection
              products={products}
              sections={sections}
              store={store}
            />
          </div>

          {/* ── Sidebar: store info (desktop only, below products on mobile) ── */}
          <div className="min-w-0">
            <StoreInfoSidebar store={store} />
          </div>

        </div>
      </div>
    </div>
  );
}
