"use client";

import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import {
  ShoppingCart, Check, Star, Package,
  Truck, Shield, Zap, ImageIcon,
} from "lucide-react";
import type { Product, Store } from "@/lib/types";
import {
  hasActiveFlashSale, hasActiveDiscount,
  getDiscountedPrice, getEffectivePrice,
} from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════
   Hook: عداد تصاعدي ناعم
══════════════════════════════════════════ */
function useCountUp(target: number, duration = 1100, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started || target === 0) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, started]);
  return value;
}

/* ══════════════════════════════════════════
   خلية إحصاء واحدة
══════════════════════════════════════════ */
function StatBubble({
  value, suffix = "", label, icon, delay, started,
  highlight = false,
}: {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
  delay: number;
  started: boolean;
  highlight?: boolean;
}) {
  const count = useCountUp(value, 1100, started);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className={cn(
        "w-11 h-11 rounded-2xl flex items-center justify-center",
        highlight
          ? "bg-white/20 text-white"
          : "bg-white/10 text-white/80"
      )}>
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-[11px] font-semibold text-white/60 text-center leading-tight">{label}</p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   بطاقة المنتج المميز (Spotlight)
══════════════════════════════════════════ */
function SpotlightCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  const flash = hasActiveFlashSale(product);
  const onSale = flash || hasActiveDiscount(product);
  const price = getEffectivePrice(product);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product);
    toast({ title: "أُضيف للسلة ✓", description: product.name, productImage: product.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }}
      onClick={() => router.push(`/store/product?id=${product.storeId}&product=${product.id}`)}
      className="cursor-pointer group"
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        }}
      >
        {/* عنوان البطاقة */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-[11px] font-black text-white/70 uppercase tracking-widest">
            المنتج المميز
          </p>
        </div>

        {/* المحتوى */}
        <div className="flex items-center gap-4 px-4 pb-4">
          {/* صورة المنتج */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-white/10">
            {product.imageUrl ? (
              product.imageUrl.startsWith("data:") ? (
                <img src={product.imageUrl} alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <Image src={product.imageUrl} alt={product.name} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="112px" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-white/20" />
              </div>
            )}
            {flash && (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-amber-500 rounded-full px-1.5 py-0.5">
                <Zap className="w-2.5 h-2.5 text-white fill-white" />
                <span className="text-[8px] font-black text-white">فلاش</span>
              </div>
            )}
          </div>

          {/* معلومات المنتج */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <h3 className="text-[15px] sm:text-base font-black text-white leading-tight line-clamp-2">
              {product.name}
            </h3>

            {product.description?.trim() && (
              <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="flex items-end justify-between gap-2 mt-auto">
              <div>
                {onSale && (
                  <p className="text-[10px] text-white/40 line-through">
                    {product.price.toLocaleString()} د.ع
                  </p>
                )}
                <p className={cn(
                  "text-xl font-black leading-none",
                  flash ? "text-amber-400" : onSale ? "text-rose-400" : "text-white"
                )}>
                  {price.toLocaleString()}
                  <span className="text-xs font-normal text-white/40 mr-1">د.ع</span>
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-4 rounded-xl font-black text-[13px] transition-all",
                  added
                    ? "bg-emerald-500 text-white"
                    : isOutOfStock
                      ? "bg-white/10 text-white/30 cursor-not-allowed"
                      : "bg-white text-slate-900 hover:bg-white/90 shadow-lg"
                )}
              >
                {added
                  ? <><Check className="w-3.5 h-3.5" /> أُضيف</>
                  : <><ShoppingCart className="w-3.5 h-3.5" /> أضف</>
                }
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   الشارات الأفقية (Trust badges)
══════════════════════════════════════════ */
function TrustBadges({ store }: { store: Store }) {
  const badges = [
    store.hasDelivery && { icon: <Truck className="w-3.5 h-3.5" />, label: "توصيل سريع" },
    store.reviews > 5 && { icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />, label: `${store.reviews}+ تقييم` },
    { icon: <Shield className="w-3.5 h-3.5" />, label: "منتجات أصلية" },
    store.type === "إلكتروني" && { icon: <Zap className="w-3.5 h-3.5" />, label: "طلب فوري" },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  if (badges.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
      {badges.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
          className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 border border-white/10 text-white/80 rounded-full px-3 py-1.5 text-[11px] font-bold"
        >
          {b.icon}
          {b.label}
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   المكوّن الرئيسي
══════════════════════════════════════════ */
interface StoreShowcaseProps {
  store: Store;
  products: Product[];
}

function StoreShowcaseContent({ store, products }: StoreShowcaseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  /* المنتج المميز الأول */
  const spotlight = products.find(p => p.isFeatured) ?? products[0] ?? null;

  /* إحصائيات */
  const inStockCount = products.filter(p => p.stock > 0).length;
  const ratingVal    = store.reviews > 0 ? Math.round(store.rating * 10) : 0;

  return (
    <div ref={ref} className="px-3 sm:px-4 pt-4 pb-2">
      <div
        className="relative overflow-hidden rounded-3xl p-4 sm:p-5 space-y-4"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #0f2460 100%)",
          boxShadow: "0 8px 40px rgba(15,23,42,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* نقاط الخلفية الزخرفية */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "20px 20px" }}
        />
        {/* ضوء زخرفي */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none opacity-15"
          style={{ background: "radial-gradient(circle,#2563eb,transparent 70%)" }}
        />

        {/* ─── رأس القسم ─── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : -8 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
              هويّة المتجر
            </p>
            <h2 className="text-base font-black text-white leading-tight">
              {store.marketType || store.type || "متجرنا"} الأول
            </h2>
          </div>
          {/* شارة موثوق */}
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-black text-emerald-300">موثوق</span>
          </div>
        </motion.div>

        {/* ─── الإحصائيات ─── */}
        <div className="grid grid-cols-3 gap-3">
          <StatBubble
            value={inStockCount}
            label="منتج متوفر"
            icon={<Package className="w-5 h-5" />}
            delay={0.1} started={isInView}
          />
          <StatBubble
            value={ratingVal}
            suffix={ratingVal > 0 ? "/50" : ""}
            label={ratingVal > 0 ? "مؤشر الرضا" : "تقييمات قادمة"}
            icon={<Star className="w-5 h-5" />}
            delay={0.2} started={isInView} highlight
          />
          <StatBubble
            value={store.reviews}
            label="تقييم عميل"
            icon={<Star className="w-5 h-5 fill-white/60" />}
            delay={0.3} started={isInView}
          />
        </div>

        {/* ─── شارات الثقة ─── */}
        <TrustBadges store={store} />

        {/* ─── المنتج المميز ─── */}
        {spotlight && <SpotlightCard product={spotlight} />}
      </div>
    </div>
  );
}

export const StoreShowcase = memo(StoreShowcaseContent);
