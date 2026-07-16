"use client";

import { memo } from "react";
import { Star, MapPin, Truck, Clock, Globe, Package, Phone, ChevronDown } from "lucide-react";
import type { Store } from "@/lib/types";
import { useState } from "react";

interface StoreInfoSidebarProps { store: Store }

function StoreInfoSidebarContent({ store }: StoreInfoSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  function arabicDigits(n: number): string {
    return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
  }
  function fmtHour(h: number): string {
    if (h === 0)  return "١٢ منتصف ليل";
    if (h === 12) return "١٢ ظهراً";
    if (h < 12)   return `${arabicDigits(h)} صباحاً`;
    return `${arabicDigits(h - 12)} مساءً`;
  }
  const hoursText = store.businessHours
    ? `${fmtHour(store.businessHours.open)} – ${fmtHour(store.businessHours.close)}`
    : null;

  const productLimit = store.productLimit >= Number.MAX_SAFE_INTEGER ? "غير محدود" : `${store.productLimit} منتج`;
  const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
  const whatsappHref = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;

  const rows = [
    store.reviews > 0 && {
      icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />,
      label: "التقييم",
      value: `${store.rating.toFixed(1)} / 5`,
      sub: `${store.reviews} تقييم`,
      bg: "bg-amber-50 text-amber-600",
    },
    hoursText && {
      icon: <Clock className="w-4 h-4 text-violet-500" />,
      label: "ساعات العمل",
      value: hoursText,
      bg: "bg-violet-50 text-violet-600",
    },
    store.location && {
      icon: <MapPin className="w-4 h-4 text-rose-500" />,
      label: "الموقع",
      value: store.location,
      bg: "bg-rose-50 text-rose-600",
    },
    store.hasDelivery && {
      icon: <Truck className="w-4 h-4 text-emerald-500" />,
      label: "خدمة التوصيل",
      value: "متوفرة",
      bg: "bg-emerald-50 text-emerald-600",
    },
    (store.marketType || store.type) && {
      icon: <Globe className="w-4 h-4 text-sky-500" />,
      label: "نشاط المتجر",
      value: store.marketType || store.type,
      bg: "bg-sky-50 text-sky-600",
    },
    {
      icon: <Package className="w-4 h-4 text-blue-500" />,
      label: "سعة المنتجات",
      value: productLimit,
      bg: "bg-blue-50 text-blue-600",
    },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string; value: string; sub?: string; bg: string }>;

  return (
    <div className="space-y-3">
      {/* معلومات المتجر */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {/* رأس قابل للطي على الموبايل */}
        <button
          className="lg:cursor-default w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-50 bg-slate-50/80 text-right"
          onClick={() => setExpanded(v => !v)}
        >
          <span className="text-sm font-bold text-slate-700">معلومات المتجر</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform lg:hidden ${expanded ? "rotate-180" : ""}`} />
        </button>

        <div className={`divide-y divide-slate-50/80 ${expanded ? "block" : "hidden lg:block"}`}>
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${row.bg}`}>
                {row.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-400 font-medium mb-0.5">{row.label}</p>
                <p className="text-sm font-bold text-slate-800 break-words leading-snug">
                  {row.value}
                  {row.sub && <span className="text-xs font-normal text-slate-400 mr-1">{row.sub}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* وصف المتجر */}
      {store.description && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/80">
            <h2 className="text-sm font-bold text-slate-700">عن المتجر</h2>
          </div>
          <p className="px-4 py-3.5 text-sm text-slate-600 leading-relaxed">{store.description}</p>
        </div>
      )}

      {/* زر واتساب ديسكتوب */}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98]"
          style={{ background: "var(--store-accent)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
        >
          <Phone className="w-4 h-4" />
          تواصل عبر واتساب
        </a>
      )}
    </div>
  );
}

export const StoreInfoSidebar = memo(StoreInfoSidebarContent);
