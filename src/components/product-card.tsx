"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, ImageIcon, Zap, Clock, Sparkles, TrendingUp, BadgePercent } from "lucide-react";
import type { Product } from "@/lib/types";
import { hasActiveDiscount, hasActiveFlashSale, getDiscountedPrice } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";
import { motion, AnimatePresence } from "framer-motion";
import type { SmartBadge } from "./product-grid";

interface ProductCardProps {
  product: Product;
  smartBadge?: SmartBadge;
  onQuickView?: (product: Product) => void;
}

function FlashCountdown({ endsAt }: { endsAt: string }) {
  const { formatted, isExpired } = useCountdown(endsAt);
  if (isExpired) return null;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-200 tabular-nums">
      <Clock className="h-2.5 w-2.5 flex-shrink-0" />{formatted}
    </span>
  );
}

const SMART_BADGE_CONFIG: Record<SmartBadge, { label: string; icon: React.ReactNode; className: string }> = {
  new:       { label: "جديد",          icon: <Sparkles  className="w-2.5 h-2.5" />, className: "bg-violet-500 text-white" },
  trending:  { label: "الأكثر طلباً", icon: <TrendingUp className="w-2.5 h-2.5" />, className: "bg-sky-500 text-white" },
  best_deal: { label: "أفضل صفقة",    icon: <BadgePercent className="w-2.5 h-2.5" />, className: "bg-emerald-500 text-white" },
};

function ProductCardContent({ product, smartBadge }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const flash = hasActiveFlashSale(product);
  const isOnSale = flash || hasActiveDiscount(product);
  const displayPrice = flash
    ? product.flashPrice!
    : hasActiveDiscount(product) ? getDiscountedPrice(product) : product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock   = product.stock > 0 && product.stock <= 5;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOutOfStock) return;
    addItem(product);
    toast({ title: "أُضيف للسلة ✓", description: product.name, productImage: product.imageUrl });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => router.push(`/store/product?id=${product.storeId}&product=${product.id}`)}
      className="group cursor-pointer h-full select-none"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250">

        {/* صورة */}
        <div className="relative overflow-hidden bg-slate-50 flex-shrink-0" style={{ aspectRatio: "1/1" }}>
          {product.imageUrl ? (
            product.imageUrl.startsWith("data:") ? (
              <img src={product.imageUrl} alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy" decoding="async" />
            ) : (
              <Image src={product.imageUrl} alt={product.name} fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
                loading="lazy" decoding="async" />
            )
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <ImageIcon className="w-10 h-10 text-slate-200" />
            </div>
          )}

          {/* شارة فلاش */}
          {flash && (
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 bg-amber-500 rounded-full px-2.5 py-1 shadow-sm">
                <Zap className="h-3 w-3 text-white fill-white" />
                <span className="text-[10px] font-black text-white">فلاش</span>
              </div>
              {product.flashEndsAt && (
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <FlashCountdown endsAt={product.flashEndsAt} />
                </div>
              )}
            </div>
          )}
          {!flash && hasActiveDiscount(product) && (
            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
              -{product.discountPercent}%
            </div>
          )}
          {product.isFeatured && !flash && !hasActiveDiscount(product) && !smartBadge && (
            <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
              مميز
            </div>
          )}

          {/* شارة ذكية */}
          {smartBadge && !flash && !hasActiveDiscount(product) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.22 }}
              className={cn(
                "absolute top-2 right-2 flex items-center gap-1 rounded-full px-2.5 py-1 shadow-sm text-[10px] font-black",
                SMART_BADGE_CONFIG[smartBadge].className
              )}
            >
              {SMART_BADGE_CONFIG[smartBadge].icon}
              {SMART_BADGE_CONFIG[smartBadge].label}
            </motion.div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-slate-700 text-[11px] font-black px-4 py-1.5 rounded-full shadow-sm tracking-wide">
                نفد المخزون
              </span>
            </div>
          )}
        </div>

        {/* تفاصيل */}
        <div className="flex flex-col flex-1 px-2.5 pt-2.5 pb-3 gap-2">
          <h3 className="text-[13px] sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug flex-1">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              {isOnSale && (
                <p className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
                  {product.price.toLocaleString()} د.ع
                </p>
              )}
              <p className={cn(
                "text-sm sm:text-base font-black leading-none",
                flash ? "text-amber-600" : isOnSale ? "text-rose-600" : "text-slate-900"
              )}>
                {displayPrice.toLocaleString()}
                <span className="text-[10px] font-normal text-slate-400 mr-0.5">د.ع</span>
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={cn(
                "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                isAdded ? "bg-emerald-500 text-white" : "bg-primary text-white hover:bg-primary/90",
                isOutOfStock && "opacity-30 cursor-not-allowed"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isAdded ? (
                  <motion.span key="check"
                    initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </motion.span>
                ) : (
                  <motion.span key="cart"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
          {isLowStock && (
            <p className="text-[10px] font-bold text-amber-500">⚡ آخر {product.stock} قطع</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardContent);
