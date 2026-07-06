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
    const mapsUrl = hasCoords ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}` : undefined;
    const hoursText = store.businessHours
      ? `${String(store.businessHours.open).padStart(2, "0")}:00 – ${String(store.businessHours.close).padStart(2, "0")}:00`
      : null;
    return { whatsappHref, isPhysical, hasCoords, mapsUrl, hoursText };
  }, [store]);

  const actionCount = [info.whatsappHref, info.isPhysical && info.hasCoords, true].filter(Boolean).length;

  return (
    <>
      {/* ══════════════════════════
          صورة الغلاف فقط — بدون نص
      ══════════════════════════ */}
      <div className="relative w-full bg-slate-900 overflow-hidden" style={{ height: "220px" }}>

        {store.coverImageUrl ? (
          store.coverImageUrl.startsWith("data:") ? (
            <img src={store.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image src={store.coverImageUrl} alt="" fill className="object-cover" sizes="100vw" priority quality={85} />
          )
        ) : (
          <div className="w-full h-full"
            style={{ background: "linear-gradient(135deg,#0f2460 0%,#1e3a8a 40%,#2563eb 100%)" }}>
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
          </div>
        )}

        {/* تدرج خفيف للأسفل */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        {/* زر الرجوع */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-[13px] font-semibold px-3 py-1.5 rounded-full border border-white/10"
        >
          <ChevronRight className="w-4 h-4" />
          رجوع
        </button>

        {/* شارة الحالة */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm border ${
            store.isActive
              ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
              : "bg-black/30 border-white/20 text-white/60"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${store.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            {store.isActive ? "مفتوح" : "مغلق"}
          </div>
        </div>
      </div>

      {/* ══════════════════════════
          هوية المتجر — أبيض
      ══════════════════════════ */}
      <div className="bg-white px-4 sm:px-5">

        {/* لوغو + معلومات جانبية */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}
          >
            {store.logoUrl ? (
              store.logoUrl.startsWith("data:") ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <Image src={store.logoUrl} alt={store.name} fill className="object-contain p-1.5" sizes="96px" priority />
              )
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
                <Globe className="w-9 h-9 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 pb-1 items-end">
            {store.hasDelivery && (
              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                <Truck className="w-3 h-3" /> توصيل
              </span>
            )}
            {info.hoursText && (
              <span className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" /> {info.hoursText}
              </span>
            )}
          </div>
        </div>

        {/* اسم المتجر والتصنيف */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight mb-1">
          {store.name}
        </h1>
        {store.marketType && (
          <p className="text-sm text-slate-400 font-medium mb-2">{store.marketType}</p>
        )}

        {/* التقييم */}
        {store.reviews > 0 ? (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(store.rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-800">{store.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({store.reviews} تقييم)</span>
          </div>
        ) : (
          <div className="mb-3" />
        )}

        {/* وصف */}
        {store.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">{store.description}</p>
        )}

        {/* شريط الإحصائيات */}
        <div className="grid grid-cols-3 border border-slate-100 rounded-2xl overflow-hidden mb-4">
          <StatCell icon={<Package className="w-4 h-4 text-primary" />} value={String(productCount)} label="منتج" />
          <StatCell icon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />} value={store.reviews > 0 ? store.rating.toFixed(1) : "—"} label="التقييم" border />
          <StatCell icon={<Truck className="w-4 h-4 text-emerald-500" />} value={store.hasDelivery ? "متاح" : "—"} label="توصيل" border />
        </div>

        {/* موقع المتجر */}
        {info.isPhysical && store.location && (
          <div className="flex items-center gap-1.5 mb-4 text-sm text-slate-500">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="line-clamp-1">{store.location}</span>
          </div>
        )}
      </div>

      {/* ══════════════════════════
          أزرار التفاعل
      ══════════════════════════ */}
      <div className="bg-white px-4 sm:px-5 pb-5 space-y-2.5">

        <a
          href="#store-products"
          className="flex items-center justify-center gap-2.5 w-full rounded-2xl font-black text-base text-white"
          style={{ height: "52px", background: "linear-gradient(135deg,#1e40af 0%,#2563eb 60%,#3b82f6 100%)", boxShadow: "0 6px 24px rgba(37,99,235,0.38)" }}
        >
          <ShoppingCart className="w-5 h-5" />
          تسوق الآن
        </a>

        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${actionCount}, 1fr)` }}>
          {info.whatsappHref && (
            <a href={info.whatsappHref} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 h-14 rounded-2xl font-bold text-[12px] text-white"
              style={{ background: "#25D366", boxShadow: "0 4px 14px rgba(37,211,102,0.3)" }}>
              <MessageSquare className="w-5 h-5" />
              واتساب
            </a>
          )}
          {info.isPhysical && info.hasCoords && (
            <a href={info.mapsUrl!} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 h-14 rounded-2xl font-bold text-[12px] text-white bg-slate-800"
              style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
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
      </div>

      <div className="h-px bg-slate-100" />
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
