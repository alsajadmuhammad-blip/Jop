"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, Map, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import { StoreStatusInfo } from "@/components/store-status-info";
import type { Store } from "@/lib/types";

function StoreHeroContent({ store }: { store: Store }) {
  const { whatsappHref, mapsUrl, isPhysical, hasLocation } = useMemo(() => {
    const clean = store.whatsappNumber?.replace(/[^0-9+]/g, "") ?? "";
    const whatsappHref = clean ? `https://wa.me/${clean.replace(/^\+/, "")}` : undefined;
    const isPhysical = store.type === "فعلي";
    const hasLocation = isPhysical && Boolean(store.latitude && store.longitude);
    const mapsUrl = hasLocation
      ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}`
      : undefined;
    return { whatsappHref, mapsUrl, isPhysical, hasLocation };
  }, [store.whatsappNumber, store.type, store.latitude, store.longitude]);

  return (
    <section className="w-full px-4 sm:px-6 pt-5 pb-0 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">

        {/* ── رأس البطاقة: لوغو + اسم ── */}
        <div className="flex flex-col items-center pt-7 pb-5 px-5 gap-3">

          {/* اللوغو */}
          <div className="relative w-24 h-24 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm overflow-hidden flex-shrink-0">
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt={store.name}
                fill
                className="object-contain p-2"
                priority
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Building2 className="w-10 h-10 text-primary/30" />
              </div>
            )}
          </div>

          {/* الاسم */}
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              {store.name}
            </h1>
            {store.description && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed line-clamp-2 max-w-xs mx-auto">
                {store.description}
              </p>
            )}
          </div>

          {/* شارات سريعة */}
          <div className="flex flex-wrap justify-center items-center gap-2">
            {/* التقييم */}
            <span className="flex items-center gap-1 text-sm font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 px-3 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {store.reviews > 0
                ? `${store.rating.toFixed(1)} (${store.reviews})`
                : "جديد"}
            </span>

            {/* نوع المتجر */}
            <span className="flex items-center gap-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
              {isPhysical ? <Building2 className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {store.type}
            </span>

            {/* توصيل */}
            {store.hasDelivery && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1 rounded-full">
                <Truck className="w-3.5 h-3.5" />
                توصيل
              </span>
            )}

            {/* نوع السوق */}
            {store.marketType && (
              <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                {store.marketType}
              </span>
            )}

            {/* حالة الدوام */}
            {isPhysical && store.businessHours && (
              <StoreStatusInfo businessHours={store.businessHours} isCardVersion={true} />
            )}
          </div>
        </div>

        {/* فاصل */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* ── أزرار الإجراءات ── */}
        <div className="px-4 py-4 flex flex-wrap gap-2.5">
          <a href="#store-products" className="flex-1 min-w-[120px]">
            <Button className="w-full h-11 rounded-2xl font-bold gap-2 text-sm shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              ابدأ التسوق
            </Button>
          </a>

          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px]">
              <Button
                variant="outline"
                className="w-full h-11 rounded-2xl font-semibold gap-2 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
              >
                <MessageSquare className="w-4 h-4" />
                واتساب
              </Button>
            </a>
          )}

          {isPhysical && hasLocation && mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px]">
              <Button
                variant="outline"
                className="w-full h-11 rounded-2xl font-semibold gap-2 text-sm border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
              >
                <Map className="w-4 h-4" />
                الخريطة
              </Button>
            </a>
          )}

          <div className="flex-1 min-w-[120px]">
            <StoreRatingDialogWrapper
              storeId={store.id}
              storeName={store.name}
              ownerId={store.ownerId}
              buttonClassName="w-full h-11 rounded-2xl font-semibold gap-2 text-sm"
            />
          </div>
        </div>

      </div>
    </section>
  );
}

export const StoreHero = memo(StoreHeroContent);
