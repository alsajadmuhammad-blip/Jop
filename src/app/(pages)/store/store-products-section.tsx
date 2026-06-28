"use client";

import { useMemo, memo, useCallback, useState, useTransition } from "react";
import { ProductGrid } from "@/components/product-grid";
import { Package, ChevronDown, Check, LayoutGrid } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

/* ── Section picker bottom sheet ───────────────────────────────── */
function SectionPicker({
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
  const [open, setOpen] = useState(false);

  if (sections.length === 0) return null;

  const activeName =
    activeSection === "all"
      ? "جميع المنتجات"
      : sections.find((s) => s.id === activeSection)?.name ?? "جميع المنتجات";

  /* count products per section */
  const countMap = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    for (const p of products) {
      if (p.sectionId) map[p.sectionId] = (map[p.sectionId] ?? 0) + 1;
    }
    return map;
  }, [products]);

  const handleSelect = (id: string) => {
    onSectionChange(id);
    setOpen(false);
  };

  const allItems = [
    { id: "all", name: "جميع المنتجات" },
    ...sections,
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* ── Trigger bar ────────────────────────────────── */}
      <SheetTrigger asChild>
        <button
          className="sticky top-0 z-20 w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-100 shadow-sm transition-all active:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">القسم المختار</p>
              <p className="text-sm font-bold text-slate-800 leading-none">{activeName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSection !== "all" && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                {countMap[activeSection] ?? 0} منتج
              </span>
            )}
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </button>
      </SheetTrigger>

      {/* ── Bottom sheet content ────────────────────────── */}
      <SheetContent
        side="bottom"
        className="rounded-t-[2rem] px-0 pb-8 max-h-[75vh] overflow-hidden flex flex-col"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <SheetHeader className="px-5 pb-3 flex-shrink-0">
          <SheetTitle className="text-right text-lg font-extrabold text-slate-900">
            اختر القسم
          </SheetTitle>
          <p className="text-right text-xs text-slate-400">
            {sections.length + 1} قسم متاح
          </p>
        </SheetHeader>

        {/* Divider */}
        <div className="h-px bg-slate-100 flex-shrink-0" />

        {/* Section list */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {allItems.map((item) => {
            const isActive = activeSection === item.id;
            const count = countMap[item.id] ?? 0;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl mb-1.5 transition-all active:scale-[0.98] text-right ${
                  isActive
                    ? "bg-blue-600 shadow-md shadow-blue-200"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Indicator */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-white/20" : "bg-white border border-slate-200"
                    }`}
                  >
                    {isActive ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <LayoutGrid className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* Name */}
                  <span
                    className={`font-bold text-sm truncate ${
                      isActive ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Count badge */}
                <span
                  className={`text-xs font-bold rounded-full px-2.5 py-1 flex-shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white border border-slate-200 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
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
    <div id="store-products" className="min-w-0">
      {/* Section picker */}
      <SectionPicker
        sections={sections}
        activeSection={activeSection}
        products={sortedProducts}
        onSectionChange={handleSectionChange}
      />

      {/* Products */}
      <div className="pt-4">
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
