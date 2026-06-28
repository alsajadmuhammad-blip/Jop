"use client";

import {
  useMemo, memo, useCallback, useState, useTransition, useRef, useEffect,
} from "react";
import { ProductGrid } from "@/components/product-grid";
import { Package } from "lucide-react";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

/* ── Sticky section tab bar with overflow indicator ─────────────── */
const SectionTabs = memo(function SectionTabs({
  sections,
  activeSection,
  onSectionChange,
}: {
  sections: Section[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      // RTL: scrollLeft is negative in Firefox, positive (reversed) in Chrome
      const absScroll = Math.abs(scrollLeft);
      const maxScroll = scrollWidth - clientWidth;
      setShowStartFade(absScroll > 6);
      setShowEndFade(maxScroll - absScroll > 6);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-slate-50 py-3">
      <div className="relative">
        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex items-center gap-2 px-1 min-w-max pb-0.5">
            {/* All tab */}
            <button
              onClick={() => onSectionChange("all")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
                activeSection === "all"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              الكل
            </button>

            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
                  activeSection === section.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right fade — more items to the right (RTL: start) */}
        {showStartFade && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10"
            style={{
              background: "linear-gradient(to left, #f8fafc 30%, transparent)",
            }}
          />
        )}

        {/* Left fade — more items to the left (RTL: end) */}
        {showEndFade && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-12 flex items-center justify-start pl-1"
            style={{
              background: "linear-gradient(to right, #f8fafc 40%, transparent)",
            }}
          >
            {/* Bouncing dots to hint at more */}
            <div className="flex gap-[3px] opacity-60">
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          </div>
        )}
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
