"use client";

import {
  useMemo, memo, useState, useRef,
} from "react";
import Image from "next/image";
import { ProductGrid } from "@/components/product-grid";
import {
  Package, Zap, ImageIcon, ShoppingCart, Check,
  Search, X, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import type { Product, Section } from "@/lib/types";
import {
  hasActiveFlashSale, hasActiveDiscount, getDiscountedPrice, getEffectivePrice,
} from "@/lib/types";
import { useCountdown } from "@/hooks/use-countdown";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StoreProductsSectionProps {
  products: Product[];
  sections?: Section[];
  store?: { type?: string };
  storeId?: string;
}

type SortOption = "default" | "price_asc" | "price_desc" | "offers_first";

/* ────────────────────────────────────────────
   عداد الفلاش سيل
──────────────────────────────────────────── */
function FlashTimer({ endsAt }: { endsAt: string }) {
  const { formatted, isExpired } = useCountdown(endsAt);
  if (isExpired) return null;
  const [hh, mm, ss] = formatted.split(":");
  return (
    <div className="flex items-center gap-1">
      {[hh, mm, ss].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="inline-flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg w-9 h-9 justify-center font-black text-white text-sm tabular-nums">
            {v}
          </span>
          {i < 2 && <span className="text-white font-black text-base">:</span>}
        </span>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   بطاقة منتج أفقية (للكاروسيل المميز)
──────────────────────────────────────────── */
function FeaturedProductCard({ product, storeId }: { product: Product; storeId?: string }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const flash = hasActiveFlashSale(product);
  const onSale = flash || hasActiveDiscount(product);
  const price = flash ? product.flashPrice! : onSale ? getDiscountedPrice(product) : product.price;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    addItem(product);
    toast({ title: "أُضيف للسلة ✓", description: product.name, productImage: product.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex-shrink-0 w-36 sm:w-40 group cursor-pointer">
      <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="relative bg-slate-50 overflow-hidden" style={{ aspectRatio: "1/1" }}>
          {product.imageUrl ? (
            product.imageUrl.startsWith("data:") ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
            ) : (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-400" sizes="160px" />
            )
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <ImageIcon className="w-8 h-8 text-slate-200" />
            </div>
          )}
          {flash && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-amber-500 rounded-full px-2 py-0.5">
              <Zap className="w-2.5 h-2.5 text-white fill-white" />
              <span className="text-[9px] font-black text-white">فلاش</span>
            </div>
          )}
          {!flash && hasActiveDiscount(product) && (
            <div className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              -{product.discountPercent}%
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-[12px] font-bold text-slate-800 line-clamp-1 mb-1.5">{product.name}</p>
          <div className="flex items-center justify-between gap-1">
            <div>
              {onSale && <p className="text-[9px] text-slate-400 line-through">{product.price.toLocaleString()}</p>}
              <p className={cn("text-sm font-black leading-none", flash ? "text-amber-600" : onSale ? "text-rose-600" : "text-slate-900")}>
                {price.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">د.ع</span>
              </p>
            </div>
            <button
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90",
                added ? "bg-emerald-500" : "bg-primary hover:bg-primary/90",
                "disabled:opacity-30"
              )}
            >
              {added ? <Check className="w-3 h-3 text-white" /> : <ShoppingCart className="w-3 h-3 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   شريط المنتجات المميزة
──────────────────────────────────────────── */
function FeaturedStrip({ products, storeId }: { products: Product[]; storeId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;
  return (
    <div className="bg-white border-b border-slate-100 py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full block" />
          المنتجات المميزة
        </h2>
        <span className="text-xs text-slate-400 font-medium">{products.length} منتج</span>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        {products.map(p => <FeaturedProductCard key={p.id} product={p} storeId={storeId} />)}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   بنر فلاش سيل
──────────────────────────────────────────── */
function FlashSaleBanner({ products }: { products: Product[] }) {
  const first = products.find(p => p.flashEndsAt);
  if (!first?.flashEndsAt) return null;
  return (
    <div
      className="overflow-hidden"
      style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)" }}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">عروض الفلاش</p>
            <p className="text-white/70 text-[10px] mt-0.5">ينتهي خلال</p>
          </div>
        </div>
        <FlashTimer endsAt={first.flashEndsAt} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   شريط البحث والفلترة
──────────────────────────────────────────── */
interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeSection: string | null;
  onSectionChange: (id: string | null) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  sectionFilters: { id: string; name: string }[];
  totalCount: number;
  filteredCount: number;
}

function FilterBar({
  search, onSearchChange,
  activeSection, onSectionChange,
  sortBy, onSortChange,
  sectionFilters, totalCount, filteredCount,
}: FilterBarProps) {
  const [showSort, setShowSort] = useState(false);

  const sortLabels: Record<SortOption, string> = {
    default: "الافتراضي",
    price_asc: "السعر: الأقل",
    price_desc: "السعر: الأعلى",
    offers_first: "العروض أولاً",
  };

  return (
    <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-slate-100 space-y-2.5">
      {/* حقل البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="ابحث في منتجات المتجر…"
          className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 pr-9 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          dir="rtl"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* الفلاتر + الترتيب */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {/* فلتر الأقسام */}
        <button
          onClick={() => onSectionChange(null)}
          className={cn(
            "flex-shrink-0 h-7 px-3 rounded-full text-[12px] font-bold transition-all",
            activeSection === null
              ? "bg-primary text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          الكل
        </button>
        {sectionFilters.map(sec => (
          <button
            key={sec.id}
            onClick={() => onSectionChange(activeSection === sec.id ? null : sec.id)}
            className={cn(
              "flex-shrink-0 h-7 px-3 rounded-full text-[12px] font-bold transition-all",
              activeSection === sec.id
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {sec.name}
          </button>
        ))}

        {/* فاصل */}
        <div className="flex-1" />

        {/* زر الترتيب */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSort(v => !v)}
            className={cn(
              "flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-bold transition-all border",
              sortBy !== "default"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <SlidersHorizontal className="w-3 h-3" />
            {sortLabels[sortBy]}
            <ChevronDown className={cn("w-3 h-3 transition-transform", showSort && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-9 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden min-w-[150px]"
                dir="rtl"
              >
                {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { onSortChange(key); setShowSort(false); }}
                    className={cn(
                      "w-full text-right px-4 py-2.5 text-[13px] font-semibold transition-colors",
                      sortBy === key
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* عدد النتائج */}
      {(search || activeSection) && (
        <p className="text-[11px] text-slate-400 font-medium">
          {filteredCount === totalCount
            ? `${totalCount} منتج`
            : `${filteredCount} من ${totalCount} منتج`}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   المكوّن الرئيسي
──────────────────────────────────────────── */
function StoreProductsSectionContent({
  products, sections = [], storeId,
}: StoreProductsSectionProps) {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const sorted = useMemo(() =>
    [...products].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return 0;
    }), [products]);

  const featured = useMemo(() => sorted.filter(p => p.isFeatured), [sorted]);
  const flashProducts = useMemo(() => sorted.filter(p => hasActiveFlashSale(p)), [sorted]);

  // استخراج فلاتر الأقسام من المنتجات
  const sectionFilters = useMemo(() => {
    if (sections.length > 0) {
      return sections.map(s => ({ id: s.id, name: s.name }));
    }
    const map = new Map<string, string>();
    products.forEach(p => {
      if (p.sectionId && p.sectionName) map.set(p.sectionId, p.sectionName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sections, products]);

  // تطبيق البحث والفلترة والترتيب
  const filtered = useMemo(() => {
    let result = [...sorted];

    // بحث نصي
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    }

    // فلتر القسم
    if (activeSection) {
      result = result.filter(p => p.sectionId === activeSection);
    }

    // ترتيب
    if (sortBy === "price_asc") {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === "offers_first") {
      result.sort((a, b) => {
        const aOffer = hasActiveFlashSale(a) || hasActiveDiscount(a) ? 1 : 0;
        const bOffer = hasActiveFlashSale(b) || hasActiveDiscount(b) ? 1 : 0;
        return bOffer - aOffer;
      });
    }

    return result;
  }, [sorted, search, activeSection, sortBy]);

  return (
    <div id="store-products" className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {flashProducts.length > 0 && <FlashSaleBanner products={flashProducts} />}
      {featured.length > 0 && <FeaturedStrip products={featured} storeId={storeId} />}

      {/* رأس + بحث + فلترة */}
      <div className="px-3 sm:px-4 pt-3 pb-0 border-b-0">
        <div className="flex items-center gap-2 pt-0.5 pb-2 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full block" />
            جميع المنتجات
          </h2>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            {sorted.length}
          </span>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sectionFilters={sectionFilters}
        totalCount={sorted.length}
        filteredCount={filtered.length}
      />

      <div className="p-3 sm:p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-3">
              {search ? (
                <Search className="w-7 h-7 text-slate-300" />
              ) : (
                <Package className="w-7 h-7 text-slate-300" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-500 mb-1">
              {search ? `لا توجد نتائج لـ "${search}"` : "لا توجد منتجات في هذا القسم"}
            </p>
            {(search || activeSection) && (
              <button
                onClick={() => { setSearch(""); setActiveSection(null); }}
                className="mt-3 text-xs font-bold text-primary hover:underline"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
