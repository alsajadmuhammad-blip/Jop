"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Globe } from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";

interface StoreHeroProps {
  store: Store;
}

export function StoreHero({ store }: StoreHeroProps) {
  const cleanWhatsAppNumber = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
  const whatsappHref = cleanWhatsAppNumber
    ? `https://wa.me/${cleanWhatsAppNumber.replace(/^\+/, "")}`
    : undefined;

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-200/80 mb-10">
      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="relative min-h-[320px] bg-slate-900 overflow-hidden">
          {store.coverImageUrl || store.logoUrl ? (
            <Image
              src={store.coverImageUrl || store.logoUrl || ""}
              alt={store.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center text-white">
              <Globe className="w-16 h-16 opacity-60 mb-4" />
              <p className="text-lg font-medium">لا توجد صورة متاحة</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {store.marketType || "متجر إلكتروني"}
            </Badge>
            {store.hasDelivery && (
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Truck className="w-3 h-3 ml-1" />
                توصيل
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-950 mb-4">
              {store.name}
            </h1>
            <p className="text-slate-600 leading-relaxed max-w-2xl">
              {store.description || "واجهة متجر متكاملة مع عرض واضح للمنتجات والمعلومات الأساسية."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">التقييم</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{store.reviews > 0 ? store.rating.toFixed(1) : "جديد"}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">الموقع</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{store.location || "غير محدد"}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button asChild size="lg" className="min-w-full sm:min-w-[160px]">
              <a href="#store-products">ابدأ التسوق</a>
            </Button>
            {whatsappHref ? (
              <Button asChild size="lg" variant="outline" className="min-w-full sm:min-w-[160px]">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  تواصل معنا
                </a>
              </Button>
            ) : (
              <Button size="lg" variant="outline" className="min-w-full sm:min-w-[160px]" disabled>
                تواصل معنا
              </Button>
            )}
            <StoreRatingDialogWrapper
              storeId={store.id}
              storeName={store.name}
              ownerId={store.ownerId}
              buttonClassName="min-w-full sm:min-w-[160px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
