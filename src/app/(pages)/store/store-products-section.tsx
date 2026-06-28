"use client";

import {
  useMemo, memo, useCallback, useState, useTransition,
} from "react";
import { ProductGrid } from "@/components/product-grid";
import { Package } from "lucide-react";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

/* ── Sticky section tab bar ─────────────────────────────────────── */
const SectionTabs = memo(function SectionTabs({
  sections,
  activeSection,
  onSectionChange,
}: {
  sections: Section[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-slate-50 pb-3 pt-1 -mx-0">
      <div
        className="overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex items-center gap-2 px-1 min-w-max">
          {/* All tab */}
          <button
            onClick={() => onSectionChange("all")}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
              activeSection === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            الكل
            <span className={`mr-1.5 text-xs font-medium ${activeSection === "all" ? "text-blue-200" : "text-slate-400"}`}>
              {sections.reduce(() => 0, 0) === 0 ? "" : ""}
            </span>
          </button>

          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
                activeSection === section.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

/* ── Main component ──────────────────────────────────────────────── */
function StoreProductsSectionContent({
  products,
  sections,
}: StoreProductsSectionProps) {
  const [activeSection, setActiveSection] = useState<string>("all");
  const [, startTransition] = useTransition();

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (a.isFeatured === b.isFeatured) return 0;
        return a.isFeatured ? -1 : 1;
      }),
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      activeSection === "all"
        ? sortedProducts
        : sortedProducts.filter((p) => p.sectionId === activeSection),
    [sortedProducts, activeSection]
  );

  const handleSectionChange = useCallback((id: string) => {
    startTransition(() => setActiveSection(id));
  }, []);

  return (
    <div id="store-products" className="min-w-0">
      {/* Sticky tabs */}
      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">لا توجد منتجات في هذا القسم</p>
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
