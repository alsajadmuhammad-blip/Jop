"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { fetchActiveFlashSalesByStore } from "@/services/flash-sales";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreHero } from "./store-hero";
import type { Product, Store, Section } from "@/lib/types";
import { AlertTriangle, MessageSquare } from "lucide-react";

const StoreProductsSection = dynamic(
  () => import("./store-products-section").then((m) => ({ default: m.StoreProductsSection })),
  { loading: () => <Skeleton className="h-96 rounded-2xl" />, ssr: true }
);

const StoreInfoSidebar = dynamic(
  () => import("./store-info-sidebar").then((m) => ({ default: m.StoreInfoSidebar })),
  { loading: () => <Skeleton className="h-48 rounded-2xl" />, ssr: true }
);

/* ── هيكل التحميل ─────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100/60">
      <Skeleton className="w-full h-[300px] rounded-none" />
      <div className="bg-white px-4 pt-4 pb-5 space-y-4">
        <div className="flex gap-3 -mt-12">
          <Skeleton className="w-24 h-24 rounded-2xl flex-shrink-0" />
          <div className="flex-1 pt-14 space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-14 rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      </div>
      <div className="px-3 pt-3 space-y-3">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   صفحة المتجر
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
          return fs ? { ...p, flashPrice: fs.flashPrice, flashEndsAt: fs.endsAt } : p;
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

  if (!storeId) return <div className="min-h-screen bg-slate-100/60" />;
  if (loading) return <LoadingSkeleton />;

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white shadow-xl p-8 text-center space-y-4">
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

  const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
  const whatsappHref = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;

  return (
    <div className="min-h-screen bg-slate-100/60 pb-24 lg:pb-8">

      {/* ── هيرو المتجر (بلا هوامش) ── */}
      <StoreHero store={store} productCount={products.length} />

      {/* ── جسم الصفحة ── */}
      <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 pt-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_268px]">

          {/* عمود المنتجات */}
          <div className="min-w-0">
            <StoreProductsSection products={products} sections={sections} store={store} />
          </div>

          {/* الشريط الجانبي */}
          <div className="min-w-0">
            <StoreInfoSidebar store={store} />
          </div>

        </div>
      </div>

      {/* ── زر واتساب عائم (موبايل فقط) ── */}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل عبر واتساب"
          className="lg:hidden fixed bottom-24 left-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95"
          style={{ background: "#25D366", boxShadow: "0 8px 24px rgba(37,211,102,0.45)" }}
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </a>
      )}
    </div>
  );
}
