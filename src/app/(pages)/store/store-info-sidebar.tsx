"use client";

import { memo } from "react";
import { Star, MapPin, Truck, Clock, Globe, Package } from "lucide-react";
import type { Store } from "@/lib/types";

interface StoreInfoSidebarProps { store: Store }

function StoreInfoSidebarContent({ store }: StoreInfoSidebarProps) {
  const businessHoursText = store.businessHours
    ? `${String(store.businessHours.open).padStart(2, "0")}:00 – ${String(store.businessHours.close).padStart(2, "0")}:00`
    : null;

  const rows: { icon: React.ReactNode; label: string; value: string; color: string }[] = [];

  if (store.reviews > 0) {
    rows.push({
      icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />,
      label: "التقييم",
      value: `${store.rating.toFixed(1)} / 5  (${store.reviews} تقييم)`,
      color: "bg-amber-50 border-amber-100",
    });
  }

  if (businessHoursText) {
    rows.push({
      icon: <Clock className="w-4 h-4 text-purple-500" />,
      label: "ساعات العمل",
      value: businessHoursText,
      color: "bg-purple-50 border-purple-100",
    });
  }

  if (store.location) {
    rows.push({
      icon: <MapPin className="w-4 h-4 text-rose-500" />,
      label: "الموقع",
      value: store.location,
      color: "bg-rose-50 border-rose-100",
    });
  }

  if (store.hasDelivery) {
    rows.push({
      icon: <Truck className="w-4 h-4 text-sky-500" />,
      label: "التوصيل",
      value: "خدمة التوصيل متوفرة",
      color: "bg-sky-50 border-sky-100",
    });
  }

  if (store.marketType || store.type) {
    rows.push({
      icon: <Globe className="w-4 h-4 text-teal-500" />,
      label: "النشاط",
      value: store.marketType || store.type,
      color: "bg-teal-50 border-teal-100",
    });
  }

  const productLimit =
    store.productLimit >= Number.MAX_SAFE_INTEGER
      ? "غير محدود"
      : `${store.productLimit} منتج`;

  rows.push({
    icon: <Package className="w-4 h-4 text-blue-500" />,
    label: "سعة المنتجات",
    value: productLimit,
    color: "bg-blue-50 border-blue-100",
  });

  if (rows.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-bold text-slate-700">معلومات المتجر</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-start gap-3 px-5 py-3.5">
            <div className={`flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center ${row.color}`}>
              {row.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">{row.label}</p>
              <p className="text-sm font-semibold text-slate-800 break-words leading-snug">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {store.description && (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5">عن المتجر</p>
          <p className="text-sm text-slate-600 leading-relaxed">{store.description}</p>
        </div>
      )}
    </div>
  );
}

export const StoreInfoSidebar = memo(StoreInfoSidebarContent);
