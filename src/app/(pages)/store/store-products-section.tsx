"use client";

import {
  useMemo, memo, useState, useRef, useCallback, useEffect,
} from "react";
import Image from "next/image";
import { ProductGrid } from "@/components/product-grid";
import {
  Package, Zap, ImageIcon, ShoppingCart, Check,
  Search, X, ArrowUpDown, TrendingUp, TrendingDown,
  Clock, Tag, Star,
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

type SortOption =
  | "default"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "oldest"
  | "offers_first";

const SORT_OPTIONS: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  { key: "default",     label: "الافتراضي",        icon: <Star className="w-3.5 h-3.5" /> },
  { key: "newest",      label: "الأحدث أولاً",     icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "oldest",      label: "الأقدم أولاً",     icon: <Clock className="w-3.5 h-3.5 rotate-180" /> },
  { key: "price_asc",   label: "السعر: من الأقل",  icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "price_desc",  label: "السعر: من الأعلى", icon: <TrendingDown className="w-3.5 h-3.5" /> },
  { key: "offers_first",label: "العروض أولاً",     icon: <Tag className="w-3.5 h-3.5" /> },
];

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
          <span className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg w-9 h-9 font-black text-white text-sm tabular-nums">
            {v}
          </span>
          {i < 2 && <span className="text-white font-black text-base">:</span>}
        </span>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   بطاقة منتج أفقية (كاروسيل المميز)
──────────────────────────────────────────── */
function FeaturedProductCard({ product }: { product: Product }) {
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
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="160px" />
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
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90",
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
function FeaturedStrip({ products }: { products: Product[] }) {
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
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {products.map(p => <FeaturedProductCard key={p.id} product={p} />)}
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
      style={{ background: "linear-gradient(135deg,#c2410c 0%,#ea580c 50%,#f97316 100%)" }}
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
   شريط البحث والترتيب
──────────────────────────────────────────── */
interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  totalCount: number;
  filteredCount: number;
}

function FilterBar({
  search, onSearchChange,
  sortBy, onSortChange,
  totalCount, filteredCount,
}: FilterBarProps) {
  const [showSort, setShowSort] = useState(false);

  const activeSort = SORT_OPTIONS.find(o => o.key === sortBy)!;

  const handleSortPick = useCallback((key: SortOption) => {
    onSortChange(key);
    setShowSort(false);
  }, [onSortChange]);

  return (
    <div className="px-3 sm:px-4 pt-3 pb-3 space-y-2.5">

      {/* صف البحث والترتيب */}
      <div className="flex gap-2 items-center">

        {/* حقل البحث */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="ابحث في المنتجات…"
            className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 pr-9 pl-8 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all duration-200"
            dir="rtl"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSearchChange("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                <X className="w-3 h-3 text-slate-500" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* زر الترتيب */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSort(v => !v)}
            className={cn(
              "flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-[12px] font-bold transition-all duration-200 border whitespace-nowrap",
              sortBy !== "default"
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{activeSort.label}</span>
            <span className="sm:hidden">ترتيب</span>
          </button>

          {/* قائمة الترتيب */}
          <AnimatePresence>
            {showSort && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowSort(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute left-0 top-12 z-30 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden min-w-[185px]"
                  dir="rtl"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">ترتيب حسب</p>
                  </div>
                  <div className="py-1">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => handleSortPick(opt.key)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold transition-colors text-right",
                          sortBy === opt.key
                            ? "bg-primary/8 text-primary"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span className={cn(
                          "flex-shrink-0",
                          sortBy === opt.key ? "text-primary" : "text-slate-400"
                        )}>
                          {opt.icon}
                        </span>
                        {opt.label}
                        {sortBy === opt.key && (
                          <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* شريط الحالة */}
      <AnimatePresence>
        {(search || sortBy !== "default") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between overflow-hidden"
          >
            <p className="text-[11px] text-slate-400 font-medium">
              {search
                ? filteredCount === 0
                  ? `لا نتائج لـ "${search}"`
                  : `${filteredCount} نتيجة${filteredCount !== totalCount ? ` من ${totalCount}` : ""}`
                : `${filteredCount} منتج`
              }
            </p>
            <button
              onClick={() => { onSearchChange(""); onSortChange("default"); }}
              className="text-[11px] font-bold text-primary/80 hover:text-primary transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              مسح الفلاتر
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────
   المكوّن الرئيسي
──────────────────────────────────────────── */
function StoreProductsSectionContent({
  products, storeId,
}: StoreProductsSectionProps) {
  /* إدخال البحث (يتغير بكل حرف) */
  const [searchInput, setSearchInput] = useState("");
  /* البحث الفعلي المطبّق على الفلتر — مع debounce 180ms */
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  /* debounce البحث: لا إعادة حساب useMemo عند كل ضغطة */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 180);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* الترتيب الأساسي: مميز أولاً */
  const base = useMemo(() =>
    [...products].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return 0;
    }),
    [products]
  );

  const featured     = useMemo(() => base.filter(p => p.isFeatured), [base]);
  const flashProducts = useMemo(() => base.filter(p => hasActiveFlashSale(p)), [base]);

  /* تطبيق البحث والترتيب المتقدم */
  const filtered = useMemo(() => {
    let result = [...base];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        break;
      case "price_desc":
        result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        break;
      case "newest":
        result.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });
        break;
      case "offers_first":
        result.sort((a, b) => {
          const aScore = (hasActiveFlashSale(a) ? 2 : 0) + (hasActiveDiscount(a) ? 1 : 0);
          const bScore = (hasActiveFlashSale(b) ? 2 : 0) + (hasActiveDiscount(b) ? 1 : 0);
          return bScore - aScore;
        });
        break;
      default:
        break;
    }

    return result;
  }, [base, search, sortBy]);

  return (
    <div id="store-products" className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      {flashProducts.length > 0 && <FlashSaleBanner products={flashProducts} />}
      {featured.length > 0 && <FeaturedStrip products={featured} />}

      {/* رأس القسم */}
      <div className="flex items-center gap-2 px-3 sm:px-4 pt-3.5 pb-0">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full block" />
          جميع المنتجات
        </h2>
        <motion.span
          key={filtered.length}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5"
        >
          {filtered.length}
        </motion.span>
      </div>

      {/* شريط البحث والترتيب */}
      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalCount={base.length}
        filteredCount={filtered.length}
      />

      {/* شبكة المنتجات */}
      <div className="px-3 sm:px-4 pb-4">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-3">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500 mb-1">
                لا توجد نتائج لـ &ldquo;{searchInput}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mb-3">جرّب كلمة مختلفة</p>
              <button
                onClick={() => setSearchInput("")}
                className="text-xs font-bold text-primary hover:underline"
              >
                مسح البحث
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`grid-${sortBy}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              <ProductGrid products={filtered} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
