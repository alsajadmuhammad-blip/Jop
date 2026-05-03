import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { ProductGrid } from "@/components/product-grid";
import { fetchStoreById, fetchProductsByStore } from "@/services/supabase-db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Building, Truck } from "lucide-react";
import type { Store } from "@/lib/types";

interface StorePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const store = await fetchStoreById(params.id);

  if (!store) {
    return {
      title: "Store not found",
    };
  }

  return {
    title: store.name,
    description: store.description || `متجر ${store.name}`,
  };
}

async function getStoreData(storeId: string) {
  const store = await fetchStoreById(storeId);
  if (!store || !store.isActive) {
    return null;
  }

  const products = await fetchProductsByStore(storeId);
  return { ...store, products } as Store;
}

export default async function StorePage({ params }: StorePageProps) {
  const store = await getStoreData(params.id);
  if (!store) {
    notFound();
  }

  return (
    <div className="bg-background min-h-full">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <BackButton href="/stores" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="relative h-72 bg-muted/20">
                {store.coverImageUrl || store.logoUrl ? (
                  <Image
                    src={store.coverImageUrl || store.logoUrl || ''}
                    alt={store.name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                    صورة المتجر غير متوفرة
                  </div>
                )}
              </div>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold">{store.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {store.description || 'متجر يقدم أفضل المنتجات والخدمات.'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">{store.type}</Badge>
                    <Badge variant="outline" className="rounded-full">{store.marketType || 'عام'}</Badge>
                    {store.hasDelivery && <Badge variant="default" className="rounded-full">توصيل متاح</Badge>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">الموقع</div>
                    <div className="font-semibold">{store.location || 'غير محدد'}</div>
                    {store.latitude && store.longitude ? (
                      <div className="text-sm text-muted-foreground">خط العرض: {store.latitude}, خط الطول: {store.longitude}</div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">التقييم</div>
                    <div className="font-semibold">{store.reviews > 0 ? store.rating.toFixed(1) : 'لا توجد تقييمات بعد'}</div>
                    <div className="text-sm text-muted-foreground">عدد التقييمات: {store.reviews || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>العروض والمنتجات</CardTitle>
                <CardDescription>جميع المنتجات المتاحة في هذا المتجر.</CardDescription>
              </CardHeader>
              <CardContent>
                {store.products && store.products.length > 0 ? (
                  <ProductGrid products={store.products} />
                ) : (
                  <Alert>
                    <AlertTitle>لا يوجد منتجات</AlertTitle>
                    <AlertDescription>لم يتم إضافة منتجات لهذا المتجر بعد.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تفاصيل المتجر</p>
                  <p className="font-semibold">{store.name}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {store.whatsappNumber && <div>واتساب: {store.whatsappNumber}</div>}
                {store.activationDate && <div>تاريخ التفعيل: {new Date(store.activationDate).toLocaleDateString('ar-SA')}</div>}
                <div>حالة المتجر: {store.isActive ? 'فعال' : 'غير فعال'}</div>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold">خدمة التوصيل</p>
                  <p className="text-muted-foreground">{store.hasDelivery ? 'متاحة' : 'غير متاحة'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">الموقع</p>
                  <p className="text-muted-foreground">{store.location || 'غير محدد'}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
