"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ImageIcon, Zap, Clock } from "lucide-react";
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

function FlashCountdown({ endsAt }: { endsAt: string }) {
  const { formatted, isExpired } = useCountdown(endsAt);
  if (isExpired) return null;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-200 tabular-nums">
      <Clock className="h-2.5 w-2.5 flex-shrink-0" />{formatted}
    </span>
  );
}

function ProductCardContent({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const flash = hasActiveFlashSale(product);
  const isOnSale = flash || hasActiveDiscount(product);
  const displayPrice = flash ? product.flashPrice! : hasActiveDiscount(product) ? getDiscountedPrice(product) : product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

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
    <div onClick={() => onQuickView(product)} className="group cursor-pointer h-full select-none">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-slate-100/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-250">

        {/* صورة المنتج */}
        <div className="relative overflow-hidden bg-slate-50 flex-shrink-0" style={{ aspectRatio: "1 / 1" }}>

          {product.imageUrl ? (
            product.imageUrl.startsWith("data:") ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out" loading="lazy" decoding="async" />
            ) : (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" loading="lazy" decoding="async" />
            )
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <ImageIcon className="w-10 h-10 text-slate-200" />
            </div>
          )}

          {/* تدرج خفي أسفل الصورة */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />

          {/* شارة فلاش */}
          {flash && (
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 bg-gradient-to-l from-orange-500 to-amber-500 rounded-full px-2.5 py-1 shadow-lg">
                <Zap className="h-3 w-3 text-white fill-white" />
                <span className="text-[10px] font-black text-white tracking-wide">فلاش</span>
              </div>
              {product.flashEndsAt && (
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <FlashCountdown endsAt={product.flashEndsAt} />
                </div>
              )}
            </div>
          )}

          {/* شارة خصم عادي */}
          {!flash && hasActiveDiscount(product) && (
            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
              -{product.discountPercent}%
            </div>
          )}

          {/* مميز */}
          {product.isFeatured && !flash && !hasActiveDiscount(product) && (
            <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
              مميز
            </div>
          )}

          {/* نفد المخزون */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="bg-white text-slate-700 text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg tracking-wide">
                نفد المخزون
              </span>
            </div>
          )}

          {/* زر الإضافة للسلة — يظهر عند hover */}
          {!isOutOfStock && (
            <button
              onClick={handleAdd}
              className={cn(
                "absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-black text-white shadow-lg transition-all duration-200",
                "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
                isAdded ? "bg-emerald-500" : "bg-slate-900 hover:bg-primary"
              )}
            >
              {isAdded
                ? <><Check className="w-3 h-3" /> أُضيف!</>
                : <><ShoppingCart className="w-3 h-3" /> أضف للسلة</>
              }
            </button>
          )}
        </div>

        {/* تفاصيل المنتج */}
        <div className="flex flex-col flex-1 px-2.5 pt-2.5 pb-3 gap-1.5">

          <h3 className="text-[13px] sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug flex-1">
            {product.name}
          </h3>

          {/* السعر + زر الهاتف */}
          <div className="flex items-center justify-between gap-2 mt-auto">
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
                <span className="text-[10px] font-semibold text-slate-400 mr-0.5">د.ع</span>
              </p>
            </div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={cn(
                "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm",
                isAdded ? "bg-emerald-500 text-white" : "bg-primary text-white hover:bg-primary/90",
                isOutOfStock && "opacity-30 cursor-not-allowed"
              )}
            >
              {isAdded
                ? <Check className="h-3.5 w-3.5" />
                : <ShoppingCart className="h-3.5 w-3.5" />
              }
            </button>
          </div>

          {/* مخزون منخفض */}
          {isLowStock && (
            <p className="text-[10px] font-bold text-amber-500">⚡ آخر {product.stock} قطع</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardContent);
