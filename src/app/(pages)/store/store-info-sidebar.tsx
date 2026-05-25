"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Truck, Check, X } from "lucide-react";
import type { Store } from "@/lib/types";

interface StoreInfoSidebarProps {
  store: Store;
}

export function StoreInfoSidebar({ store }: StoreInfoSidebarProps) {
  const hasDelivery = Boolean(store.hasDelivery);

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-slate-200">
              {store.logoUrl ? <Image src={store.logoUrl} alt={store.name} fill className="object-cover" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{store.name}</h3>
              <p className="text-xs text-slate-600 mt-2">معلومات المتجر</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="space-y-3 p-5">
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-200">
                <Star className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-amber-700 uppercase">التقييم</span>
                <span className="text-2xl font-bold text-slate-900 block">{store.reviews > 0 ? store.rating.toFixed(1) : "-"}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl bg-gradient-to-br p-4 border ${store.isActive ? "from-green-50 to-emerald-50 border-green-200" : "from-red-50 to-pink-50 border-red-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${store.isActive ? "bg-green-200" : "bg-red-200"}`}>
                {store.isActive ? (
                  <Check className="w-5 h-5 text-green-700" />
                ) : (
                  <X className="w-5 h-5 text-red-700" />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-xs font-semibold uppercase ${store.isActive ? "text-green-700" : "text-red-700"}`}>
                  {store.isActive ? "متاح الآن" : "غير متاح"}
                </span>
                <span className={`text-sm font-bold block ${store.isActive ? "text-green-900" : "text-red-900"}`}>
                  {store.isActive ? "المتجر نشط" : "المتجر مغلق"}
                </span>
              </div>
            </div>
          </div>

          {hasDelivery && (
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-200">
                  <Truck className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-blue-700 uppercase">التوصيل</span>
                  <span className="text-sm font-bold text-slate-900 block">✓ متوفر</span>
                </div>
              </div>
            </div>
          )}

          {store.location && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-300 flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-700 uppercase">الموقع</span>
                  <span className="text-sm font-semibold text-slate-900 block truncate">{store.location}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
