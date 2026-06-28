"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, MapPin, Clock, CheckCircle,
} from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";

interface StoreHeroProps { store: Store }

function StoreHeroContent({ store }: StoreHeroProps) {
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

  const ratingStars = Math.round(store.rating);

  return (
    <div className="bg-white">

      {/* ═══════════════════════════════════════════════
          TOP BANNER — gradient + pattern + logo
      ═══════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #0f2460 0%, #1e40af 40%, #2563eb 70%, #1d4ed8 100%)",
          minHeight: "190px",
        }}
      >
        {/* Decorative circles (blur glow) */}
        <div
          className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div
          className="absolute top-6 left-1/2 w-32 h-32 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #bfdbfe, transparent 70%)" }}
        />

        {/* Dot pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Status badge — top right */}
        <div className="absolute top-4 right-4">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm border ${
              store.isActive
                ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                : "bg-white/10 border-white/20 text-white/60"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${store.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}
            />
            {store.isActive ? "متجر نشط" : "مؤقتاً مغلق"}
          </div>
        </div>

        {/* Market type badge — top left */}
        {(store.marketType || store.type) && (
          <div className="absolute top-4 left-4">
            <span className="text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
              {store.marketType || store.type}
            </span>
          </div>
        )}

        {/* Spacer so the logo overlaps the bottom */}
        <div className="h-[152px]" />
      </div>

      {/* ═══════════════════════════════════════════════
          LOGO — floats between banner and content
      ═══════════════════════════════════════════════ */}
      <div className="flex justify-center -mt-[52px] relative z-10 px-4">
        <div
          className="relative w-[100px] h-[100px] sm:w-[112px] sm:h-[112px] rounded-[1.6rem] border-4 border-white overflow-hidden bg-white"
          style={{
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >
          {store.logoUrl ? (
            <Image
              src={store.logoUrl}
              alt={store.name}
              fill
              className="object-cover"
              sizes="112px"
              priority
              quality={90}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
              <Globe className="w-12 h-12 text-blue-300" />
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          STORE IDENTITY
      ═══════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 pt-4 text-center">
        {/* Store name */}
        <h1
          className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          {store.name}
        </h1>

        {/* Stars */}
        {store.reviews > 0 ? (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= ratingStars
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-700">
              {store.rating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">({store.reviews} تقييم)</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-2">لا توجد تقييمات بعد</p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          INFO CHIPS
      ═══════════════════════════════════════════════ */}
      <div className="flex flex-wrap justify-center gap-2 px-4 mt-4">
        {store.hasDelivery && (
          <Chip icon={<Truck className="w-3.5 h-3.5" />} label="توصيل متاح" color="sky" />
        )}
        {info.hoursText && (
          <Chip icon={<Clock className="w-3.5 h-3.5" />} label={info.hoursText} color="purple" />
        )}
        {info.isPhysical && store.location && (
          <Chip icon={<MapPin className="w-3.5 h-3.5" />} label={store.location} color="rose" />
        )}
        {store.isActive && (
          <Chip icon={<CheckCircle className="w-3.5 h-3.5" />} label="متجر موثوق" color="emerald" />
        )}
      </div>

      {/* Description */}
      {store.description && (
        <p className="text-sm text-slate-500 text-center leading-relaxed mt-3 px-6 line-clamp-2">
          {store.description}
        </p>
      )}

      {/* ═══════════════════════════════════════════════
          DIVIDER
      ═══════════════════════════════════════════════ */}
      <div className="mx-4 mt-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* ═══════════════════════════════════════════════
          ACTION BUTTONS
      ═══════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 pt-4 pb-5 space-y-2.5">
        {/* Primary CTA */}
        <Button
          asChild
          size="lg"
          className="w-full h-13 rounded-2xl font-extrabold text-base gap-2.5 shadow-lg active:scale-[0.98] transition-all"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
            boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
          }}
        >
          <a href="#store-products">
            <ShoppingCart className="w-5 h-5" />
            ابدأ التسوق
          </a>
        </Button>

        {/* Secondary buttons */}
        {(info.whatsappHref || info.isPhysical) && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${
                [info.whatsappHref, info.isPhysical].filter(Boolean).length + 1
              }, minmax(0, 1fr))`,
            }}
          >
            {info.whatsappHref && (
              <Button
                asChild
                size="default"
                className="rounded-xl h-10 font-bold gap-1.5 active:scale-[0.98] transition-all text-white"
                style={{ background: "#25D366" }}
              >
                <a href={info.whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">واتساب</span>
                </a>
              </Button>
            )}

            {info.isPhysical && (
              info.hasCoords ? (
                <Button
                  asChild
                  size="default"
                  className="rounded-xl h-10 bg-slate-700 hover:bg-slate-800 text-white font-bold gap-1.5 active:scale-[0.98] transition-all"
                >
                  <a href={info.mapsUrl!} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">الخريطة</span>
                  </a>
                </Button>
              ) : (
                <Button
                  size="default"
                  className="rounded-xl h-10 bg-slate-100 text-slate-400 border border-slate-200"
                  disabled
                >
                  <MapPin className="w-4 h-4 ml-1" />
                  <span className="text-sm">الخريطة</span>
                </Button>
              )
            )}

            <StoreRatingDialogWrapper
              storeId={store.id}
              storeName={store.name}
              ownerId={store.ownerId}
              buttonClassName="rounded-xl h-10 font-bold text-sm w-full gap-1.5"
            />
          </div>
        )}

        {/* If no secondary buttons except rating */}
        {!info.whatsappHref && !info.isPhysical && (
          <StoreRatingDialogWrapper
            storeId={store.id}
            storeName={store.name}
            ownerId={store.ownerId}
            buttonClassName="rounded-xl h-10 font-bold text-sm w-full gap-1.5"
          />
        )}
      </div>
    </div>
  );
}

/* ── Chip helper ──────────────────────────────────────────── */
type ChipColor = "sky" | "purple" | "rose" | "emerald" | "amber";
const chipColors: Record<ChipColor, string> = {
  sky:     "bg-sky-50 border-sky-200 text-sky-700",
  purple:  "bg-purple-50 border-purple-200 text-purple-700",
  rose:    "bg-rose-50 border-rose-200 text-rose-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  amber:   "bg-amber-50 border-amber-200 text-amber-700",
};

function Chip({ icon, label, color }: { icon: React.ReactNode; label: string; color: ChipColor }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${chipColors[color]}`}
    >
      {icon}
      <span className="max-w-[110px] truncate">{label}</span>
    </div>
  );
}

export const StoreHero = memo(StoreHeroContent);
