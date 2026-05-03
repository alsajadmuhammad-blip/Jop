
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, X, Store as StoreIcon, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type { Product, Store } from "@/lib/types";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

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
      <AnimatePresence>
        {isOpen && product && (
          <DialogContent
            className="w-full max-w-[300px] p-0 border-none rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl shadow-2xl"
            onOpenAutoFocus={(e) => e.preventDefault()}
            forceMount
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="flex flex-col"
            >
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-20 rounded-full p-1.5 bg-background/50 text-foreground/70 backdrop-blur-sm transition-all hover:bg-background/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-transparent"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>

              <motion.div variants={itemVariants} className="relative w-full aspect-square bg-muted flex items-center justify-center">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 90vw, 300px"
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                )}
              </motion.div>

              <div className="flex flex-1 flex-col p-4 gap-1">
                <motion.h1 variants={itemVariants} className="text-base font-bold text-foreground font-headline truncate">
                  {product.name}
                </motion.h1>
                
                <motion.p variants={itemVariants} className="text-lg font-bold text-primary">
                  {product.price.toLocaleString()} د.ع
                </motion.p>
                
                <motion.p variants={itemVariants} className="text-muted-foreground text-xs leading-relaxed max-h-16 overflow-y-auto my-1">
                  {product.description}
                </motion.p>
                
                <motion.div variants={itemVariants}>
                  <hr className="border-t border-border/50 my-1" />
                </motion.div>

                <motion.div variants={itemVariants} className="h-5">
                    {isLoadingStore ? (
                        <div className="flex items-center gap-2">
                           <StoreIcon className="w-3 h-3 text-muted-foreground" />
                           <Skeleton className="h-3 w-20" />
                        </div>
                    ) : store ? (
                        <Link href={`/stores/${store.id}`} onClick={onClose} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                            <StoreIcon className="w-3 h-3" />
                            <span>{store.name}</span>
                        </Link>
                    ) : null}
                </motion.div>

                <motion.div variants={itemVariants} className="mt-auto pt-2">
                  <Button size="default" className="w-full h-9 text-sm" onClick={handleAddToCart}>
                    <ShoppingCart className="ml-2 h-4 w-4" />
                    أضف إلى السلة
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
