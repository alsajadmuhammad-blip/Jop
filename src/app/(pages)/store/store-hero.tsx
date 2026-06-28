"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, MapPin, CheckCircle2, XCircle, Clock,
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
    const businessHoursText =
      store.businessHours
        ? `${String(store.businessHours.open).padStart(2, "0")}:00 – ${String(store.businessHours.close).padStart(2, "0")}:00`
        : null;
    return { whatsappHref, isPhysical, hasCoords, mapsUrl, businessHoursText };
  }, [store]);

  const coverSrc = store.coverImageUrl || store.logoUrl;

  return (
    <section className="relative overflow-visible mb-0">

      {/* ── Cover image ─────────────────────────────────────── */}
      <div className="relative w-full h-[230px] sm:h-[270px] overflow-hidden bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900">
        {coverSrc && (
          <Image
            src={coverSrc}
            alt={store.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={80}
          />
        )}
        {/* gradient overlay: dark at bottom so card edge blends */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

        {/* Store type badge - top right */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1">
          <span className="text-xs font-bold text-white">{store.marketType || store.type}</span>
        </div>

        {/* Active / closed badge - top left */}
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1 border backdrop-blur-md text-xs font-bold ${
          store.isActive
            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
            : "bg-red-500/20 border-red-400/40 text-red-200"
        }`}>
          {store.isActive
            ? <><CheckCircle2 className="w-3.5 h-3.5" />نشط</>
            : <><XCircle className="w-3.5 h-3.5" />مغلق</>
          }
        </div>
      </div>

      {/* ── White card that lifts over the cover ────────────── */}
      <div className="relative -mt-7 z-10">
        <div className="bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.13)]">
          <div className="px-4 sm:px-6 pt-5 pb-4">

            {/* Logo + name */}
            <div className="flex items-start gap-4 mb-4">
              <div className="relative -mt-14 flex-shrink-0 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-100 to-slate-100">
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt={store.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Globe className="w-8 h-8 text-blue-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight line-clamp-2">
                  {store.name}
                </h1>
                {/* Mini stats */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Rating */}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {store.reviews > 0 ? `${store.rating.toFixed(1)} (${store.reviews})` : "جديد"}
                  </span>
                  {/* Delivery */}
                  {store.hasDelivery && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                      <Truck className="w-3 h-3" />توصيل
                    </span>
                  )}
                  {/* Business hours */}
                  {info.businessHoursText && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                      <Clock className="w-3 h-3" />
                      {info.businessHoursText}
                    </span>
                  )}
                  {/* Location (physical stores) */}
                  {info.isPhysical && store.location && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
                      <MapPin className="w-3 h-3" />
                      {store.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {store.description && (
              <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                {store.description}
              </p>
            )}

            {/* ── Action buttons ─────────────────────────── */}
            <div className="space-y-2.5">
              {/* Primary CTA */}
              <Button
                asChild
                size="lg"
                className="w-full h-12 rounded-2xl font-bold text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md active:scale-[0.98] transition-all gap-2"
              >
                <a href="#store-products">
                  <ShoppingCart className="w-5 h-5" />
                  ابدأ التسوق
                </a>
              </Button>

              {/* Secondary row */}
              <div className={`grid gap-2 ${
                info.isPhysical && info.hasCoords && info.whatsappHref
                  ? "grid-cols-3"
                  : (info.isPhysical && info.hasCoords) || info.whatsappHref
                    ? "grid-cols-2"
                    : "grid-cols-1"
              }`}>
                {/* WhatsApp */}
                {info.whatsappHref ? (
                  <Button
                    asChild
                    size="default"
                    className="rounded-xl h-10 bg-[#25D366] hover:bg-[#20b958] text-white font-semibold gap-1.5 active:scale-[0.98] transition-all"
                  >
                    <a href={info.whatsappHref} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">واتساب</span>
                    </a>
                  </Button>
                ) : null}

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
                    <Button size="default" className="rounded-xl h-10 bg-slate-100 text-slate-400 border border-slate-200" disabled>
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
      </div>
    </section>
  );
}

export const StoreHero = memo(StoreHeroContent);
