"use client";

import Image from "next/image";
import { memo, useMemo, useState, useEffect } from "react";
import {
  Truck, Globe, Star, MapPin, Clock,
} from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import { useStoreContact } from "@/contexts/store-contact-context";
import type { Store } from "@/lib/types";

function arabicN(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

function fmtHour(h: number): string {
  if (h === 0)  return "١٢ م";
  if (h === 12) return "١٢ ظ";
  if (h < 12)   return `${arabicN(h)} ص`;
  return `${arabicN(h - 12)} م`;
}

function computeIsOpen(store: Store): boolean {
  if (!store.businessHours) return store.isActive;
  const h = new Date().getHours();
  const { open, close } = store.businessHours;
  return close > open ? (h >= open && h < close) : (h >= open || h < close);
}

interface StoreHeroProps {
  store: Store;
  productCount: number;
}

function StoreHeroContent({ store, productCount: _productCount }: StoreHeroProps) {
  const [isOpen, setIsOpen] = useState(store.isActive);
  useEffect(() => { setIsOpen(computeIsOpen(store)); }, [store]);

  const { setContact, clearContact } = useStoreContact();

  const info = useMemo(() => {
    const cleanWA   = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
    const waHref    = cleanWA ? `https://wa.me/${cleanWA.replace(/^\+/, "")}` : undefined;
    const isPhys    = store.type === "فعلي";
    const hasCoords = isPhys && Boolean(store.latitude && store.longitude);
    const mapsUrl   = hasCoords
      ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}`
      : undefined;
    const hoursText = store.businessHours
      ? `${fmtHour(store.businessHours.open)} – ${fmtHour(store.businessHours.close)}`
      : null;
    return { waHref, isPhys, hasCoords, mapsUrl, hoursText };
  }, [store]);

  /* رفع بيانات التواصل للـ context ليستخدمها الهيدر السفلي */
  useEffect(() => {
    setContact({ waHref: info.waHref, mapsUrl: info.mapsUrl });
    return () => clearContact();
  }, [info.waHref, info.mapsUrl, setContact, clearContact]);

  return (
    <>
      {/* ══ صورة الغلاف — sticky بديل خفيف لـ fixed: تُثبَّت أسفل الهيدر أثناء تمرير أول 220px ثم تتحرر تلقائياً بدون أي مستمع JS ══ */}
      <div
        className="sticky z-0 h-[220px] overflow-hidden"
        style={{ top: "var(--header-h, 56px)" }}
      >
        {store.coverImageUrl ? (
          store.coverImageUrl.startsWith("data:") ? (
            <img src={store.coverImageUrl} alt="" className="w-full h-full object-cover" decoding="async" />
          ) : (
            <Image src={store.coverImageUrl} alt="" fill className="object-cover" sizes="100vw" priority quality={70} decoding="async" />
          )
        ) : (
          <div className="w-full h-full bg-[linear-gradient(135deg,#0f2460_0%,#1e3a8a_45%,#2563eb_100%)]">
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:24px_24px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        {/* شارة الحالة */}
        <div className="absolute bottom-3 left-3 z-10">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            isOpen ? "border-transparent text-white" : "border-white/15 text-white/60"
          }`} style={isOpen ? { backgroundColor: 'var(--store-primary)' } : { backgroundColor: 'rgba(15,23,42,0.45)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-300 animate-pulse" : "bg-slate-400"}`} />
            {isOpen ? "مفتوح" : "مغلق"}
          </div>
        </div>
      </div>

      {/* ══ ورقة المحتوى ══ */}
      <div className="relative z-10 -mt-[28px] rounded-t-[20px] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.09)]">

        <div className="px-4 sm:px-5 pt-4 pb-3">

          {/* صف اللوغو + اسم المتجر + زر التقييم */}
          <div className="flex items-end gap-3 mb-3">
            {/* اللوغو */}
            <div
              className="relative w-[62px] h-[62px] rounded-2xl border-[3px] border-white bg-white overflow-hidden flex-shrink-0 -mt-10 shadow-[0_4px_18px_rgba(0,0,0,0.14)]"
            >
              {store.logoUrl ? (
                store.logoUrl.startsWith("data:") ? (
                  <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <Image src={store.logoUrl} alt={store.name} fill className="object-contain p-1.5" sizes="62px" priority />
                )
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
                  <Globe className="w-6 h-6 text-primary/40" />
                </div>
              )}
            </div>

            {/* الاسم + التصنيف */}
            <div className="flex-1 min-w-0 pb-0.5">
              <h1 className="text-lg font-black text-slate-900 leading-tight truncate">{store.name}</h1>
              {store.marketType && (
                <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{store.marketType}</p>
              )}
            </div>

            {/* زر التقييم — أيقونة مدمجة */}
            <div className="pb-0.5 flex-shrink-0">
              <StoreRatingDialogWrapper
                storeId={store.id}
                storeName={store.name}
                ownerId={store.ownerId}
                buttonClassName="h-8 px-3 rounded-xl font-bold text-xs"
              />
            </div>
          </div>

          {/* معلومات المتجر — شرائح خفيفة */}
          {(info.hoursText || (info.isPhys && store.location) || store.hasDelivery || store.reviews > 0) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {info.isPhys && store.location && (
                <span className="flex items-center gap-1 text-[12px] text-slate-500">
                  <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                  {store.location}
                </span>
              )}
              {info.hoursText && (
                <span className="flex items-center gap-1 text-[12px] text-slate-500">
                  <Clock className="w-3 h-3 text-violet-400 flex-shrink-0" />
                  {info.hoursText}
                </span>
              )}
              {store.hasDelivery && (
                <span className="flex items-center gap-1 text-[12px] text-emerald-600 font-semibold">
                  <Truck className="w-3 h-3 flex-shrink-0" />
                  توصيل
                </span>
              )}
              {store.reviews > 0 && (
                <span className="flex items-center gap-1 text-[12px] text-amber-600 font-semibold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                  {store.rating.toFixed(1)}
                  <span className="text-slate-400 font-normal">({store.reviews})</span>
                </span>
              )}
            </div>
          )}

        </div>

        <div className="h-px bg-slate-100" />
      </div>
    </>
  );
}

export const StoreHero = memo(StoreHeroContent);
