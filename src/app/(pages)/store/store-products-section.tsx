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
  const navRef = useRef<HTMLDivElement | null>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const shadowCheckTimeoutRef = useRef<NodeJS.Timeout>();
  const rafRef = useRef<number>();

  const updateShadows = useCallback(() => {
    const el = navRef.current;
    if (!el) return;

    setShowLeftShadow(el.scrollLeft > 4);
    setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    updateShadows();

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (shadowCheckTimeoutRef.current) clearTimeout(shadowCheckTimeoutRef.current);
      
      rafRef.current = requestAnimationFrame(() => {
        shadowCheckTimeoutRef.current = setTimeout(updateShadows, 50);
      });
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    
    const observer = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateShadows);
    });
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      if (shadowCheckTimeoutRef.current) clearTimeout(shadowCheckTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateShadows]);

  return (
    <div className="mb-6 relative">
      <nav
        ref={navRef}
        className="max-w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          contain: 'layout style paint',
        }}
        aria-label="تنقل أقسام المتجر"
      >
        <div 
          className="inline-flex w-max min-w-max items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 shadow-sm"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <Button
            variant={activeSection === "all" ? "default" : "outline"}
            className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors duration-150"
            onClick={() => onSectionChange("all")}
          >
            الكل
          </Button>

          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors duration-150"
              onClick={() => onSectionChange(section.id)}
            >
              {section.name}
            </Button>
          ))}
        </div>
      </nav>
      {showLeftShadow && (
        <div 
          className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-50 to-transparent" 
          style={{ contain: 'strict' }}
        />
      )}
      {showRightShadow && (
        <div 
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-50 to-transparent" 
          style={{ contain: 'strict' }}
        />
      )}
    </div>
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
      className="border-0 shadow-xl min-w-0 overflow-hidden"
      style={{ contain: 'layout style paint' }}
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
