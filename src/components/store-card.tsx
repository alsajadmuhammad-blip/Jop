"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Truck, Building2, Globe, Store, Clock, CheckCircle2 } from "lucide-react";
import type { Store as StoreType } from "@/lib/types";
import { StoreStatusInfo } from "./store-status-info";

export function StoreCard({ store, distance }: { store: StoreType; distance?: number | null }) {
  const isPhysical = store.type === "فعلي";

  return (
    <Link href={`/store?id=${store.id}`} className="group block h-full">
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-[transform,box-shadow] duration-300">

        {/* صورة الغلاف مع تدرج */}
        <div className="relative h-28 sm:h-32 w-full overflow-hidden flex-shrink-0">
          {store.coverImageUrl ? (
            store.coverImageUrl.startsWith("data:") ? (
              <img src={store.coverImageUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <Image
                src={store.coverImageUrl}
                alt={store.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-slate-100 dark:to-slate-800" />
          )}

          {/* تدرج داكن للنص */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* شارة التوصيل */}
          {store.hasDelivery && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              <Truck className="w-2.5 h-2.5" />
              توصيل مجاني
            </div>
          )}

          {/* حالة الدوام */}
          {isPhysical && (
            <div className="absolute top-2 left-2">
              <StoreStatusInfo businessHours={store.businessHours} isCardVersion={true} />
            </div>
          )}

          {/* لوغو المتجر — يطفو فوق الغلاف */}
          <div className="absolute -bottom-5 right-3 w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
            {store.logoUrl ? (
              store.logoUrl.startsWith("data:") ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1" />
              ) : (
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  fill
                  className="object-contain p-1"
                  sizes="44px"
                />
              )
            ) : (
              <Store className="w-5 h-5 text-primary/60" />
            )}
          </div>

          {/* نوع المتجر — أسفل يسار */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {isPhysical ? <Building2 className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
            {store.type}
          </div>
        </div>

        {/* معلومات المتجر */}
        <div className="flex flex-col gap-1.5 px-3 pt-7 pb-3 flex-grow">
          {/* الاسم والتقييم */}
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1 leading-tight flex-1">
              {store.name}
            </h3>
            <div className="flex items-center gap-0.5 flex-shrink-0 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                {store.reviews > 0 ? store.rating.toFixed(1) : "جديد"}
              </span>
            </div>
          </div>

          {/* نوع السوق */}
          {store.marketType && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary/50 flex-shrink-0" />
              {store.marketType}
            </span>
          )}

          {/* الموقع */}
          {isPhysical && store.location && (
            <div className="flex items-center gap-1 mt-auto pt-1.5 border-t border-slate-50 dark:border-slate-800">
              <MapPin className="w-3 h-3 text-primary/60 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 line-clamp-1 flex-1">{store.location}</span>
              {distance != null && (
                <span className="text-[11px] font-bold text-primary whitespace-nowrap">{distance.toFixed(1)} كم</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
