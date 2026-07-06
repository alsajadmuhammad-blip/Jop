"use client";

import {
  useMemo, memo, useState, useRef,
} from "react";
import Image from "next/image";
import { ProductGrid } from "@/components/product-grid";
import {
  Package, Zap, ImageIcon, ShoppingCart, Check,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { hasActiveFlashSale, hasActiveDiscount, getDiscountedPrice } from "@/lib/types";
import { useCountdown } from "@/hooks/use-countdown";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StoreProductsSectionProps {
  products: Product[];
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
    <div className="overflow-hidden"
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
   المكوّن الرئيسي
──────────────────────────────────────────── */
function StoreProductsSectionContent({ products }: StoreProductsSectionProps) {
  const sorted = useMemo(() =>
    [...products].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return 0;
    }), [products]);

  const featured = useMemo(() => sorted.filter(p => p.isFeatured), [sorted]);
  const flashProducts = useMemo(() => sorted.filter(p => hasActiveFlashSale(p)), [sorted]);

  return (
    <div id="store-products" className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

      {flashProducts.length > 0 && <FlashSaleBanner products={flashProducts} />}
      {featured.length > 0 && <FeaturedStrip products={featured} />}

      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full block" />
          جميع المنتجات
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 mr-1">
            {sorted.length}
          </span>
        </h2>
      </div>

      <div className="p-3 sm:p-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-500 mb-1">لا توجد منتجات بعد</p>
            <p className="text-sm text-slate-400">تابع المتجر لمعرفة آخر الإضافات</p>
          </div>
        ) : (
          <ProductGrid products={sorted} />
        )}
      </div>
    </div>
  );
}

export const StoreProductsSection = memo(StoreProductsSectionContent);
