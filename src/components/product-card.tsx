
"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Check, ImageIcon } from "lucide-react";

import type { Product } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addItem(product);
    toast({
      title: "تمت الإضافة إلى السلة",
      description: `تمت إضافة "${product.name}" بنجاح.`,
      productImage: product.imageUrl
    });
    setIsAdded(true);
    setTimeout(() => { setIsAdded(false); }, 1500);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onQuickView(product);
  }

  return (
    <div onClick={handleCardClick} className="group cursor-pointer">
      <div className="h-full overflow-hidden rounded-lg border border-border/30 bg-card/50 transition-all duration-200 hover:shadow-sm hover:border-primary/40 hover:bg-card">
        <div className="relative h-32 md:h-40 w-full overflow-hidden bg-muted/20 flex items-center justify-center">
          {product.imageUrl ? (
            product.imageUrl.startsWith('data:') ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover transition-transform duration-200 group-hover:scale-105 w-full h-full"
              />
            ) : (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            )
          ) : (
            <ImageIcon className="size-6 text-muted-foreground/20" />
          )}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
        
        <div className="p-2 md:p-3 space-y-1.5">
          <h3 className="line-clamp-2 text-xs md:text-sm font-semibold text-foreground">{product.name}</h3>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs md:text-sm font-bold text-primary">{product.price.toLocaleString()} د.ع</p>
            <Button
              size="sm"
              className={cn(
                "size-7 md:size-8 rounded-md p-0 transition-all duration-150 shrink-0 text-xs",
                isAdded ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
              )}
              onClick={handleAddToCart}
            >
              {isAdded ? <Check className="h-3 w-3 md:h-4 md:w-4" /> : <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
