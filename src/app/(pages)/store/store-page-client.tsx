"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchProductsByStore, fetchStoreById, fetchStoreSections } from "@/services/supabase-db";
import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <BackButton href="/stores" className="mb-6" />
        <Card className="max-w-md w-full text-center shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">صفحة المتجر</h1>
            <p className="text-slate-600 mb-6">اختر متجرًا من القائمة لعرض تفاصيله</p>
            <Button asChild className="w-full">
              <a href="/stores">تصفح المتاجر</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <BackButton href="/stores" className="mb-8" />
          <Skeleton className="h-12 w-32 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <BackButton href="/stores" className="mb-6" />
        <Card className="max-w-md w-full text-center shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-full" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">خطأ في تحميل المتجر</h1>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <Button asChild variant="outline" className="w-full">
              <a href="/stores">العودة للمتاجر</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <StoreHero store={store} />

        <div className="grid gap-8 lg:grid-cols-[1.7fr_0.95fr]">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <StoreProductsSection products={products} sections={sections} store={store} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StoreInfoSidebar store={store} />
            <StoreContactSidebar store={store} />
          </div>
        </div>
      </div>
    </div>
  );
}

