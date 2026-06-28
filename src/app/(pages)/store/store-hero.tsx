"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, MapPin, Clock,
} from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";

interface StoreHeroProps { store: Store }

function StoreHeroContent({ store }: StoreHeroProps) {
  const info = useMemo(() => {
    const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
    const whatsappHref = cleanWA
      ? `https://wa.me/${cleanWA.replace(/^\+/, "")}`
      : undefined;
    const isPhysical = store.type === "فعلي";
    const hasCoords = isPhysical && Boolean(store.latitude && store.longitude);
    const mapsUrl = hasCoords
      ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}`
      : undefined;
    const businessHoursText = store.businessHours
      ? `${String(store.businessHours.open).padStart(2, "0")}:00 – ${String(store.businessHours.close).padStart(2, "0")}:00`
      : null;
    return { whatsappHref, isPhysical, hasCoords, mapsUrl, businessHoursText };
  }, [store]);

  /* count how many secondary buttons we'll show */
  const secondaryCount =
    (info.whatsappHref ? 1 : 0) +
    (info.isPhysical ? 1 : 0) +
    1; /* rating always shown */

  return (
    <div className="bg-white border-b border-slate-100 shadow-sm">
      {/* ── Top decorative strip ──────────────────────────── */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700" />

      <div className="px-4 sm:px-6 pt-6 pb-4">

        {/* ── Logo + name block ─────────────────────────── */}
        <div className="flex items-center gap-4 mb-5">
          {/* Logo */}
          <div className="relative flex-shrink-0 w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200 bg-gradient-to-br from-slate-100 to-blue-50">
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt={store.name}
                fill
                className="object-cover"
                sizes="88px"
                priority
                quality={90}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Globe className="w-9 h-9 text-blue-300" />
              </div>
            )}
            {/* Active indicator dot */}
            <span
              className={`absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                store.isActive ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight truncate">
              {store.name}
            </h1>

            {/* Market type + status */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {(store.marketType || store.type) && (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                  {store.marketType || store.type}
                </span>
              )}
              <span
                className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${
                  store.isActive
                    ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                    : "text-slate-500 bg-slate-50 border-slate-200"
                }`}
              >
                {store.isActive ? "متجر نشط" : "مؤقتاً مغلق"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Info pills row ────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Rating */}
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-800">
              {store.reviews > 0
                ? `${store.rating.toFixed(1)}  (${store.reviews})`
                : "لا يوجد تقييمات بعد"}
            </span>
          </div>

          {/* Delivery */}
          {store.hasDelivery && (
            <div className="flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1.5">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs font-bold text-sky-800">توصيل متاح</span>
            </div>
          )}

          {/* Hours */}
          {info.businessHoursText && (
            <div className="flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-bold text-purple-800">{info.businessHoursText}</span>
            </div>
          )}

          {/* Location pill (physical stores) */}
          {info.isPhysical && store.location && (
            <div className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-bold text-rose-800 truncate max-w-[120px]">
                {store.location}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {store.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
            {store.description}
          </p>
        )}

        {/* ── Action buttons ────────────────────────────── */}
        <div className="space-y-2.5">
          {/* Primary */}
          <Button
            asChild
            size="lg"
            className="w-full h-12 rounded-2xl font-bold text-base gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md active:scale-[0.98] transition-all"
          >
            <a href="#store-products">
              <ShoppingCart className="w-5 h-5" />
              ابدأ التسوق
            </a>
          </Button>

          {/* Secondary row */}
          <div
            className={`grid gap-2 grid-cols-${Math.min(secondaryCount, 3)}`}
            style={{
              gridTemplateColumns: `repeat(${Math.min(secondaryCount, 3)}, minmax(0, 1fr))`,
            }}
          >
            {/* WhatsApp */}
            {info.whatsappHref && (
              <Button
                asChild
                size="default"
                className="rounded-xl h-10 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold gap-1.5 active:scale-[0.98] transition-all"
              >
                <a href={info.whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">واتساب</span>
                </a>
              </Button>
            )}

            {/* Maps — physical stores only */}
            {info.isPhysical && (
              info.hasCoords ? (
                <Button
                  asChild
                  size="default"
                  className="rounded-xl h-10 bg-blue-500 hover:bg-blue-600 text-white font-semibold gap-1.5 active:scale-[0.98] transition-all"
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

            {/* Rating */}
            <StoreRatingDialogWrapper
              storeId={store.id}
              storeName={store.name}
              ownerId={store.ownerId}
              buttonClassName="rounded-xl h-10 font-semibold text-sm w-full gap-1.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const StoreHero = memo(StoreHeroContent);
