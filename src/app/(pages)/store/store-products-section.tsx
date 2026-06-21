"use client";

import { useEffect, useMemo, useRef, useState, memo, useCallback, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

interface StoreSectionsNavProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const StoreSectionsNav = memo(function StoreSectionsNav({
  sections,
  activeSection,
  onSectionChange,
}: StoreSectionsNavProps) {
  return (
    <nav className="overflow-x-auto pb-2 mb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div 
        className="inline-flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 shadow-sm"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
      >
        <Button
          variant={activeSection === "all" ? "default" : "outline"}
          className="min-w-[80px] whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all duration-200"
          onClick={() => onSectionChange("all")}
        >
          الكل
        </Button>

        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            className="min-w-[80px] whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all duration-200"
            onClick={() => onSectionChange(section.id)}
          >
            {section.name}
          </Button>
        ))}
      </div>
    </nav>
  );
});

function StoreProductsSectionContent({ products, sections, store }: StoreProductsSectionProps) {
  const [activeSection, setActiveSection] = useState<string>("all");
  const [, startTransition] = useTransition();

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

  const handleSectionChange = useCallback((sectionId: string) => {
    startTransition(() => {
      setActiveSection(sectionId);
    });
  }, []);

  return (
    <Card 
      id="store-products" 
      className="border-0 shadow-xl min-w-0"
    >
      <CardContent className="p-4 sm:p-6 min-w-0">
        <StoreSectionsNav
          sections={sections}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
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

export const StoreProductsSection = memo(StoreProductsSectionContent);
