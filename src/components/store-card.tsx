
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, Truck, Building, Globe, Image as ImageIcon } from "lucide-react";

import type { Store } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { StoreStatusInfo } from "./store-status-info";


export function StoreCard({ store, distance }: { store: Store; distance?: number | null }) {
  return (
    <Link href={`/store?id=${store.id}`} className="group">
      <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl overflow-hidden shadow-lg shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl border border-slate-200/80 dark:border-slate-700/80 h-full flex flex-col">
        <div className="relative h-36 md:h-44 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          {store.logoUrl ? (
            store.logoUrl.startsWith('data:') ? (
              <img
                src={store.logoUrl}
                alt={`${store.name}`}
                className="object-contain w-full h-full p-2"
              />
            ) : (
              <Image
                src={store.logoUrl}
                alt={`${store.name}`}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )
          ) : store.coverImageUrl ? (
            store.coverImageUrl.startsWith('data:') ? (
              <img
                src={store.coverImageUrl}
                alt={`${store.name}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src={store.coverImageUrl}
                alt={`${store.name}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/10 to-primary/0">
              <ImageIcon className="w-10 h-10 text-slate-400" />
            </div>
          )}
          {store.type === 'فعلي' && <StoreStatusInfo businessHours={store.businessHours} isCardVersion={true} />}
          <Badge variant="outline" className="absolute bottom-2 right-2 text-xs shadow-sm bg-black/40 text-white/90 border-white/30">
            {store.type === 'فعلي' ? <Building className="w-3 h-3 ml-1"/> : <Globe className="w-3 h-3 ml-1"/>}
            {store.type}
          </Badge>
          {store.hasDelivery && (
            <Badge variant="secondary" className="absolute top-2 left-2 text-xs shadow-sm bg-green-100/90 text-green-800 border-green-200/50">
              <Truck className="w-3 h-3 ml-1"/>
              توصيل
            </Badge>
          )}
        </div>
        <div className="p-4 flex-grow flex flex-col gap-4">
          <div className="flex-grow">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2">
              {store.name}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {store.marketType || 'متجر'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 py-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{store.reviews > 0 ? store.rating.toFixed(1) : 'جديد'}</span>
              <span className="block text-slate-500 dark:text-slate-400">تقييم</span>
            </div>
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 py-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{store.type}</span>
              <span className="block text-slate-500 dark:text-slate-400">نوع المتجر</span>
            </div>
          </div>

          {store.type === 'فعلي' && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{store.location}</span>
              {distance !== undefined && distance !== null && (
                <span className="font-semibold text-primary ml-auto">{distance.toFixed(1)} كم</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
