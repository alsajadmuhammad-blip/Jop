"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImageIcon, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];         // all images (primary first)
  alt?: string;
  priority?: boolean;
  children?: React.ReactNode; // overlay badges / buttons passed from parent
}

function GalleryImage({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  if (src.startsWith("data:")) {
    return <img src={src} alt={alt} className="w-full h-full object-cover" />;
  }
  return (
    <Image
      src={src} alt={alt} fill
      className="object-cover"
      sizes="100vw"
      priority={priority}
    />
  );
}

export function ProductGallery({ images, alt = "", priority, children }: ProductGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;
  const hasPrev = current > 0;
  const hasNext = current < total - 1;

  const go = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  // في RTL: الصورة التالية تأتي من اليسار، السابقة من اليمين
  const prev = () => hasPrev && go(current - 1);
  const next = () => hasNext && go(current + 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) < 40) return;
    // RTL: سحب لليسار (diff > 0) ← الصورة التالية
    //      سحب لليمين (diff < 0) → الصورة السابقة
    if (diff > 0) next();
    else          prev();
  };

  /* صورة واحدة فقط — بدون gallery chrome */
  if (total <= 1) {
    return (
      <div
        className="relative bg-white overflow-hidden"
        style={{ aspectRatio: "1/1", maxHeight: 420 }}
      >
        {images[0] ? (
          <GalleryImage src={images[0]} alt={alt} priority={priority} />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <ImageIcon className="w-20 h-20 text-slate-200" />
          </div>
        )}
        {children}
      </div>
    );
  }

  /* معرض متعدد الصور */
  return (
    <div className="bg-white" dir="rtl">
      {/* الصورة الرئيسية مع السحب */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "1/1", maxHeight: 420 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={current}
          className="absolute inset-0"
        >
          <GalleryImage src={images[current]} alt={`${alt} ${current + 1}`} priority={current === 0 && priority} />
        </div>

        {/* تدرج علوي */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent pointer-events-none" />

        {/* أزرار السهم — شاشات كبيرة فقط (RTL: السابق يسار، التالي يمين) */}
        {hasPrev && (
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/40 backdrop-blur-sm text-white rounded-full items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={next}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/40 backdrop-blur-sm text-white rounded-full items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* عداد الصور — أعلى اليمين */}
        <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
          {current + 1} / {total}
        </div>

        {children}
      </div>

      {/* نقاط التنقل */}
      <div className="flex justify-center gap-1.5 py-2.5 bg-white">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={cn(
              "rounded-full transition-all duration-200",
              i === current
                ? "w-5 h-1.5 bg-primary"
                : "w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300"
            )}
          />
        ))}
      </div>

      {/* شريط الصور المصغّرة — RTL */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar" dir="rtl">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={cn(
              "flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-150",
              i === current
                ? "border-primary shadow-md shadow-primary/20 scale-105"
                : "border-transparent opacity-60 hover:opacity-90"
            )}
          >
            {src.startsWith("data:") ? (
              <img src={src} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image src={src} alt="" width={56} height={56} className="object-cover w-full h-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
