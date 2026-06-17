

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import type { HeroCarouselItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  heroCarouselItems: HeroCarouselItem[];
  options?: EmblaOptionsType;
}

export function HeroCarousel({ heroCarouselItems, options }: HeroCarouselProps) {
  const router = useRouter();
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, ...options }, [autoplay.current]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      if (emblaApi) {
        emblaApi.off("select", onSelect);
      }
    };
  }, [emblaApi, onSelect]);

  const handleSlideClick = (item: HeroCarouselItem) => {
    if (item.storeId) {
      router.push(`/store?id=${item.storeId}`);
    }
  };

  if (!heroCarouselItems || heroCarouselItems.length === 0) {
    return (
      <div className="relative aspect-video w-full bg-muted/50 flex items-center justify-center rounded-2xl">
        <p className="text-muted-foreground">لا توجد إعلانات لعرضها.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl shadow-2xl overflow-hidden group/carousel z-10">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {heroCarouselItems.map((item, index) => (
            <div
              className="relative basis-full flex-shrink-0 aspect-[16/8] w-full"
              key={item.id || index}
              onClick={() => handleSlideClick(item)}
            >
              <Image
                src={item.src}
                alt={item.text}
                fill
                className={cn("object-cover", item.storeId ? "cursor-pointer" : "")}
                data-ai-hint={item.hint}
                priority={index === 0}
                quality={80}
                sizes="100vw"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
