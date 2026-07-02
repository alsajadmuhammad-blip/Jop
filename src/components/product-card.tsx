"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ImageIcon } from "lucide-react";

import type { Product } from "@/lib/types";
import { getDiscountedPrice, hasActiveDiscount } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

function ProductCardContent({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const isOnSale = hasActiveDiscount(product);
  const displayPrice = isOnSale ? getDiscountedPrice(product) : product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.stock <= 0) {
      toast({
        title: "انتهى المخزون",
        description: `لا يمكن إضافة "${product.name}" لأن الكمية غير متوفرة.`,
        variant: "destructive",
      });
      return;
    }
    addItem(product);
    toast({
      title: "تمت الإضافة إلى السلة",
      description: `تمت إضافة "${product.name}" بنجاح.`,
      productImage: product.imageUrl,
    });
    setIsAdded(true);
    setTimeout(() => { setIsAdded(false); }, 1500);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onQuickView(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer h-full min-w-0"
      style={{ contain: "layout style paint" }}
    >
      <div
        className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-card shadow hover:shadow-md transition-shadow duration-150"
        style={{ transform: "translateZ(0)" }}
      >
        {/* Image */}
        <div className="relative h-40 sm:h-48 md:h-56 w-full min-w-0 overflow-hidden bg-muted/20 flex items-center justify-center">
          {product.imageUrl ? (
            product.imageUrl.startsWith("data:") ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                decoding="async"
              />
            )
          ) : (
            <ImageIcon className="size-10 text-muted-foreground/30" />
          )}

          {/* Discount badge */}
          {isOnSale && (
            <span className="absolute top-2 right-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              -{product.discountPercent}%
            </span>
          )}

          {/* Out of stock */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-red-600 shadow">
                نفد المخزون
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-2.5 sm:p-3 md:p-4 space-y-1.5 sm:space-y-2 flex flex-col">
          <h3 className="line-clamp-2 text-xs sm:text-sm md:text-base font-bold text-foreground leading-tight">
            {product.name}
          </h3>

          <div className="flex-1 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div>
                  {isOnSale && (
                    <p className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
                      {product.price.toLocaleString()} د.ع
                    </p>
                  )}
                  <p className={cn(
                    "text-xs sm:text-sm md:text-base font-extrabold leading-none",
                    isOnSale ? "text-rose-600" : "text-primary"
                  )}>
                    {displayPrice.toLocaleString()} د.ع
                  </p>
                </div>
                <Button
                  size="sm"
                  className={cn(
                    "size-7 sm:size-8 md:size-9 rounded-lg p-0 transition-colors duration-150 text-xs font-semibold shadow-sm hover:shadow active:scale-95",
                    isAdded ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
                  )}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  {isAdded
                    ? <Check className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    : <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  }
                </Button>
              </div>

              {product.stock > 0 && (
                <p className="text-xs font-semibold text-emerald-600">
                  متوفر: {product.stock}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardContent);
