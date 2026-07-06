"use client";

import { memo } from "react";
import { Star, MapPin, Truck, Clock, Globe, Package, CheckCircle2, Phone } from "lucide-react";
import type { Store } from "@/lib/types";

interface StoreInfoSidebarProps { store: Store }

function StoreInfoSidebarContent({ store }: StoreInfoSidebarProps) {
  const businessHoursText = store.businessHours
    ? `${String(store.businessHours.open).padStart(2, "0")}:00 – ${String(store.businessHours.close).padStart(2, "0")}:00`
    : null;

  const productLimit =
    store.productLimit >= Number.MAX_SAFE_INTEGER
      ? "غير محدود"
      : `${store.productLimit} منتج`;

  const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
  const whatsappHref = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;

  return (
    <div className="space-y-3">

      {/* ── معلومات المتجر ── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/80 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-slate-700">معلومات المتجر</h2>
        </div>

        <div className="divide-y divide-slate-50">

          {/* التقييم */}
          {store.reviews > 0 && (
            <InfoRow
              icon={<Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
              label="التقييم"
              value={`${store.rating.toFixed(1)} / 5`}
              sub={`${store.reviews} تقييم`}
              bg="bg-amber-50"
            />
          )}

          {/* ساعات العمل */}
          {businessHoursText && (
            <InfoRow
              icon={<Clock className="w-4 h-4 text-purple-500" />}
              label="ساعات العمل"
              value={businessHoursText}
              bg="bg-purple-50"
            />
          )}

          {/* الموقع */}
          {store.location && (
            <InfoRow
              icon={<MapPin className="w-4 h-4 text-rose-500" />}
              label="الموقع"
              value={store.location}
              bg="bg-rose-50"
            />
          )}

          {/* التوصيل */}
          {store.hasDelivery && (
            <InfoRow
              icon={<Truck className="w-4 h-4 text-emerald-500" />}
              label="التوصيل"
              value="خدمة توصيل متوفرة"
              bg="bg-emerald-50"
            />
          )}

          {/* نوع النشاط */}
          {(store.marketType || store.type) && (
            <InfoRow
              icon={<Globe className="w-4 h-4 text-sky-500" />}
              label="النشاط"
              value={store.marketType || store.type}
              bg="bg-sky-50"
            />
          )}

          {/* سعة المنتجات */}
          <InfoRow
            icon={<Package className="w-4 h-4 text-blue-500" />}
            label="سعة المنتجات"
            value={productLimit}
            bg="bg-blue-50"
          />
        </div>
      </div>

      {/* ── وصف المتجر ── */}
      {store.description && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/80">
            <h2 className="text-sm font-bold text-slate-700">عن المتجر</h2>
          </div>
          <p className="px-4 py-3.5 text-sm text-slate-600 leading-relaxed">{store.description}</p>
        </div>
      )}

      {/* ── زر التواصل واتساب (فقط على الديسكتوب) ── */}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98]"
          style={{ background: "#25D366", boxShadow: "0 4px 14px rgba(37,211,102,0.3)" }}
        >
          <Phone className="w-4 h-4" />
          تواصل عبر واتساب
        </a>
      )}
    </div>
  );
}

/* ── صف معلومات ─────────────────────────── */
function InfoRow({
  icon, label, value, sub, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 font-semibold mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 break-words leading-snug">
          {value}
          {sub && <span className="text-xs font-normal text-slate-400 mr-1.5">{sub}</span>}
        </p>
      </div>
    </div>
  );
}

export const StoreInfoSidebar = memo(StoreInfoSidebarContent);
