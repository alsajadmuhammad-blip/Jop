"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { fetchProductsByStore, fetchStoreById } from "@/services/supabase-db";
import { BackButton } from "@/components/layout/back-button";
import { ProductGrid } from "@/components/product-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Truck, Phone, Mail, Clock, Globe } from "lucide-react";
import type { Product, Store } from "@/lib/types";

export default function StorePageClient() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("id");
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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

        setStore(fetchedStore);
        setProducts(productsData);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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
        <BackButton href="/stores" className="mb-8" />

        {/* Hero Section */}
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-200/80 mb-10">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <div className="relative min-h-[320px] bg-slate-900 overflow-hidden">
              {store.coverImageUrl || store.logoUrl ? (
                <Image
                  src={store.coverImageUrl || store.logoUrl || ""}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center text-white">
                  <Globe className="w-16 h-16 opacity-60 mb-4" />
                  <p className="text-lg font-medium">لا توجد صورة متاحة</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>

            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {store.marketType || "متجر إلكتروني"}
                </Badge>
                {store.hasDelivery && (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    <Truck className="w-3 h-3 ml-1" />
                    توصيل
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-950 mb-4">
                  {store.name}
                </h1>
                <p className="text-slate-600 leading-relaxed max-w-2xl">
                  {store.description || "واجهة متجر متكاملة مع عرض واضح للمنتجات والمعلومات الأساسية."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">التقييم</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{store.reviews > 0 ? store.rating.toFixed(1) : "جديد"}</p>
                </div>
                <div className="rounded-3xl bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">الموقع</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{store.location || "غير محدد"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="min-w-full sm:min-w-[160px]">
                  ابدأ التسوق
                </Button>
                <Button size="lg" variant="outline" className="min-w-full sm:min-w-[160px]">
                  تواصل معنا
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.7fr_0.95fr]">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Products Section */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">المنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <ProductGrid products={products} />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد منتجات</h3>
                    <p className="text-slate-600">سيتم إضافة المنتجات قريباً</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Store Info Card */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">معلومات المتجر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">الاسم</label>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{store.name}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">النوع</label>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{store.marketType || "عام"}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">الموقع</label>
                    <p className="text-sm text-slate-700 mt-1">{store.location || "غير محدد"}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">التوصيل</label>
                    <p className="text-sm font-semibold mt-1">
                      {store.hasDelivery ? (
                        <span className="text-green-600">متاح</span>
                      ) : (
                        <span className="text-slate-500">غير متاح</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">الحالة</label>
                    <p className="text-sm font-semibold mt-1">
                      {store.isActive ? (
                        <span className="text-green-600">نشط</span>
                      ) : (
                        <span className="text-red-600">متوقف</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">التقييم</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                      <span className="text-sm font-semibold">
                        {store.reviews > 0 ? store.rating.toFixed(1) : "جديد"}
                      </span>
                      {store.reviews > 0 && (
                        <span className="text-xs text-slate-500">({store.reviews} تقييم)</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">التواصل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.whatsappNumber && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-slate-500">واتساب</p>
                      <p className="text-sm font-semibold text-slate-900">{store.whatsappNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">الموقع</p>
                    <p className="text-sm font-semibold text-slate-900">متجر إلكتروني</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">الحالة</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {store.isActive ? "مفتوح الآن" : "مغلق"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
