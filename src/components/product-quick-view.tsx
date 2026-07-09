
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, X, Store as StoreIcon, Image as ImageIcon } from "lucide-react";

import type { Product, Store } from "@/lib/types";
import { getDiscountedPrice, hasActiveDiscount } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from '@/services/supabase';
import { Skeleton } from './ui/skeleton';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({
  product,
  isOpen,
  onClose,
}: ProductQuickViewProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [store, setStore] = useState<Pick<Store, 'id' | 'name'> | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (product?.storeId) {
        setIsLoadingStore(true);
        try {
          const { data, error } = await supabase.from('stores').select('id, name').eq('id', product.storeId).limit(1);
          if (error) throw error;
          if (data && data.length > 0) {
            setStore({ id: String(data[0].id), name: data[0].name });
          } else {
            setStore(null);
          }
        } catch (err) {
          console.error('Error fetching store info:', err);
          setStore(null);
        } finally {
          setIsLoadingStore(false);
        }
      } else {
        setStore(null);
        setIsLoadingStore(false);
      }
    };

    if (isOpen) {
      fetchStoreInfo();
    }
  }, [product, isOpen]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
      toast({
        title: "تمت الإضافة إلى السلة",
        description: `تمت إضافة "${product.name}" بنجاح.`,
        productImage: product.imageUrl,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {isOpen && product && (
        <DialogContent
          className="w-full max-w-[300px] p-0 border-none rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl shadow-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          forceMount
        >
          <div
            className="flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-20 rounded-full p-1.5 bg-background/50 text-foreground/70 backdrop-blur-sm transition-all hover:bg-background/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            <div className="relative w-full aspect-square bg-muted flex items-center justify-center">
              {product.imageUrl ? (
                product.imageUrl.startsWith('data:') ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 90vw, 300px"
                  />
                )
              ) : (
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
              )}
            </div>

            <div className="flex flex-1 flex-col p-4 gap-1">
              <h1 className="text-base font-bold text-foreground font-headline truncate">
                {product.name}
              </h1>
              
              {hasActiveDiscount(product) ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-rose-600">
                    {getDiscountedPrice(product).toLocaleString()} د.ع
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    {product.price.toLocaleString()} د.ع
                  </span>
                  <span className="rounded-full bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5">
                    -{product.discountPercent}%
                  </span>
                </div>
              ) : (
                <p className="text-lg font-bold text-primary">
                  {product.price.toLocaleString()} د.ع
                </p>
              )}
              <p className={product.stock > 0 ? "text-success text-sm" : "text-destructive text-sm"}>
                {product.stock > 0 ? `متوفر: ${product.stock} قطعة` : "نفد المخزون"}
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed max-h-16 overflow-y-auto my-1">
                {product.description}
              </p>
              
              <div>
                <hr className="border-t border-border/50 my-1" />
              </div>

              <div className="h-5">
                  {isLoadingStore ? (
                      <div className="flex items-center gap-2">
                         <StoreIcon className="w-3 h-3 text-muted-foreground" />
                         <Skeleton className="h-3 w-20" />
                      </div>
                  ) : store ? (
                      <Link href={`/store?id=${store.id}`} onClick={onClose} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <StoreIcon className="w-3 h-3" />
                          <span>{store.name}</span>
                      </Link>
                  ) : null}
              </div>

              <div className="mt-auto pt-2">
                <Button
                  size="default"
                  className="w-full h-9 text-sm"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart className="ml-2 h-4 w-4" />
                  {product.stock > 0 ? "أضف إلى السلة" : "غير متوفر"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
