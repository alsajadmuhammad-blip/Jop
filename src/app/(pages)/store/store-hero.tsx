"use client";

import Image from "next/image";
import { memo, useMemo } from "react";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, MapPin, Clock, Package,
} from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";

interface StoreHeroProps {
  store: Store;
  productCount: number;
}

function StoreHeroContent({ store, productCount }: StoreHeroProps) {
  const info = useMemo(() => {
    const cleanWA = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
    const whatsappHref = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;
    const isPhysical = store.type === "فعلي";
    const hasCoords = isPhysical && Boolean(store.latitude && store.longitude);
    const mapsUrl = hasCoords ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}` : undefined;
    const hoursText = store.businessHours
      ? `${String(store.businessHours.open).padStart(2, "0")}:00 – ${String(store.businessHours.close).padStart(2, "0")}:00`
      : null;
    return { whatsappHref, isPhysical, hasCoords, mapsUrl, hoursText };
  }, [store]);

  return (
    <>
      {/* ═══════════════════════════════
          صورة الغلاف
      ═══════════════════════════════ */}
      <div className="relative w-full bg-slate-900 overflow-hidden" style={{ height: "240px" }}>
        {store.coverImageUrl ? (
          store.coverImageUrl.startsWith("data:") ? (
            <img src={store.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image
              src={store.coverImageUrl} alt="" fill
              className="object-cover" sizes="100vw" priority quality={85}
            />
          )
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg,#0f2460 0%,#1e3a8a 40%,#2563eb 100%)" }}
          >
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "22px 22px" }}
            />
          </div>
        )}

        {/* تدرج من الأسفل */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* شارة الحالة — أعلى اليسار */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md border ${
            store.isActive
              ? "bg-emerald-500/25 border-emerald-400/40 text-emerald-200"
              : "bg-black/35 border-white/20 text-white/60"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${store.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            {store.isActive ? "مفتوح الآن" : "مغلق"}
          </div>
        </div>

        {/* شارات الخدمات — أعلى اليمين */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 items-end">
          {store.hasDelivery && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md bg-white/15 border border-white/20 text-white">
              <Truck className="w-3 h-3" />
              توصيل
            </div>
          )}
          {info.hoursText && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold backdrop-blur-md bg-white/15 border border-white/20 text-white">
              <Clock className="w-3 h-3" />
              {info.hoursText}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════
          هوية المتجر
      ═══════════════════════════════ */}
      <div className="bg-white px-4 sm:px-5 pb-4">

        {/* اللوغو */}
        <div className="flex items-start justify-between -mt-12 mb-4">
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.16)" }}
          >
            {store.logoUrl ? (
              store.logoUrl.startsWith("data:") ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <Image src={store.logoUrl} alt={store.name} fill className="object-contain p-1.5" sizes="96px" priority />
              )
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
                <Globe className="w-9 h-9 text-primary/40" />
              </div>
            )}
          </div>

          {/* التقييم — أعلى اليسار بجوار اللوغو */}
          {store.reviews > 0 && (
            <div className="mt-14 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-black text-amber-700">{store.rating.toFixed(1)}</span>
              <span className="text-[11px] text-amber-500 font-medium">({store.reviews})</span>
            </div>
          )}
        </div>

        {/* اسم المتجر */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
          {store.name}
        </h1>

        {/* نوع النشاط */}
        {store.marketType && (
          <p className="text-sm text-slate-400 font-medium mt-1">{store.marketType}</p>
        )}

        {/* الموقع */}
        {info.isPhysical && store.location && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="line-clamp-1">{store.location}</span>
          </div>
        )}

        {/* شريط الإحصائيات */}
        <div className="grid grid-cols-3 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden mt-4">
          <StatCell icon={<Package className="w-4 h-4 text-primary" />} value={String(productCount)} label="منتج" />
          <StatCell
            icon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
            value={store.reviews > 0 ? store.rating.toFixed(1) : "—"}
            label="التقييم" border
          />
          <StatCell
            icon={<Truck className="w-4 h-4 text-emerald-500" />}
            value={store.hasDelivery ? "متاح" : "—"}
            label="توصيل" border
          />
        </div>
      </div>

      {/* ═══════════════════════════════
          أزرار التفاعل
      ═══════════════════════════════ */}
      <div className="bg-white px-4 sm:px-5 pb-5 pt-1">
        <a
          href="#store-products"
          className="flex items-center justify-center gap-2.5 w-full rounded-2xl font-black text-base text-white mb-2.5"
          style={{
            height: "52px",
            background: "linear-gradient(135deg,#1e40af 0%,#2563eb 60%,#3b82f6 100%)",
            boxShadow: "0 6px 24px rgba(37,99,235,0.35)"
          }}
        >
          <ShoppingCart className="w-5 h-5" />
          تسوق الآن
        </a>

        {/* الأزرار الثانوية */}
        {(info.whatsappHref || (info.isPhysical && info.hasCoords)) && (
          <div className="grid gap-2" style={{
            gridTemplateColumns: `repeat(${
              [info.whatsappHref, info.isPhysical && info.hasCoords, true].filter(Boolean).length
            }, 1fr)`
          }}>
            {info.whatsappHref && (
              <a
                href={info.whatsappHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-12 rounded-2xl font-bold text-[13px] text-white"
                style={{ background: "#25D366", boxShadow: "0 4px 14px rgba(37,211,102,0.28)" }}
              >
                <MessageSquare className="w-4 h-4" />
                واتساب
              </a>
            )}
            {info.isPhysical && info.hasCoords && (
              <a
                href={info.mapsUrl!} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-12 rounded-2xl font-bold text-[13px] text-white bg-slate-800"
                style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
              >
                <MapPin className="w-4 h-4" />
                الخريطة
              </a>
            )}
            <StoreRatingDialogWrapper
              storeId={store.id}
              storeName={store.name}
              ownerId={store.ownerId}
              buttonClassName="w-full h-12 rounded-2xl font-bold text-[13px]"
            />
          </div>
        )}

        {/* زر التقييم فقط عندما لا توجد أزرار أخرى */}
        {!info.whatsappHref && !(info.isPhysical && info.hasCoords) && (
          <StoreRatingDialogWrapper
            storeId={store.id}
            storeName={store.name}
            ownerId={store.ownerId}
            buttonClassName="w-full h-12 rounded-2xl font-bold text-[13px]"
          />
        )}
      </div>

      <div className="h-px bg-slate-100" />
    </>
  );
}

function StatCell({
  icon, value, label, border,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  border?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-3 gap-0.5 ${border ? "border-r border-slate-200" : ""}`}>
      {icon}
      <p className="text-base font-black text-slate-900 mt-1">{value}</p>
      <p className="text-[10px] text-slate-400 font-semibold">{label}</p>
    </div>
  );
}

export const StoreHero = memo(StoreHeroContent);
