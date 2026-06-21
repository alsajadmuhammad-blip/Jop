"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreHero } from "./store-hero";
import { StoreProductsSection } from "./store-products-section";
import { StoreInfoSidebar } from "./store-info-sidebar";
import { AlertTriangle } from "lucide-react";
import type { Product, Store, Section } from "@/lib/types";

/* ── Skeleton لهيرو المتجر ── */
function HeroSkeleton() {
  return (
    <div>
      <Skeleton className="w-full h-52 sm:h-64" />
      <div className="relative z-10 -mt-10 mx-4 sm:mx-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-end gap-4">
            <Skeleton className="w-20 h-20 rounded-2xl -mt-10 flex-shrink-0" />
            <div className="flex-1 space-y-2 pb-1">
              <Skeleton className="h-7 w-2/3 rounded-xl" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-11 flex-1 rounded-2xl" />
            <Skeleton className="h-11 w-24 rounded-2xl" />
            <Skeleton className="h-11 w-24 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton لقسم المنتجات ── */
function ProductsSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <Skeleton className="h-5 w-28 rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton للسايدبار ── */
function SidebarSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-xl" />
      ))}
    </div>
  );
}

export default function StorePageClient() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");

  const [store,    setStore]    = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  /* حالات التحميل منفصلة */
  const [storeLoading,    setStoreLoading]    = useState(true);
  const [contentLoading,  setContentLoading]  = useState(true);
  const [error,           setError]           = useState<string | null>(null);

  /* ── المرحلة الأولى: جلب المتجر فوراً ── */
  useEffect(() => {
    if (!storeId) { setStoreLoading(false); return; }

    setStoreLoading(true);
    setContentLoading(true);
    setError(null);

    fetchStoreById(storeId)
      .then((s) => {
        if (!s) throw new Error("لم يتم العثور على المتجر.");
        if (!s.isActive) throw new Error("هذا المتجر غير متاح حالياً.");
        setStore(s);
        setStoreLoading(false);
        return s;
      })
      .then((s) => {
        /* ── المرحلة الثانية: جلب المنتجات والأقسام بالتوازي ── */
        return Promise.all([
          fetchProductsByStore(s.id),
          fetchStoreSections(s.id),
        ]);
      })
      .then(([prods, secs]) => {
        setProducts(prods);
        setSections(secs);
        setContentLoading(false);
      })
      .catch((e: any) => {
        setError(e?.message ?? "حدث خطأ أثناء تحميل المتجر.");
        setStoreLoading(false);
        setContentLoading(false);
      });
  }, [storeId]);

  /* ── لا معرّف ── */
  if (!storeId) return <div className="min-h-screen" />;

  /* ── خطأ ── */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-12">

      {/* ── هيرو المتجر ── */}
      {storeLoading || !store ? (
        <HeroSkeleton />
      ) : (
        <StoreHero store={store} />
      )}

      {/* ── المحتوى الرئيسي ── */}
      <div className="container mx-auto px-4 max-w-5xl mt-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

          {/* المنتجات — العمود الرئيسي */}
          <div>
            {contentLoading ? (
              <ProductsSkeleton />
            ) : store ? (
              <StoreProductsSection
                products={products}
                sections={sections}
                store={store}
              />
            ) : null}
          </div>

          {/* السايدبار — معلومات المتجر */}
          <div className="order-first lg:order-last">
            {storeLoading || !store ? (
              <SidebarSkeleton />
            ) : (
              <StoreInfoSidebar store={store} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
