"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, MapPin, Clock, Shield, ChevronLeft,
} from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";
import { useRouter } from "next/navigation";

interface StoreHeroProps { store: Store }

function StoreHeroContent({ store }: StoreHeroProps) {
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
    <div className="bg-white">

      {/* ══════════════════════════════════════════
          غلاف المتجر — صورة كاملة أو تدرج لوني
      ══════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden" style={{ height: "220px" }}>

        {/* زر الرجوع */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1.5 rounded-full transition-all"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          رجوع
        </button>

        {/* صورة الغلاف */}
        {store.coverImageUrl ? (
          store.coverImageUrl.startsWith("data:") ? (
            <img
              src={store.coverImageUrl}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={store.coverImageUrl}
              alt={store.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              quality={90}
            />
          )
        ) : (
          /* تدرج افتراضي احترافي */
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, #0f2460 0%, #1e3a8a 35%, #2563eb 65%, #3b82f6 100%)",
            }}
          >
            {/* نمط نقطي */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
          </div>
        )}

        {/* تدرج داكن لأسفل */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* شارة النشاط — أعلى اليسار */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm border ${
              store.isActive
                ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                : "bg-white/10 border-white/20 text-white/60"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${store.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}
            />
            {store.isActive ? "نشط" : "مغلق مؤقتاً"}
          </div>
        </div>

        {/* اسم المتجر فوق الغلاف */}
        <div className="absolute bottom-4 right-4 left-4 z-10">
          {store.marketType && (
            <span className="inline-block text-[11px] font-semibold text-white/70 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 mb-1.5">
              {store.marketType}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg leading-tight">
            {store.name}
          </h1>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          بطاقة الهوية — لوغو + معلومات سريعة
      ══════════════════════════════════════════ */}
      <div className="relative px-4 sm:px-5">

        {/* اللوغو يطفو فوق الغلاف */}
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }}
          >
            {store.logoUrl ? (
              store.logoUrl.startsWith("data:") ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1" />
              ) : (
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  fill
                  className="object-contain p-1"
                  sizes="96px"
                  priority
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
                <Globe className="w-10 h-10 text-primary/40" />
              </div>
            )}
          </div>

          {/* شارات سريعة */}
          <div className="flex gap-2 mb-1">
            {store.hasDelivery && (
              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                <Truck className="w-3 h-3" />
                توصيل
              </span>
            )}
            <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <Shield className="w-3 h-3 text-primary" />
              موثّق
            </span>
          </div>
        </div>

        {/* التقييم */}
        {store.reviews > 0 ? (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= Math.round(store.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-extrabold text-slate-800">{store.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({store.reviews} تقييم)</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-2">لا توجد تقييمات بعد</p>
        )}

        {/* وصف المتجر */}
        {store.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">
            {store.description}
          </p>
        )}

        {/* شرائح معلومات */}
        <div className="flex flex-wrap gap-2 mb-4">
          {info.hoursText && (
            <InfoChip icon={<Clock className="w-3 h-3" />} label={info.hoursText} color="purple" />
          )}
          {info.isPhysical && store.location && (
            <InfoChip icon={<MapPin className="w-3 h-3" />} label={store.location} color="rose" />
          )}
          {store.type && (
            <InfoChip icon={<Globe className="w-3 h-3" />} label={store.type} color="sky" />
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          أزرار التفاعل
      ══════════════════════════════════════════ */}
      <div className="px-4 sm:px-5 pb-5 space-y-2.5">

        {/* زر ابدأ التسوق */}
        <a
          href="#store-products"
          className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl font-black text-[15px] text-white transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
            boxShadow: "0 6px 20px rgba(37,99,235,0.4)",
          }}
        >
          <ShoppingCart className="w-5 h-5" />
          ابدأ التسوق
        </a>

        {/* أزرار ثانوية */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${[info.whatsappHref, info.hasCoords && info.isPhysical, true].filter(Boolean).length}, 1fr)` }}>
          {info.whatsappHref && (
            <a
              href={info.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-2xl font-bold text-[12px] text-white transition-all active:scale-[0.97]"
              style={{ background: "#25D366", boxShadow: "0 4px 14px rgba(37,211,102,0.35)" }}
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
              className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-2xl font-bold text-[12px] text-white bg-slate-700 hover:bg-slate-800 transition-all active:scale-[0.97]"
              style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
            >
              <MapPin className="w-5 h-5" />
              الخريطة
            </a>
          )}

          <StoreRatingDialogWrapper
            storeId={store.id}
            storeName={store.name}
            ownerId={store.ownerId}
            buttonClassName="w-full h-14 rounded-2xl font-bold text-[12px] flex-col gap-1.5"
          />
        </div>
      </div>

      <div className="mx-4 sm:mx-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </div>
  );
}

/* ── Chip مساعد ─────────────────────────────── */
type ChipColor = "sky" | "purple" | "rose" | "emerald" | "amber";
const chipColors: Record<ChipColor, string> = {
  sky:     "bg-sky-50 border-sky-200 text-sky-700",
  purple:  "bg-purple-50 border-purple-200 text-purple-700",
  rose:    "bg-rose-50 border-rose-200 text-rose-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  amber:   "bg-amber-50 border-amber-200 text-amber-700",
};

function InfoChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: ChipColor }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${chipColors[color]}`}>
      {icon}
      <span className="max-w-[130px] truncate">{label}</span>
    </div>
  );
}

export const StoreHero = memo(StoreHeroContent);
