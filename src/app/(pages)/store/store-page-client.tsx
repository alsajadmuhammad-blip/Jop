"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe } from "lucide-react";
import { StoreHero } from "./store-hero";
import { StoreProductsSection } from "./store-products-section";
import { StoreInfoSidebar } from "./store-info-sidebar";
import { StoreContactSidebar } from "./store-contact-sidebar";
import type { Product, Store, Section } from "@/lib/types";

export default function StorePageClient() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      if (!storeId) {
        setLoading(false);
        setStore(null);
        setProducts([]);
        setErrorMessage(null);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const fetchedStore = await fetchStoreById(storeId);
        if (!fetchedStore) {
          throw new Error("لم يتم العثور على المتجر.");
        }

        if (!fetchedStore.isActive) {
          throw new Error("هذا المتجر غير متاح حالياً.");
        }

        const productsData = await fetchProductsByStore(storeId);
        const sectionsData = await fetchStoreSections(storeId);

        setStore(fetchedStore);
        setProducts(productsData);
        setSections(sectionsData);
      } catch (error: any) {
        setErrorMessage(error?.message || "حدث خطأ أثناء تحميل بيانات المتجر.");
        setStore(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, [storeId]);

  if (!storeId) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-36 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 rounded-[2rem]" />
              <Skeleton className="h-64 rounded-[2rem]" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 rounded-[2rem]" />
              <Skeleton className="h-32 rounded-[2rem]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="border-red-200 bg-red-50 max-w-md">
          <CardContent className="pt-8 pb-8 px-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-200 mx-auto flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-900">خطأ</h2>
            <p className="text-red-700 font-semibold">{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <StoreHero store={store} />

        <div className="grid gap-8 lg:grid-cols-[1.7fr_0.95fr]">
          <div className="lg:col-span-2 space-y-8">
            <StoreProductsSection products={products} sections={sections} store={store} />
          </div>
          <div className="space-y-6">
            <StoreInfoSidebar store={store} />
            <StoreContactSidebar store={store} />
          </div>
        </div>
      </div>
    </div>
  );
}

