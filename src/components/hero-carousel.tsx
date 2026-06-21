"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { HeroCarouselItem } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  heroCarouselItems: HeroCarouselItem[];
}

export function HeroCarousel({ heroCarouselItems }: HeroCarouselProps) {
  const router = useRouter();
  const autoplay = useRef(
    Autoplay({ delay: 4500, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false, dragFree: false },
    [autoplay.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleSlideClick = (item: HeroCarouselItem) => {
    if (item.storeId) router.push(`/store?id=${item.storeId}`);
  };

  if (!heroCarouselItems || heroCarouselItems.length === 0) {
    return (
      <div className="w-full aspect-[16/7] bg-muted/40 flex items-center justify-center rounded-2xl">
        <p className="text-muted-foreground text-sm">لا توجد إعلانات لعرضها</p>
      </div>
    );
  }

  const single = heroCarouselItems.length === 1;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden group select-none">
      {/* الـ viewport — يجب أن يكون overflow-hidden */}
      <div className="overflow-hidden w-full" ref={emblaRef}>
        {/* الـ container — flex بدون wrap */}
        <div className="flex" style={{ touchAction: "pan-y" }}>
          {heroCarouselItems.map((item, index) => (
            <div
              key={item.id ?? index}
              /* flex: 0 0 100% — كل سلايد يأخذ عرض الـ viewport كاملاً */
              className="relative flex-none w-full aspect-[16/7]"
              onClick={() => handleSlideClick(item)}
            >
              <Image
                src={item.src}
                alt={item.text || "إعلان"}
                fill
                className={cn(
                  "object-cover",
                  item.storeId ? "cursor-pointer" : "cursor-default"
                )}
                priority={index === 0}
                quality={85}
                sizes="(max-width: 768px) 100vw, 900px"
                draggable={false}
              />
              {/* طبقة نص اختيارية */}
              {item.text && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-5 py-4 pointer-events-none">
                  <p className="text-white text-sm font-semibold drop-shadow">{item.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* أزرار السهم — تظهر عند hover وعند تعدد السلايدات */}
      {!single && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="السابق"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            aria-label="التالي"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </>
      )}

      {/* نقاط المؤشر */}
      {!single && scrollSnaps.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`انتقل للسلايد ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300 pointer-events-auto",
                i === selectedIndex
                  ? "w-5 h-2 bg-white"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
