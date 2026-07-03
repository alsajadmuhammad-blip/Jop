"use client";

import { useMemo, memo, useCallback, useState, useTransition, useRef, useEffect } from "react";
import { ProductGrid } from "@/components/product-grid";
import { Package, LayoutGrid } from "lucide-react";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

/* ── Horizontal sections tab bar ──────────────────────────── */
function SectionTabBar({
  sections,
  activeSection,
  products,
  onSectionChange,
}: {
  sections: Section[];
  activeSection: string;
  products: Product[];
  onSectionChange: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  /* count products per section */
  const countMap = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    for (const p of products) {
      if (p.sectionId) map[p.sectionId] = (map[p.sectionId] ?? 0) + 1;
    }
    return map;
  }, [products]);

  /* scroll active tab into view */
  useEffect(() => {
    const el = activeRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const cWidth = container.clientWidth;
    const scrollTarget = elLeft - cWidth / 2 + elWidth / 2;
    container.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, [activeSection]);

  // Always show at least the "الكل" tab

  const allItems = [
    { id: "all", name: "الكل" },
    ...sections,
  ];

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
      {/* Label */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        <LayoutGrid className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
          تصفح الأقسام
        </span>
      </div>

      {/* Scrollable tabs */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-2 px-4 pb-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {allItems.map((item) => {
          const isActive = activeSection === item.id;
          const count = countMap[item.id] ?? 0;

          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSectionChange(item.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{item.name}</span>
              <span
                className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    <div id="store-products" className="min-w-0 rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm">
      {/* Section tab bar */}
      <SectionTabBar
        sections={sections}
        activeSection={activeSection}
        products={sortedProducts}
        onSectionChange={handleSectionChange}
      />

      {/* Products */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">لا توجد منتجات في هذا القسم</p>
            <p className="text-xs text-slate-400 mt-1">جرّب قسماً آخر</p>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
