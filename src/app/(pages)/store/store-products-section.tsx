"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/components/product-grid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe } from "lucide-react";
import type { Product, Section, Store } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store: Store | null;
}

export function StoreProductsSection({ products, sections, store }: StoreProductsSectionProps) {
  const derivedSections = useMemo(() => {
    if (sections.length > 0) return sections;
    const map = new Map<string, Section>();

    products.forEach((product) => {
      if (product.sectionId && product.sectionName) {
        map.set(product.sectionId, {
          id: product.sectionId,
          name: product.sectionName,
          storeId: store?.id || '',
        });
      }
    });

    return Array.from(map.values());
  }, [sections, products, store?.id]);

  if (products.length === 0) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد منتجات</h3>
            <p className="text-slate-600">سيتم إضافة المنتجات قريباً</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="store-products" className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">المنتجات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {derivedSections.length > 0 ? (
            <Tabs defaultValue={derivedSections[0]?.id || 'all'}>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                {derivedSections.map((s) => (
                  <TabsTrigger key={s.id} value={s.id}>
                    {s.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all">
                <ProductGrid products={products} />
              </TabsContent>

              {derivedSections.map((section) => {
                const sectionProducts = products.filter((product) => product.sectionId === section.id);
                return (
                  <TabsContent key={section.id} value={section.id}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">{section.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {sectionProducts.length > 0
                              ? `${sectionProducts.length} منتج في هذا القسم.`
                              : 'لا توجد منتجات في هذا القسم بعد.'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 border-slate-200">
                          {sectionProducts.length} منتج
                        </Badge>
                      </div>

                      {sectionProducts.length > 0 ? (
                        <ProductGrid products={sectionProducts} />
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                          <p className="text-sm font-medium text-slate-900">لا توجد منتجات في هذا القسم بعد.</p>
                          <p className="text-sm text-muted-foreground mt-2">سوف تظهر المنتجات هنا بمجرد إضافتها.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <>
              <ProductGrid products={products} />
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-900">هذا المتجر لم يعرّف أقسامًا بعد.</p>
                <p className="text-sm text-muted-foreground mt-2">ستظهر المنتجات هنا بصورة عامة حتى يتم إعداد الأقسام.</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
