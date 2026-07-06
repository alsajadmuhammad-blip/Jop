"use client";

import {
  useMemo, memo, useCallback, useState, useTransition, useRef, useEffect,
} from "react";
import Image from "next/image";
import { ProductGrid } from "@/components/product-grid";
import {
  Package, Zap, Clock, ChevronLeft, ChevronRight, ImageIcon,
  ShoppingCart, Check,
} from "lucide-react";
import type { Product, Section } from "@/lib/types";
import { hasActiveFlashSale, hasActiveDiscount, getDiscountedPrice } from "@/lib/types";
import { useCountdown } from "@/hooks/use-countdown";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StoreProductsSectionProps {
  products: Product[];
  sections: Section[];
  store?: { type?: string };
}

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
              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90", added ? "bg-emerald-500" : "bg-primary hover:bg-primary/90", "disabled:opacity-30")}
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
   قسم المنتجات المميزة (horizontal scroll)
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
      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
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
    <div className="mx-0 mb-0 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)" }}>
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
   شريط تبويبات الأقسام
──────────────────────────────────────────── */
function SectionTabs({
  sections, activeSection, products, onSectionChange,
}: { sections: Section[]; activeSection: string; products: Product[]; onSectionChange: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const countMap = useMemo(() => {
    const m: Record<string, number> = { all: products.length };
    for (const p of products) if (p.sectionId) m[p.sectionId] = (m[p.sectionId] ?? 0) + 1;
    return m;
  }, [products]);

  useEffect(() => {
    const el = activeRef.current, c = scrollRef.current;
    if (!el || !c) return;
    c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.offsetWidth / 2, behavior: "smooth" });
  }, [activeSection]);

  const items = [{ id: "all", name: "الكل" }, ...sections];

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-100" style={{ boxShadow: "0 1px 0 0 #f1f5f9, 0 4px 12px rgba(0,0,0,0.04)" }}>
      <div ref={scrollRef} className="flex overflow-x-auto no-scrollbar gap-1.5 px-4 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
        {items.map(item => {
          const isActive = activeSection === item.id;
          const count = countMap[item.id] ?? 0;
          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-all duration-200 active:scale-95",
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {item.name}
              <span className={cn("text-[10px] font-bold rounded-full px-1.5 leading-5 min-w-[20px] text-center",
                isActive ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   المكوّن الرئيسي
──────────────────────────────────────────── */
function StoreProductsSectionContent({ products, sections }: StoreProductsSectionProps) {
  const [activeSection, setActiveSection] = useState("all");
  const [, startTransition] = useTransition();

  const sorted = useMemo(() =>
    [...products].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return 0;
    }), [products]);

  const featured = useMemo(() => sorted.filter(p => p.isFeatured), [sorted]);
  const flashProducts = useMemo(() => sorted.filter(p => hasActiveFlashSale(p)), [sorted]);

  const filtered = useMemo(() =>
    activeSection === "all" ? sorted : sorted.filter(p => p.sectionId === activeSection),
    [sorted, activeSection]);

  const handleSection = useCallback((id: string) => startTransition(() => setActiveSection(id)), []);

  return (
    <div id="store-products" className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      {/* فلاش سيل */}
      {flashProducts.length > 0 && <FlashSaleBanner products={flashProducts} />}

      {/* مميزة */}
      {featured.length > 0 && <FeaturedStrip products={featured} />}

      {/* تبويبات */}
      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        products={sorted}
        onSectionChange={handleSection}
      />

      {/* الشبكة */}
      <div className="p-3 sm:p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-500 mb-1">لا توجد منتجات</p>
            <p className="text-sm text-slate-400">جرّب قسماً آخر</p>
          </div>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
