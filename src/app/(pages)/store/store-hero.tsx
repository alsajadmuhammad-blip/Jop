"use client";

import Image from "next/image";
import { memo, useMemo, useState, useEffect, useRef } from "react";
import {
  Truck, Globe, ShoppingCart, MessageSquare,
  Star, MapPin, Clock, Package,
} from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";

/* ─────────────────────────────────────────
   ثوابت
───────────────────────────────────────── */
const HEADER_H  = 56;    // ارتفاع الهيدر الثابت (h-14)
const COVER_H   = 240;   // ارتفاع صورة الغلاف المرئية px
const OVERLAP   = 32;    // مقدار تداخل الورقة البيضاء مع الصورة

/* ─────────────────────────────────────────
   تحويل ساعة → عربي صباحاً/مساءً
───────────────────────────────────────── */
function arabicN(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}
function fmtHour(h: number): string {
  if (h === 0)  return "١٢ م.ليل";
  if (h === 12) return "١٢ ظهراً";
  if (h < 12)   return `${arabicN(h)} صباحاً`;
  return `${arabicN(h - 12)} مساءً`;
}

/* ─────────────────────────────────────────
   هل المتجر مفتوح الآن؟
───────────────────────────────────────── */
function computeIsOpen(store: Store): boolean {
  if (!store.businessHours) return store.isActive;
  const h = new Date().getHours();
  const { open, close } = store.businessHours;
  return close > open ? (h >= open && h < close) : (h >= open || h < close);
}

/* ─────────────────────────────────────────
   Props
───────────────────────────────────────── */
interface StoreHeroProps {
  store: Store;
  productCount: number;
}

/* ═════════════════════════════════════════
   المكوّن الرئيسي
═════════════════════════════════════════ */
function StoreHeroContent({ store, productCount }: StoreHeroProps) {
  /* حالة المتجر — client-only لتجنّب hydration mismatch */
  const [isOpen, setIsOpen] = useState(store.isActive);
  useEffect(() => { setIsOpen(computeIsOpen(store)); }, [store]);

  /* refs للتحكم المباشر بـ DOM بدون re-render */
  const coverRef  = useRef<HTMLDivElement>(null);
  const innerRef  = useRef<HTMLDivElement>(null); // الصورة الداخلية للـ parallax

  /* ─── ضبط top الصورة ديناميكياً حسب ارتفاع الهيدر الفعلي ─── */
  useEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;

    const applyHeaderOffset = () => {
      const header = document.querySelector("header");
      const h = header ? header.getBoundingClientRect().height : HEADER_H;
      cover.style.top = `${h}px`;
    };

    applyHeaderOffset();
    window.addEventListener("resize", applyHeaderOffset);
    return () => window.removeEventListener("resize", applyHeaderOffset);
  }, []);

  /* ─── تأثير السكرول — parallax + إخفاء ─── */
  useEffect(() => {
    const cover = coverRef.current;
    const inner = innerRef.current;
    if (!cover) return;

    const onScroll = () => {
      const s = window.scrollY;

      /* parallax: الصورة ترتفع للأعلى أبطأ من المحتوى — تعطي عمقاً */
      if (inner) {
        const shift = Math.min(s * 0.3, COVER_H * 0.5);
        inner.style.transform = `translateY(-${shift}px)`;
      }

      /* أخفِ الصورة عندما تُغطّيها الورقة البيضاء تماماً */
      cover.style.visibility = s > COVER_H ? "hidden" : "visible";
    };

    /* نفّذ مباشرة عند التحميل (قد يكون الصفحة مُمرَّرة مسبقاً) */
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* قيم ثابتة لا تتغير */
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

  const secondaryCount = [info.waHref, info.isPhys && info.hasCoords, true].filter(Boolean).length;

  return (
    <>
      {/* ══════════════════════════════════════════
          صورة الغلاف — Fixed خلف المحتوى
          المحتوى يتمرّر فوقها كالستارة
      ══════════════════════════════════════════ */}
      <div
        ref={coverRef}
        style={{
          position: "fixed",
          top: HEADER_H,
          left: 0,
          right: 0,
          height: COVER_H,
          zIndex: 0,
          overflow: "hidden",
          willChange: "visibility",
        }}
      >
        {/* الصورة مع parallax */}
        <div
          ref={innerRef}
          className="absolute inset-0 will-change-transform"
          style={{ top: "-20%", height: "140%" }} /* مساحة إضافية لـ parallax */
        >
          {store.coverImageUrl ? (
            store.coverImageUrl.startsWith("data:") ? (
              <img
                src={store.coverImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={store.coverImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
                quality={85}
              />
            )
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: "linear-gradient(135deg,#0f2460 0%,#1e3a8a 45%,#2563eb 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>
          )}
        </div>

        {/* تدرّج سفلي */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* شارة الحالة */}
        <div className="absolute bottom-5 left-4 z-10">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md border ${
              isOpen
                ? "bg-emerald-500/30 border-emerald-400/40 text-emerald-100"
                : "bg-black/40 border-white/20 text-white/55"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOpen ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
              }`}
            />
            {isOpen ? "مفتوح الآن" : "مغلق الآن"}
          </div>
        </div>
      </div>

      {/* مسافة لحفظ الارتفاع في تدفق الصفحة */}
      <div style={{ height: COVER_H }} aria-hidden="true" />

      {/* ══════════════════════════════════════════
          ورقة المحتوى — تنزلق فوق الصورة
          كستارة تغلق من الأسفل للأعلى
      ══════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          marginTop: -OVERLAP,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          background: "white",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* ── هوية المتجر ── */}
        <div className="px-4 sm:px-5 pt-5 pb-5">

          {/* اللوغو + التقييم */}
          <div className="flex items-start justify-between mb-3">
            <div
              className="relative w-20 h-20 rounded-2xl border-4 border-white bg-white overflow-hidden flex-shrink-0 -mt-14"
              style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }}
            >
              {store.logoUrl ? (
                store.logoUrl.startsWith("data:") ? (
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <Image
                    src={store.logoUrl}
                    alt={store.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                    priority
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-100">
                  <Globe className="w-8 h-8 text-primary/40" />
                </div>
              )}
            </div>

            {store.reviews > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-black text-amber-700">
                  {store.rating.toFixed(1)}
                </span>
                <span className="text-[11px] text-amber-500 font-medium">
                  ({store.reviews})
                </span>
              </div>
            )}
          </div>

          {/* اسم المتجر + التصنيف */}
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {store.name}
          </h1>
          {store.marketType && (
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              {store.marketType}
            </p>
          )}

          {/* تفاصيل مدمجة — سطر واحد هادئ */}
          {(info.hoursText || store.location || store.hasDelivery) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
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
            </div>
          )}

          {/* إحصائيات مبسّطة */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <StatCard
              icon={<Package className="w-4 h-4 text-primary" />}
              value={String(productCount)}
              label="منتج"
            />
            <StatCard
              icon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              value={store.reviews > 0 ? store.rating.toFixed(1) : "—"}
              label="تقييم"
            />
          </div>
        </div>

        {/* ── أزرار التفاعل ── */}
        <div className="px-4 sm:px-5 pb-6">
          <a
            href="#store-products"
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl font-black text-base text-white mb-2.5"
            style={{
              height: 52,
              background: "linear-gradient(135deg,#1e40af 0%,#2563eb 60%,#3b82f6 100%)",
              boxShadow: "0 6px 24px rgba(37,99,235,0.30)",
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            تسوق الآن
          </a>

          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${secondaryCount}, 1fr)` }}
          >
            {info.waHref && (
              <a
                href={info.waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-11 rounded-2xl font-bold text-[13px] text-white"
                style={{ background: "#25D366", boxShadow: "0 4px 14px rgba(37,211,102,0.25)" }}
              >
                <MessageSquare className="w-4 h-4" />
                واتساب
              </a>
            )}
            {info.isPhys && info.hasCoords && (
              <a
                href={info.mapsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-11 rounded-2xl font-bold text-[13px] text-white bg-slate-800"
                style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
              >
                <MapPin className="w-4 h-4" />
                الخريطة
              </a>
            )}
            <StoreRatingDialogWrapper
              storeId={store.id}
              storeName={store.name}
              ownerId={store.ownerId}
              buttonClassName="w-full h-11 rounded-2xl font-bold text-[13px]"
            />
          </div>
        </div>

        <div className="h-px bg-slate-100" />
      </div>
    </>
  );
}

/* ─── بطاقة إحصائية صغيرة ─── */
function StatCard({
  icon, value, label,
}: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
      {icon}
      <div>
        <p className="text-base font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export const StoreHero = memo(StoreHeroContent);
