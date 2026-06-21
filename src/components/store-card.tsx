"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Truck, Building2, Globe, Store } from "lucide-react";
import type { Store as StoreType } from "@/lib/types";
import { StoreStatusInfo } from "./store-status-info";

export function StoreCard({ store, distance }: { store: StoreType; distance?: number | null }) {
  const isPhysical = store.type === "فعلي";

  return (
    <Link href={`/store?id=${store.id}`} className="group block h-full">
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

        {/* صورة المتجر */}
        <div className="relative h-32 sm:h-36 w-full bg-slate-50 dark:bg-slate-800 overflow-hidden flex-shrink-0">
          {store.logoUrl ? (
            store.logoUrl.startsWith("data:") ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-3" />
            ) : (
              <Image
                src={store.logoUrl}
                alt={store.name}
                fill
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )
          ) : store.coverImageUrl ? (
            store.coverImageUrl.startsWith("data:") ? (
              <img src={store.coverImageUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <Image
                src={store.coverImageUrl}
                alt={store.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/8 to-slate-100 dark:to-slate-800">
              <Store className="w-9 h-9 text-primary/30" />
            </div>
          )}

          {/* شارة التوصيل */}
          {store.hasDelivery && (
            <span className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Truck className="w-3 h-3" />
              توصيل
            </span>
          )}

          {/* شارة نوع المتجر */}
          <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {isPhysical ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {store.type}
          </span>

          {/* حالة الدوام */}
          {isPhysical && (
            <div className="absolute top-2 left-2">
              <StoreStatusInfo businessHours={store.businessHours} isCardVersion={true} />
            </div>
          )}
        </div>

        {/* معلومات المتجر */}
        <div className="flex flex-col gap-2 p-3 flex-grow">
          {/* الاسم والتقييم */}
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1 leading-tight">
              {store.name}
            </h3>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {store.reviews > 0 ? store.rating.toFixed(1) : "جديد"}
              </span>
            </div>
          </div>

          {/* نوع السوق */}
          {store.marketType && (
            <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
              {store.marketType}
            </span>
          )}

          {/* الموقع */}
          {isPhysical && store.location && (
            <div className="flex items-center gap-1 mt-auto pt-1 border-t border-slate-50 dark:border-slate-800">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 line-clamp-1">{store.location}</span>
              {distance != null && (
                <span className="text-xs font-bold text-primary mr-auto">{distance.toFixed(1)} كم</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
