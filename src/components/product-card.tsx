"use client";

import { useState, memo } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ImageIcon, Star } from "lucide-react";
import type { Product } from "@/lib/types";
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
    setTimeout(() => setIsAdded(false), 1500);
  };

  const outOfStock = product.stock <= 0;

  return (
    <div onClick={() => onQuickView(product)} className="group cursor-pointer h-full">
      <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">

        {/* ── صورة المنتج ── */}
        <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-800 overflow-hidden flex-shrink-0">
          {product.imageUrl ? (
            product.imageUrl.startsWith("data:") ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            </div>
          )}

          {/* شارة نفد المخزون */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1 rounded-full">
                نفد المخزون
              </span>
            </div>
          )}

          {/* شارة مميز */}
          {product.isFeatured && (
            <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Star className="w-2.5 h-2.5 fill-white" />
              مميز
            </span>
          )}
        </div>

        {/* ── معلومات المنتج ── */}
        <div className="flex flex-col gap-1.5 p-3 flex-grow">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between mt-auto pt-1.5">
            <span className="text-sm font-extrabold text-primary">
              {product.price.toLocaleString("ar-IQ")} <span className="text-xs font-semibold text-slate-400">د.ع</span>
            </span>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm",
                outOfStock
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed"
                  : isAdded
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {isAdded
                ? <Check className="w-4 h-4" />
                : <ShoppingCart className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardContent);
