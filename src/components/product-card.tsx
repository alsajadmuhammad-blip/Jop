"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, ImageIcon, Zap, Clock } from "lucide-react";
import type { Product } from "@/lib/types";
import { hasActiveDiscount, hasActiveFlashSale, getDiscountedPrice } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";

interface ProductCardProps {
  product: Product;
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

function ProductCardContent({ product }: ProductCardProps) {
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

  const handleCardClick = () => {
    router.push(`/store/product?id=${product.storeId}&product=${product.id}`);
  };

  return (
    <div onClick={handleCardClick} className="group cursor-pointer h-full select-none">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">

        {/* صورة المنتج */}
        <div className="relative overflow-hidden bg-slate-50 flex-shrink-0" style={{ aspectRatio: "1/1" }}>
          {product.imageUrl ? (
            product.imageUrl.startsWith("data:") ? (
              <img
                src={product.imageUrl} alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy" decoding="async"
              />
            ) : (
              <Image
                src={product.imageUrl} alt={product.name}
                fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
                loading="lazy" decoding="async"
              />
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

          {/* شارة خصم */}
          {!flash && hasActiveDiscount(product) && (
            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
              -{product.discountPercent}%
            </div>
          )}

          {/* مميز */}
          {product.isFeatured && !flash && !hasActiveDiscount(product) && (
            <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
              مميز
            </div>
          )}

          {/* نفد المخزون */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-slate-700 text-[11px] font-black px-4 py-1.5 rounded-full shadow-sm tracking-wide">
                نفد المخزون
              </span>
            </div>
          )}
        </div>

        {/* تفاصيل المنتج */}
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

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={cn(
                "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm",
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

          {isLowStock && (
            <p className="text-[10px] font-bold text-amber-500">⚡ آخر {product.stock} قطع</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardContent);
