"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ImageIcon, Zap, Clock, Eye } from "lucide-react";

import type { Product } from "@/lib/types";
import { hasActiveDiscount, hasActiveFlashSale, getDiscountedPrice } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

/* ── عداد الفلاش سيل ── */
function FlashCountdown({ endsAt }: { endsAt: string }) {
  const { formatted, isExpired } = useCountdown(endsAt);
  if (isExpired) return null;
  return (
    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
      <Clock className="h-2.5 w-2.5 text-amber-300 flex-shrink-0" />
      <span className="text-[10px] font-bold text-amber-200 tabular-nums">{formatted}</span>
    </div>
  );
}

function ProductCardContent({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const flash = hasActiveFlashSale(product);
  const isOnSale = flash || hasActiveDiscount(product);
  const displayPrice = flash
    ? product.flashPrice!
    : hasActiveDiscount(product)
      ? getDiscountedPrice(product)
      : product.price;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOutOfStock) {
      toast({
        title: "انتهى المخزون",
        description: `"${product.name}" غير متوفر حالياً.`,
        variant: "destructive",
      });
      return;
    }
    addItem(product);
    toast({
      title: "أُضيف إلى السلة ✓",
      description: product.name,
      productImage: product.imageUrl,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group cursor-pointer h-full"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

        {/* ── صورة المنتج ── */}
        <div className="relative overflow-hidden bg-slate-50 flex-shrink-0" style={{ aspectRatio: "1/1" }}>

          {product.imageUrl ? (
            product.imageUrl.startsWith("data:") ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-400"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                decoding="async"
              />
            )
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <ImageIcon className="w-10 h-10 text-slate-200" />
            </div>
          )}

          {/* تدرج أسفل الصورة */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* شارة فلاش سيل */}
          {flash && (
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 bg-gradient-to-l from-amber-500 to-orange-500 rounded-full px-2 py-0.5 shadow-md">
                <Zap className="h-3 w-3 text-white" />
                <span className="text-[10px] font-black text-white">فلاش</span>
              </div>
              {product.flashEndsAt && <FlashCountdown endsAt={product.flashEndsAt} />}
            </div>
          )}

          {/* شارة خصم عادي */}
          {!flash && hasActiveDiscount(product) && (
            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
              -{product.discountPercent}%
            </div>
          )}

          {/* نفد المخزون */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-red-600 text-xs font-black px-3 py-1 rounded-full shadow">
                نفد المخزون
              </span>
            </div>
          )}

          {/* زر معاينة سريعة */}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
              <Eye className="w-3 h-3" />
              عرض سريع
            </div>
          </div>
        </div>

        {/* ── تفاصيل المنتج ── */}
        <div className="flex flex-col flex-1 p-2.5 sm:p-3 gap-1.5">

          {/* اسم المنتج */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug flex-1">
            {product.name}
          </h3>

          {/* السعر + زر السلة */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div>
              {isOnSale && (
                <p className="text-[10px] text-slate-400 line-through leading-none">
                  {product.price.toLocaleString()} د.ع
                </p>
              )}
              <p className={cn(
                "text-sm sm:text-base font-black leading-none",
                flash ? "text-amber-600" : isOnSale ? "text-rose-600" : "text-primary"
              )}>
                {displayPrice.toLocaleString()}
                <span className="text-[10px] font-semibold mr-0.5 opacity-70">د.ع</span>
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={cn(
                "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed",
                isAdded
                  ? "bg-emerald-500 text-white shadow-emerald-200"
                  : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
              )}
            >
              {isAdded
                ? <Check className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                : <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              }
            </button>
          </div>

          {/* كمية متاحة */}
          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-[10px] font-semibold text-amber-600">
              متبقي {product.stock} فقط!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardContent);
