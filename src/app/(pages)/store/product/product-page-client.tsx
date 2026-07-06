"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRight, ShoppingCart, Check,
  Zap, Clock, Star, Truck, MapPin, Package,
  Globe, MessageSquare, CreditCard,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { fetchStoreById } from "@/services/supabase-db";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Store } from "@/lib/types";
import {
  hasActiveFlashSale, hasActiveDiscount, getEffectivePrice,
} from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { ProductGallery } from "@/components/product-gallery";

/* ────────────────────────────────────────────
   عداد الفلاش سيل
──────────────────────────────────────────── */
function FlashCountdown({ endsAt }: { endsAt: string }) {
  const { formatted, isExpired } = useCountdown(endsAt);
  if (isExpired) return null;
  const [hh, mm, ss] = formatted.split(":");
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-amber-600" />
      <span className="text-[12px] font-bold text-amber-700 tabular-nums">{hh}:{mm}:{ss}</span>
    </div>
  );
}

/* ────────────────────────────────────────────
   حالة التحميل
──────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="relative bg-white" style={{ aspectRatio: "1/1", maxHeight: 420 }}>
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <div className="px-4 pt-5 space-y-3">
        <Skeleton className="h-7 w-3/4 rounded-xl" />
        <Skeleton className="h-5 w-1/3 rounded-xl" />
        <Skeleton className="h-4 w-full rounded-xl" />
        <Skeleton className="h-4 w-2/3 rounded-xl" />
        <Skeleton className="h-14 w-full rounded-2xl mt-6" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   بطاقة المتجر المصغّرة
──────────────────────────────────────────── */
function MiniStoreCard({ store }: { store: Store }) {
  const router = useRouter();
  const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
  const whatsappHref = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/80">
        <h2 className="text-sm font-bold text-slate-700">من المتجر</h2>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className="relative w-12 h-12 rounded-xl border border-slate-100 bg-white overflow-hidden flex-shrink-0"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
        >
          {store.logoUrl ? (
            store.logoUrl.startsWith("data:") ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1" />
            ) : (
              <Image src={store.logoUrl} alt={store.name} fill className="object-contain p-1" sizes="48px" />
            )
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
              <Globe className="w-6 h-6 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{store.name}</p>
          {store.marketType && (
            <p className="text-[11px] text-slate-400 font-medium">{store.marketType}</p>
          )}
          {store.reviews > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-700">{store.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => router.push(`/store?id=${store.id}`)}
            className="h-8 px-3 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors"
          >
            زيارة المتجر
          </button>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 h-8 px-3 rounded-xl text-white text-[11px] font-bold"
              style={{ background: "#25D366" }}
            >
              <MessageSquare className="w-3 h-3" />
              واتساب
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-50 bg-slate-50/60">
        {store.hasDelivery && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <Truck className="w-3 h-3" />
            توصيل متوفر
          </div>
        )}
        {store.location && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{store.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   صفحة تفاصيل المنتج الرئيسية
──────────────────────────────────────────── */
export default function ProductPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const storeIdParam = searchParams.get("id");

  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (!productId) { setLoading(false); return; }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .limit(1)
          .single();

        if (error || !data) throw new Error("المنتج غير موجود");

        // بناء قائمة الصور: الصورة الرئيسية + الصور الإضافية
        let extraImages: string[] = [];
        const rawImages = data.images;
        if (Array.isArray(rawImages)) {
          extraImages = rawImages.filter((u: unknown) => typeof u === "string" && u.length > 0);
        } else if (typeof rawImages === "string" && rawImages.startsWith("[")) {
          try { extraImages = JSON.parse(rawImages).filter((u: unknown) => typeof u === "string"); } catch { /* ignore */ }
        }

        const p: Product = {
          id: String(data.id),
          name: data.name,
          description: data.description || "",
          price: data.price,
          discountPercent: data.discount_percent ?? data.discountPercent,
          imageUrl: data.image_url ?? data.imageUrl,
          images: extraImages.length > 0 ? extraImages : undefined,
          storeId: String(data.store_id ?? data.storeId),
          categoryId: data.category_id ?? data.categoryId,
          sectionId: data.section_id ?? data.sectionId,
          sectionName: data.section_name ?? data.sectionName,
          sku: data.sku,
          stock: data.stock ?? 0,
          isFeatured: data.is_featured ?? data.isFeatured ?? false,
          createdAt: data.created_at ?? data.createdAt,
          updatedAt: data.updated_at ?? data.updatedAt,
          flashPrice: data.flash_price ?? data.flashPrice,
          flashEndsAt: data.flash_ends_at ?? data.flashEndsAt,
        };

        setProduct(p);

        const sid = storeIdParam || p.storeId;
        if (sid) {
          const fetchedStore = await fetchStoreById(sid);
          if (fetchedStore) setStore(fetchedStore);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, storeIdParam]);

  if (loading) return <LoadingSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">المنتج غير موجود</p>
          <button
            onClick={() => router.back()}
            className="text-sm font-bold text-primary hover:underline"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  const flash = hasActiveFlashSale(product);
  const onSale = flash || hasActiveDiscount(product);
  const displayPrice = getEffectivePrice(product);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // بناء مصفوفة الصور للمعرض
  const galleryImages: string[] = [];
  if (product.imageUrl) galleryImages.push(product.imageUrl);
  if (product.images) {
    product.images.forEach(img => {
      if (!galleryImages.includes(img)) galleryImages.push(img);
    });
  }

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product);
    toast({ title: "أُضيف للسلة ✓", description: product.name, productImage: product.imageUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product);
    router.push("/cart");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28" dir="rtl">

      {/* ───── معرض الصور ───── */}
      <ProductGallery images={galleryImages} alt={product.name} priority>
        {/* تدرج علوي */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* زر الرجوع */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/30 backdrop-blur-md text-white text-[13px] font-bold px-3 py-2 rounded-full border border-white/20 hover:bg-black/40 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>

        {/* الشارات */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-end">
          {flash && (
            <div className="flex items-center gap-1.5 bg-amber-500 rounded-full px-3 py-1.5">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-[11px] font-black text-white">فلاش سيل</span>
            </div>
          )}
          {!flash && hasActiveDiscount(product) && (
            <div className="bg-rose-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full">
              خصم {product.discountPercent}%
            </div>
          )}
          {product.isFeatured && !flash && !hasActiveDiscount(product) && (
            <div className="bg-primary text-white text-[11px] font-black px-3 py-1.5 rounded-full">
              مميز
            </div>
          )}
        </div>

        {/* نفد المخزون */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <span className="bg-white text-slate-700 text-sm font-black px-6 py-2.5 rounded-full shadow-lg">
              نفد المخزون
            </span>
          </div>
        )}
      </ProductGallery>

      {/* ───── تفاصيل المنتج ───── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 pt-5 space-y-4"
      >
        {/* الاسم */}
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">{product.name}</h1>
          {product.sectionName && (
            <span className="inline-block mt-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
              {product.sectionName}
            </span>
          )}
        </div>

        {/* السعر */}
        <div className="flex items-end gap-3">
          <div>
            {onSale && (
              <p className="text-xs text-slate-400 line-through mb-0.5">
                {product.price.toLocaleString()} د.ع
              </p>
            )}
            <p className={cn(
              "text-3xl font-black leading-none",
              flash ? "text-amber-600" : onSale ? "text-rose-600" : "text-slate-900"
            )}>
              {displayPrice.toLocaleString()}
              <span className="text-base font-bold text-slate-400 mr-1">د.ع</span>
            </p>
          </div>

          {flash && product.flashEndsAt && (
            <div className="pb-0.5 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <FlashCountdown endsAt={product.flashEndsAt} />
            </div>
          )}
        </div>

        {/* المخزون */}
        {!isOutOfStock && (
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-bold",
            isLowStock ? "text-amber-600" : "text-emerald-600"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isLowStock ? "bg-amber-400" : "bg-emerald-400")} />
            {isLowStock
              ? `آخر ${product.stock} قطع فقط`
              : `متوفر في المخزون (${product.stock} قطعة)`
            }
          </div>
        )}

        {/* الوصف */}
        {product.description && product.description.trim() && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/80">
              <h2 className="text-sm font-bold text-slate-700">وصف المنتج</h2>
            </div>
            <p className="px-4 py-3.5 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* معلومات المتجر */}
        {store && <MiniStoreCard store={store} />}

        {/* SKU */}
        {product.sku && (
          <p className="text-[11px] text-slate-400 font-medium">رمز المنتج: {product.sku}</p>
        )}
      </motion.div>

      {/* ───── شريط الإجراءات الثابت (أضف / اشتري الآن) ───── */}
      <div className="fixed bottom-0 right-0 left-0 z-40 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        {isOutOfStock ? (
          <button
            disabled
            className="w-full h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2.5 bg-slate-300 cursor-not-allowed"
          >
            <Package className="w-5 h-5" />
            نفد المخزون
          </button>
        ) : (
          <div className="flex gap-3">
            {/* أضف إلى السلة */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all",
                added
                  ? "bg-emerald-500 shadow-emerald-200"
                  : "bg-slate-800 hover:bg-slate-700"
              )}
              style={added ? { boxShadow: "0 6px 20px rgba(16,185,129,0.35)" } : undefined}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  أُضيف للسلة
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  أضف للسلة
                </>
              )}
            </motion.button>

            {/* اشتري الآن */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBuyNow}
              className="flex-[1.4] h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 transition-all"
              style={{ boxShadow: "0 8px 24px rgba(37,99,235,0.38)" }}
            >
              <CreditCard className="w-5 h-5" />
              اشتري الآن
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
