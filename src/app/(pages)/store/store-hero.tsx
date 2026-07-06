"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, MapPin, Clock, ChevronRight, Package,
} from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";
import { useRouter } from "next/navigation";

interface StoreHeroProps {
  store: Store;
  productCount: number;
}

function StoreHeroContent({ store, productCount }: StoreHeroProps) {
  const router = useRouter();

  const info = useMemo(() => {
    const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
    const whatsappHref = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;
    const isPhysical = store.type === "فعلي";
    const hasCoords = isPhysical && Boolean(store.latitude && store.longitude);
    const mapsUrl = hasCoords
      ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}`
      : undefined;
    const hoursText = store.businessHours
      ? `${String(store.businessHours.open).padStart(2, "0")}:00 – ${String(store.businessHours.close).padStart(2, "0")}:00`
      : null;
    return { whatsappHref, isPhysical, hasCoords, mapsUrl, hoursText };
  }, [store]);

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO — صورة كاملة + طبقة تدرج
      ══════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden bg-slate-900" style={{ height: "300px" }}>

        {/* صورة الغلاف */}
        {store.coverImageUrl ? (
          store.coverImageUrl.startsWith("data:") ? (
            <img src={store.coverImageUrl} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <Image src={store.coverImageUrl} alt={store.name} fill className="object-cover" sizes="100vw" priority quality={90} />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-primary/80 to-slate-800">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </div>
        )}

        {/* تدرج من الأسفل */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* زر الرجوع */}
        <button
          onClick={() => router.back()}
          aria-label="رجوع"
          className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white text-[13px] font-semibold px-3 py-1.5 rounded-full border border-white/10 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
          رجوع
        </button>

        {/* شارة الحالة */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-md border ${
            store.isActive
              ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
              : "bg-black/30 border-white/20 text-white/60"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${store.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            {store.isActive ? "مفتوح الآن" : "مغلق مؤقتاً"}
          </div>
        </div>

        {/* معلومات المتجر فوق الغلاف */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 pb-4">
          {store.marketType && (
            <span className="inline-block mb-2 text-[11px] font-bold text-white/60 bg-white/10 border border-white/10 backdrop-blur-sm rounded-full px-2.5 py-0.5 uppercase tracking-widest">
              {store.marketType}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tight mb-2" dir="rtl">
            {store.name}
          </h1>
          {/* تقييم النجوم */}
          {store.reviews > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(store.rating) ? "fill-amber-400 text-amber-400" : "fill-white/20 text-white/20"}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{store.rating.toFixed(1)}</span>
              <span className="text-xs text-white/60">({store.reviews} تقييم)</span>
            </div>
          ) : (
            <span className="text-xs text-white/50">لا توجد تقييمات بعد</span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          لوغو + إحصائيات سريعة
      ══════════════════════════════════════════════ */}
      <div className="bg-white">
        <div className="px-4 sm:px-6 pt-4 pb-0">
          <div className="flex items-end justify-between gap-3 -mt-12 mb-4">
            {/* لوغو */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white bg-white overflow-hidden flex-shrink-0"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            >
              {store.logoUrl ? (
                store.logoUrl.startsWith("data:") ? (
                  <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <Image src={store.logoUrl} alt={store.name} fill className="object-contain p-1.5" sizes="112px" priority />
                )
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
                  <Globe className="w-10 h-10 text-primary/40" />
                </div>
              )}
            </div>

            {/* شارات الجانب */}
            <div className="flex flex-col gap-1.5 pb-1">
              {store.hasDelivery && (
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                  <Truck className="w-3 h-3" /> توصيل مجاني
                </span>
              )}
              {info.hoursText && (
                <span className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                  <Clock className="w-3 h-3" /> {info.hoursText}
                </span>
              )}
            </div>
          </div>

          {/* وصف */}
          {store.description && (
            <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{store.description}</p>
          )}

          {/* شريط الإحصائيات */}
          <div className="grid grid-cols-3 gap-0 border border-slate-100 rounded-2xl overflow-hidden mb-4">
            <StatCell icon={<Package className="w-4 h-4 text-primary" />} value={String(productCount)} label="منتج" />
            <StatCell
              icon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              value={store.reviews > 0 ? store.rating.toFixed(1) : "—"}
              label="التقييم"
              border
            />
            <StatCell
              icon={<Truck className="w-4 h-4 text-emerald-500" />}
              value={store.hasDelivery ? "متاح" : "—"}
              label="توصيل"
              border
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            أزرار التفاعل
        ══════════════════════════════════════════════ */}
        <div className="px-4 sm:px-6 pb-5 space-y-2.5">
          {/* CTA رئيسي */}
          <a
            href="#store-products"
            className="flex items-center justify-center gap-2.5 w-full h-13 rounded-2xl font-black text-base text-white transition-all active:scale-[0.98]"
            style={{ height: "52px", background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)", boxShadow: "0 6px 24px rgba(37,99,235,0.4)" }}
          >
            <ShoppingCart className="w-5 h-5" />
            تسوق الآن
          </a>

          {/* أزرار ثانوية */}
          {(info.whatsappHref || (info.isPhysical && info.hasCoords) || true) && (
            <div className={`grid gap-2 ${[info.whatsappHref, info.isPhysical && info.hasCoords].filter(Boolean).length === 2 ? "grid-cols-3" : [info.whatsappHref, info.isPhysical && info.hasCoords].filter(Boolean).length === 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {info.whatsappHref && (
                <a
                  href={info.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 h-14 rounded-2xl font-bold text-[12px] text-white transition-all active:scale-95"
                  style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}
                >
                  <MessageSquare className="w-5 h-5" />
                  واتساب
                </a>
              )}
              {info.isPhysical && info.hasCoords && (
                <a
                  href={info.mapsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 h-14 rounded-2xl font-bold text-[12px] text-white bg-slate-800 hover:bg-slate-900 transition-all active:scale-95"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
                >
                  <MapPin className="w-5 h-5" />
                  الخريطة
                </a>
              )}
              <StoreRatingDialogWrapper
                storeId={store.id}
                storeName={store.name}
                ownerId={store.ownerId}
                buttonClassName="w-full h-14 rounded-2xl font-bold text-[12px] flex-col gap-1"
              />
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100" />
      </div>
    </>
  );
}

function StatCell({ icon, value, label, border }: { icon: React.ReactNode; value: string; label: string; border?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center py-3 gap-0.5 bg-white ${border ? "border-r border-slate-100" : ""}`}>
      {icon}
      <p className="text-base font-black text-slate-900 mt-1">{value}</p>
      <p className="text-[10px] text-slate-400 font-semibold">{label}</p>
    </div>
  );
}

export const StoreHero = memo(StoreHeroContent);
