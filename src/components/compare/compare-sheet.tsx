"use client";

import Image from "next/image";
import { X, ShoppingCart, Check, ImageIcon, Zap, Tag, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useCompare } from "./compare-context";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import {
  hasActiveFlashSale, hasActiveDiscount,
  getEffectivePrice, getDiscountedPrice,
} from "@/lib/types";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─── خلية مقارنة واحدة ─────────────────── */
function ProductCol({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  const flash = hasActiveFlashSale(product);
  const onSale = flash || hasActiveDiscount(product);
  const effectivePrice = getEffectivePrice(product);
  const originalPrice = product.price;
  const savings = originalPrice - effectivePrice;
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product);
    toast({ title: "أُضيف للسلة ✓", description: product.name, productImage: product.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-0">
      {/* صورة المنتج */}
      <div className="relative w-full bg-slate-50 overflow-hidden" style={{ aspectRatio: "1/1" }}>
        {product.imageUrl ? (
          product.imageUrl.startsWith("data:") ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="50vw" />
          )
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <ImageIcon className="w-12 h-12 text-slate-200" />
          </div>
        )}
        {flash && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 rounded-full px-2 py-0.5">
            <Zap className="w-3 h-3 text-white fill-white" />
            <span className="text-[10px] font-black text-white">فلاش</span>
          </div>
        )}
        {!flash && onSale && (
          <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            -{product.discountPercent}%
          </div>
        )}
      </div>

      {/* اسم المنتج */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <p className="text-[13px] font-black text-slate-900 leading-snug line-clamp-2">
          {product.name}
        </p>
        {product.sectionName && (
          <span className="inline-block mt-1 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
            {product.sectionName}
          </span>
        )}
      </div>

      {/* السعر */}
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50">
        {onSale && (
          <p className="text-[10px] text-slate-400 line-through mb-0.5">
            {originalPrice.toLocaleString()} د.ع
          </p>
        )}
        <p className={cn(
          "text-xl font-black leading-none",
          flash ? "text-amber-600" : onSale ? "text-rose-600" : "text-slate-900"
        )}>
          {effectivePrice.toLocaleString()}
          <span className="text-xs font-normal text-slate-400 mr-1">د.ع</span>
        </p>
        {savings > 0 && (
          <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            توفير {savings.toLocaleString()} د.ع
          </p>
        )}
      </div>

      {/* المخزون */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <div className={cn(
          "flex items-center gap-1.5 text-[12px] font-bold",
          isOutOfStock ? "text-red-500" : product.stock <= 5 ? "text-amber-600" : "text-emerald-600"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            isOutOfStock ? "bg-red-400" : product.stock <= 5 ? "bg-amber-400" : "bg-emerald-400"
          )} />
          {isOutOfStock
            ? "نفد المخزون"
            : product.stock <= 5
              ? `آخر ${product.stock} قطع`
              : `متوفر (${product.stock})`
          }
        </div>
      </div>

      {/* الوصف */}
      <div className="px-3 py-2.5 border-b border-slate-100 flex-1">
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-4">
          {product.description || "—"}
        </p>
      </div>

      {/* زر الإضافة */}
      <div className="px-3 py-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={cn(
            "w-full h-10 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all",
            added ? "bg-emerald-500" : isOutOfStock ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
          )}
        >
          {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          {added ? "أُضيف!" : isOutOfStock ? "نفد" : "أضف للسلة"}
        </motion.button>
      </div>
    </div>
  );
}

/* ─── صفوف المقارنة ─────────────────────── */
const ROW_LABELS = ["الصورة", "الاسم", "السعر", "المخزون", "الوصف", ""];

/* ─── صفحة المقارنة الكاملة ──────────────── */
export function CompareSheet() {
  const ctx = useCompare();
  if (!ctx) return null;
  const { selected, isSheetOpen, closeSheet, clearAll } = ctx;

  const [a, b] = selected;

  /* مقارنة السعر */
  const priceA = a ? getEffectivePrice(a) : 0;
  const priceB = b ? getEffectivePrice(b) : 0;
  const cheaper = priceA < priceB ? "a" : priceB < priceA ? "b" : null;

  return (
    <AnimatePresence>
      {isSheetOpen && a && b && (
        <>
          {/* خلفية شفافة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeSheet}
          />

          {/* الشيت */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed bottom-0 right-0 left-0 z-50 flex flex-col bg-white rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "92dvh" }}
            dir="rtl"
          >
            {/* رأس الشيت */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">مقارنة المنتجات</h2>
                  <p className="text-[10px] text-slate-400 font-medium">اختر الأنسب لك</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { clearAll(); closeSheet(); }}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
                >
                  مسح الكل
                </button>
                <button
                  onClick={closeSheet}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* شارة الأوفر سعراً */}
            {cheaper && (
              <div className="flex gap-0 flex-shrink-0">
                <div className={cn(
                  "flex-1 py-1.5 text-center text-[11px] font-black transition-colors",
                  cheaper === "a" ? "bg-emerald-500 text-white" : "bg-transparent"
                )}>
                  {cheaper === "a" ? "✓ الأوفر سعراً" : ""}
                </div>
                <div className="w-px bg-slate-100" />
                <div className={cn(
                  "flex-1 py-1.5 text-center text-[11px] font-black transition-colors",
                  cheaper === "b" ? "bg-emerald-500 text-white" : "bg-transparent"
                )}>
                  {cheaper === "b" ? "✓ الأوفر سعراً" : ""}
                </div>
              </div>
            )}

            {/* جسم المقارنة */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex divide-x divide-x-reverse divide-slate-100">
                <ProductCol product={a} />
                <div className="w-px bg-slate-100 flex-shrink-0" />
                <ProductCol product={b} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
