"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { fetchActiveFlashSalesByStore } from "@/services/flash-sales";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/product-grid";
import type { Product, Store, Section } from "@/lib/types";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Skeleton className="w-full h-52 rounded-none" />
      <div className="px-4 pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function SectionPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");
  const sectionId = searchParams.get("section");

  const [store, setStore] = useState<Store | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId || !sectionId) { setLoading(false); return; }

    (async () => {
      try {
        const [fetchedStore, allProducts, sections, flashSales] = await Promise.all([
          fetchStoreById(storeId),
          fetchProductsByStore(storeId),
          fetchStoreSections(storeId),
          fetchActiveFlashSalesByStore(storeId),
        ]);

        if (!fetchedStore) return;

        const flashMap = new Map(flashSales.map(fs => [fs.productId, fs]));
        const productsWithFlash = allProducts.map(p => {
          const fs = flashMap.get(p.id);
          return fs ? { ...p, flashPrice: fs.flashPrice, flashEndsAt: fs.endsAt } : p;
        });

        const sectionProducts = productsWithFlash.filter(p => p.sectionId === sectionId);
        const foundSection = sections.find(s => s.id === sectionId) ?? null;

        setStore(fetchedStore);
        setSection(foundSection);
        setProducts(sectionProducts);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId, sectionId]);

  if (loading) return <LoadingSkeleton />;

  const hasImage = Boolean(section?.imageUrl);

  return (
    <div className="min-h-screen bg-white pb-16" dir="rtl">

      {/* غلاف القسم */}
      <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
        {hasImage ? (
          <Image
            src={section!.imageUrl!}
            alt={section?.name || ""}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* زر الرجوع للمتجر */}
        <button
          onClick={() => router.push(`/store?id=${storeId}`)}
          className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 text-sm font-semibold text-slate-800 shadow-md active:scale-95 transition-transform"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{store?.name || "المتجر"}</span>
        </button>

        {/* اسم القسم */}
        <div className="absolute bottom-0 right-0 left-0 p-5">
          <h1 className="text-2xl font-black text-white drop-shadow-md">
            {section?.name || "القسم"}
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium">
            {products.length} {products.length === 1 ? "منتج" : "منتج"}
          </p>
        </div>
      </div>

      {/* شبكة المنتجات */}
      <div className="px-3 sm:px-4 pt-5">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-4">
              <Package className="w-9 h-9 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-slate-600 mb-1">لا توجد منتجات في هذا القسم</p>
            <p className="text-sm text-slate-400">تابع المتجر لمعرفة آخر الإضافات</p>
            <button
              onClick={() => router.push(`/store?id=${storeId}`)}
              className="mt-5 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-bold active:scale-95 transition-transform"
            >
              العودة للمتجر
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
