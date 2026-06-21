"use client";

import Image from "next/image";
import { memo } from "react";
import { Star, MapPin, Truck, Clock, Globe, Building2, Store } from "lucide-react";
import type { Store as StoreType } from "@/lib/types";

function InfoRow({
  icon: Icon,
  label,
  value,
  color = "text-slate-500",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div className={`flex-shrink-0 mt-0.5 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words leading-snug">
          {value}
        </p>
      </div>
    </div>
  );
}

function StoreInfoSidebarContent({ store }: { store: StoreType }) {
  const isPhysical = store.type === "فعلي";

  const hoursStr = store.businessHours
    ? `${String(store.businessHours.open).padStart(2, "0")}:00 — ${String(store.businessHours.close).padStart(2, "0")}:00`
    : null;

  return (
    <div className="space-y-3">

      {/* بطاقة الهوية */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-50 dark:border-slate-800">
          {/* لوغو صغير */}
          <div className="relative w-12 h-12 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
            {store.logoUrl ? (
              <Image src={store.logoUrl} alt={store.name} fill className="object-contain p-1" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <Store className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{store.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">معلومات المتجر</p>
          </div>
        </div>

        {/* صفوف المعلومات */}
        <div className="px-4">
          {/* التقييم */}
          <div className="flex items-start gap-3 py-3 border-b border-slate-50 dark:border-slate-800">
            <Star className="w-4 h-4 mt-0.5 fill-amber-400 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-medium mb-0.5">التقييم</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {store.reviews > 0 ? store.rating.toFixed(1) : "—"}
                </span>
                {store.reviews > 0 && (
                  <>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.round(store.rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">({store.reviews})</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* نوع المتجر */}
          <InfoRow
            icon={isPhysical ? Building2 : Globe}
            label="نوع المتجر"
            value={`${store.type}${store.marketType ? " — " + store.marketType : ""}`}
            color="text-primary"
          />

          {/* ساعات العمل */}
          {hoursStr && (
            <InfoRow icon={Clock} label="ساعات العمل" value={hoursStr} color="text-purple-500" />
          )}

          {/* الموقع */}
          {store.location && (
            <InfoRow icon={MapPin} label="الموقع" value={store.location} color="text-red-500" />
          )}

          {/* التوصيل */}
          {store.hasDelivery && (
            <InfoRow icon={Truck} label="التوصيل" value="خدمة التوصيل متاحة" color="text-emerald-500" />
          )}
        </div>
      </div>

    </div>
  );
}

export const StoreInfoSidebar = memo(StoreInfoSidebarContent);
