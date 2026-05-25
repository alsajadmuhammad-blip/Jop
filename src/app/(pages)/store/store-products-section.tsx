"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProductGrid } from "@/components/product-grid";
import { StoreSectionsNav } from "./store-sections-nav";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

export function StoreProductsSection({ products, sections, store }: StoreProductsSectionProps) {
  const [activeSection, setActiveSection] = useState<string>("all");

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (a.isFeatured === b.isFeatured) return 0;
      return a.isFeatured ? -1 : 1;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeSection === "all") return sortedProducts;
    return sortedProducts.filter((product) => product.sectionId === activeSection);
  }, [sortedProducts, activeSection]);

  return (
    <Card id="store-products" className="border-0 shadow-xl">
      <CardContent className="p-4 sm:p-6">
        <StoreSectionsNav
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {filteredProducts.length === 0 ? (
          <div className="py-12">
            <p className="text-center text-sm text-slate-600">لا توجد منتجات حالياً في هذا القسم.</p>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </CardContent>
    </Card>
  );
}
