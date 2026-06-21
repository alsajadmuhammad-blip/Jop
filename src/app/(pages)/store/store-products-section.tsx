"use client";

import { memo, useMemo, useCallback, useTransition, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Package } from "lucide-react";
import { ProductGrid } from "@/components/product-grid";
import type { Product, Section } from "@/lib/types";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

/* ── نافبار الأقسام اللاصق ── */
const SectionsNav = memo(function SectionsNav({
  sections,
  active,
  counts,
  onChange,
}: {
  sections: Section[];
  active: string;
  counts: Record<string, number>;
  onChange: (id: string) => void;
}) {
  const navRef = useRef<HTMLDivElement>(null);

  /* تمرير تلقائي للقسم النشط */
  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLButtonElement>(`[data-id="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  if (sections.length === 0) return null;

  return (
    <div className="sticky top-[56px] z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 -mx-4 sm:-mx-5 px-4 sm:px-5 pt-2 pb-2">
      <div
        ref={navRef}
        className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5"
      >
        {/* زر الكل */}
        <button
          data-id="all"
          onClick={() => onChange("all")}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            active === "all"
              ? "bg-primary text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          الكل
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            active === "all" ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
          }`}>
            {counts["all"] ?? 0}
          </span>
        </button>

        {sections.map((sec) => (
          <button
            key={sec.id}
            data-id={sec.id}
            onClick={() => onChange(sec.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              active === sec.id
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {sec.name}
            {counts[sec.id] !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                active === sec.id ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}>
                {counts[sec.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

/* ── قسم المنتجات الرئيسي ── */
function StoreProductsSectionContent({ products, sections }: StoreProductsSectionProps) {
  const [active, setActive]     = useState("all");
  const [, startTransition]     = useTransition();

  const sorted = useMemo(
    () => [...products].sort((a, b) => (a.isFeatured === b.isFeatured ? 0 : a.isFeatured ? -1 : 1)),
    [products]
  );

  /* عدد المنتجات لكل قسم */
  const counts = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = { all: sorted.length };
    sections.forEach((sec) => {
      map[sec.id] = sorted.filter((p) => p.sectionId === sec.id).length;
    });
    return map;
  }, [sorted, sections]);

  const visible = useMemo(
    () => (active === "all" ? sorted : sorted.filter((p) => p.sectionId === active)),
    [sorted, active]
  );

  const handleChange = useCallback((id: string) => {
    startTransition(() => setActive(id));
  }, []);

  return (
    <div id="store-products" className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="px-4 sm:px-5 pt-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          المنتجات
        </h2>

        <SectionsNav
          sections={sections}
          active={active}
          counts={counts}
          onChange={handleChange}
        />
      </div>

      <div className="p-4 sm:p-5">
        <AnimatePresence mode="wait">
          {visible.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Package className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                لا توجد منتجات في هذا القسم
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ProductGrid products={visible} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
