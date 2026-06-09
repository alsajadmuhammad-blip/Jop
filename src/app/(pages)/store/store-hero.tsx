"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Truck, Globe, ShoppingCart, MessageSquare, Star, MapPin, Map } from "lucide-react";
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

  const isPhysicalStore = store.type === "فعلي";
  const hasLocation = isPhysicalStore && Boolean(store.latitude && store.longitude);
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}`
    : undefined;

  return (
    <section 
      className="overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl shadow-slate-900/15 mb-10"
      style={{ contain: 'layout style paint' }}
    >
      <div className="relative isolate overflow-hidden">
        <div className="absolute -left-20 -top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" style={{ pointerEvents: 'none' }} />
        <div className="absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" style={{ pointerEvents: 'none' }} />
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="relative min-h-[380px] bg-slate-900 overflow-hidden rounded-xl" style={{ contain: 'layout style paint' }}>
            {store.coverImageUrl ? (
              <Image
                src={store.coverImageUrl}
                alt={store.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={true}
                decoding="async"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8">
                <Globe className="w-20 h-20 opacity-40 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
            <div className="absolute left-6 top-6 rounded-2xl bg-white/20 p-2 backdrop-blur-xl border border-white/30" style={{ contain: 'layout paint' }}>
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white/10">
                {store.logoUrl ? (
                  <Image 
                    src={store.logoUrl} 
                    alt={store.name} 
                    fill 
                    className="object-cover"
                    decoding="async"
                  /> 
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 text-white">
            <div className="grid gap-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{store.name}</h1>
              <div className="grid gap-3 grid-cols-2 gap-y-4">
                <div 
                  className="rounded-2xl bg-white/15 p-4 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center transition-colors duration-200 hover:bg-white/20" 
                  style={{ contain: 'layout paint' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="text-xl font-bold">{store.reviews > 0 ? store.rating.toFixed(1) : "-"}</span>
                  <span className="text-xs text-white/70 mt-1">({store.reviews} تقييم)</span>
                </div>
                <div 
                  className="rounded-2xl bg-white/15 p-4 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center transition-colors duration-200 hover:bg-white/20" 
                  style={{ contain: 'layout paint' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className={`w-4 h-4 ${store.isActive ? "text-green-400" : "text-red-400"}`} />
                  </div>
                  <span className="text-sm font-semibold">{store.isActive ? "نشط" : "مغلق"}</span>
                  <span className="text-xs text-white/70 mt-1">{store.isActive ? "متاح الآن" : "غير متاح"}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Button 
                asChild 
                size="lg" 
                className="w-full bg-primary text-white hover:bg-primary/90 font-bold flex items-center justify-center gap-2 h-12 transition-colors duration-200 active:scale-95"
                style={{ transform: 'translateZ(0)' }}
              >
                <a href="#store-products" aria-label="ابدأ التسوق">
                  <ShoppingCart className="w-5 h-5" />
                  <span>ابدأ التسوق</span>
                </a>
              </Button>
              <div className={isPhysicalStore ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
                {isPhysicalStore && (
                  hasLocation ? (
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full rounded-full bg-primary text-white hover:bg-primary/90 font-semibold flex items-center justify-center gap-2 h-12 transition-colors duration-200"
                      style={{ transform: 'translateZ(0)' }}
                    >
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="الموقع على الخريطة">
                        <Map className="w-4 h-4 text-slate-950" />
                        <span className="text-sm">الخريطة</span>
                      </a>
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="w-full rounded-full bg-primary/10 text-white/70 border border-primary/20 font-semibold flex items-center justify-center gap-2 h-12" 
                      disabled
                    >
                      <Map className="w-4 h-4" />
                      <span className="text-sm">الخريطة</span>
                    </Button>
                  )
                )}
                {whatsappHref ? (
                  <Button 
                    asChild 
                    size="lg" 
                    className="w-full rounded-full bg-primary text-white hover:bg-primary/90 font-semibold flex items-center justify-center gap-2 h-12 transition-colors duration-200"
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="واتساب">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">واتساب</span>
                    </a>
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full rounded-full bg-white/10 text-white/70 border border-white/20 font-semibold flex items-center justify-center gap-2 h-12" 
                    disabled
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">واتساب</span>
                  </Button>
                )}
              </div>
              <StoreRatingDialogWrapper
                storeId={store.id}
                storeName={store.name}
                ownerId={store.ownerId}
                buttonClassName="w-full font-semibold flex items-center justify-center gap-2 h-11"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
