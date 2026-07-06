"use client";

import { useMemo, memo, useCallback, useState, useTransition, useRef, useEffect } from "react";
import { ProductGrid } from "@/components/product-grid";
import { Package, LayoutGrid, Zap } from "lucide-react";
import type { Product, Section } from "@/lib/types";
import { hasActiveFlashSale } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

/* ── شريط التبويبات ────────────────────────────── */
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

  const countMap = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    for (const p of products) {
      if (p.sectionId) map[p.sectionId] = (map[p.sectionId] ?? 0) + 1;
    }
    return map;
  }, [products]);

  useEffect(() => {
    const el = activeRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const scrollTarget = el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
    container.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, [activeSection]);

  const allItems = [{ id: "all", name: "الكل" }, ...sections];

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-2 px-4 py-3"
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
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{item.name}</span>
              <span
                className={`text-[11px] font-bold rounded-full px-1.5 py-0 min-w-[20px] text-center leading-5 ${
                  isActive ? "bg-white/25 text-white" : "bg-white text-slate-500 border border-slate-200"
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

/* ── بطاقة عرض فلاش سيل صغيرة ────────────────── */
function FlashSaleBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 mx-4 mt-4 mb-2 bg-gradient-to-l from-amber-500 to-orange-500 rounded-2xl px-4 py-2.5 shadow-md shadow-amber-200">
      <Zap className="w-4 h-4 text-white flex-shrink-0" />
      <p className="text-white text-sm font-black">
        {count} منتج بعرض فلاش الآن!
      </p>
      <span className="mr-auto bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
        محدود
      </span>
    </div>
  );
}

/* ── المكوّن الرئيسي ────────────────────────────── */
function StoreProductsSectionContent({ products, sections }: StoreProductsSectionProps) {
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

  const flashCount = useMemo(
    () => filteredProducts.filter((p) => hasActiveFlashSale(p)).length,
    [filteredProducts]
  );

  const handleSectionChange = useCallback((id: string) => {
    startTransition(() => setActiveSection(id));
  }, []);

  return (
    <div id="store-products" className="min-w-0 rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm">

      {/* شريط الأقسام */}
      <SectionTabBar
        sections={sections}
        activeSection={activeSection}
        products={sortedProducts}
        onSectionChange={handleSectionChange}
      />

      {/* بنر فلاش سيل */}
      <FlashSaleBanner count={flashCount} />

      {/* شبكة المنتجات */}
      <div className="p-3 sm:p-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-500 mb-1">لا توجد منتجات</p>
            <p className="text-sm text-slate-400">جرّب قسماً آخر أو تفقّد لاحقاً</p>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
