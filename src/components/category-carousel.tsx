"use client"

import Link from "next/link";
import { Smartphone, Headphones, Watch, Sparkles } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import type { Category } from "@/lib/types";

const iconMap: { [key: string]: React.ElementType } = {
  "هواتف ذكية": Smartphone,
  "ملحقات": Headphones,
  "ساعات ذكية": Watch,
  "اكسسوارات": Sparkles,
};

export function CategoryCarousel({ categories }: { categories: Category[] }) {
  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
      }}
      className="w-full bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-lg p-2 md:p-4"
    >
      <div className="grid grid-cols-5 gap-1 md:hidden">
        {categories.map((category) => {
          const Icon = iconMap[category.name] || Smartphone;
          return (
            <Link key={`${category.id}-grid`} href={`/category/${category.id}`} className="block h-full group">
              <div className="h-full overflow-hidden transition-all duration-200 bg-card/50 border border-border/30 shadow-xs hover:shadow-sm hover:border-primary/40 hover:bg-card rounded-lg">
                <div className="flex flex-col items-center justify-center p-1.5 aspect-square">
                  <Icon className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                  <h3 className="mt-1 text-xs font-medium text-center text-foreground line-clamp-2">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <CarouselContent className="-mr-1 md:-mr-2 hidden md:flex">
        {categories.map((category) => {
          const Icon = iconMap[category.name] || Smartphone;
          return (
            <CarouselItem key={category.id} className="pr-1 md:pr-2 basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/7">
              <Link href={`/category/${category.id}`} className="block h-full group">
                <div className="h-full overflow-hidden transition-all duration-200 bg-card/50 border border-border/30 shadow-xs hover:shadow-sm hover:border-primary/40 hover:bg-card rounded-lg">
                  <div className="flex flex-col items-center justify-center p-2 md:p-3 aspect-square">
                    <div className="p-1.5 md:p-2 rounded-lg">
                      <Icon className="h-5 md:h-6 w-5 md:w-6 text-primary" />
                    </div>
                    <h3 className="mt-2 text-xs md:text-sm font-medium text-center text-foreground line-clamp-2">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}
