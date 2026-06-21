"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import {
  Truck, Globe, ShoppingCart, MessageSquare, Star,
  Map, Building2, Package, Phone,
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

  const hasCover = Boolean(store.coverImageUrl);
  const hasLogo  = Boolean(store.logoUrl);

  return (
    <section className="relative w-full">

      {/* ── غلاف المتجر ── */}
      <div className="relative w-full h-52 sm:h-64 bg-slate-800 overflow-hidden">
        {hasCover ? (
          <>
            <Image
              src={store.coverImageUrl!}
              alt={store.name}
              fill
              className="object-cover"
              priority
              quality={80}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary to-primary/60 flex items-center justify-center">
            <Globe className="w-20 h-20 text-white/10" />
          </div>
        )}
      </div>

      {/* ── بطاقة المعلومات الرئيسية ── */}
      <div className="relative z-10 -mt-10 mx-4 sm:mx-6 lg:mx-auto lg:max-w-5xl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">

          {/* رأس البطاقة: لوغو + اسم + شارات */}
          <div className="flex items-end gap-4 px-5 pt-5 pb-4">
            {/* اللوغو */}
            <div className="relative flex-shrink-0 w-20 h-20 -mt-12 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden">
              {hasLogo ? (
                <Image
                  src={store.logoUrl!}
                  alt={store.name}
                  fill
                  className="object-contain p-1"
                  priority
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary/40" />
                </div>
              )}
            </div>

            {/* الاسم + معلومات سريعة */}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
                {store.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {/* التقييم */}
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {store.reviews > 0 ? store.rating.toFixed(1) : "جديد"}
                  {store.reviews > 0 && (
                    <span className="text-xs font-normal text-slate-400">({store.reviews})</span>
                  )}
                </span>

                {/* شارة النوع */}
                <span className="flex items-center gap-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                  {isPhysical ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  {store.type}
                </span>

                {/* توصيل */}
                {store.hasDelivery && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                    <Truck className="w-3 h-3" />
                    توصيل
                  </span>
                )}

                {/* نوع السوق */}
                {store.marketType && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {store.marketType}
                  </span>
                )}
              </div>
            </div>

            {/* حالة الدوام */}
            {isPhysical && store.businessHours && (
              <div className="flex-shrink-0 hidden sm:block">
                <StoreStatusInfo businessHours={store.businessHours} isCardVersion={false} />
              </div>
            )}
          </div>

          {/* وصف المتجر */}
          {store.description && (
            <div className="px-5 pb-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {store.description}
              </p>
            </div>
          )}

          {/* فاصل */}
          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* أزرار الإجراءات */}
          <div className="px-5 py-4 flex flex-wrap gap-2.5">
            <a href="#store-products" className="flex-1 min-w-[120px]">
              <Button className="w-full h-11 rounded-2xl font-bold gap-2 text-sm shadow-sm">
                <ShoppingCart className="w-4 h-4" />
                ابدأ التسوق
              </Button>
            </a>

            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px]">
                <Button variant="outline" className="w-full h-11 rounded-2xl font-semibold gap-2 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                  واتساب
                </Button>
              </a>
            )}

            {isPhysical && hasLocation && mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px]">
                <Button variant="outline" className="w-full h-11 rounded-2xl font-semibold gap-2 text-sm border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400">
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
      </div>
    </section>
  );
}

export const StoreHero = memo(StoreHeroContent);
