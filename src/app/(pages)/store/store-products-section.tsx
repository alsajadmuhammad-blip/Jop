"use client";

import { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
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
  const navRef = useRef<HTMLDivElement | null>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const updateShadows = () => {
      setShowLeftShadow(el.scrollLeft > 4);
      setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    updateShadows();
    el.addEventListener("scroll", updateShadows, { passive: true });
    window.addEventListener("resize", updateShadows);

    return () => {
      el.removeEventListener("scroll", updateShadows);
      window.removeEventListener("resize", updateShadows);
    };
  }, [sections]);

  return (
    <div className="mb-6 relative">
      <nav
        ref={navRef}
        className="max-w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label="تنقل أقسام المتجر"
      >
        <div className="inline-flex w-max min-w-max items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 shadow-sm">
          <Button
            variant={activeSection === "all" ? "default" : "outline"}
            className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs"
            onClick={() => onSectionChange("all")}
          >
            الكل
          </Button>

          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs"
              onClick={() => onSectionChange(section.id)}
            >
              {section.name}
            </Button>
          ))}
        </div>
      </nav>
      {showLeftShadow && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-50 to-transparent" />
      )}
      {showRightShadow && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-50 to-transparent" />
      )}
    </div>
  );
});

function StoreProductsSectionContent({ products, sections, store }: StoreProductsSectionProps) {
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

  const handleSectionChange = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
  }, []);

  return (
    <Card id="store-products" className="border-0 shadow-xl min-w-0 overflow-hidden">
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
