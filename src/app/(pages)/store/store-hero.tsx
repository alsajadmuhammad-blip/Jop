"use client";

import Image from "next/image";
import { useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Truck, Globe, ShoppingCart, MessageSquare, Star, Map } from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import type { Store } from "@/lib/types";

interface StoreHeroProps {
  store: Store;
}

function StoreHeroContent({ store }: StoreHeroProps) {
  const storeInfo = useMemo(() => {
    const cleanWhatsAppNumber = store.whatsappNumber?.replace(/[^0-9+]/g, "") || "";
    const whatsappHref = cleanWhatsAppNumber
      ? `https://wa.me/${cleanWhatsAppNumber.replace(/^\+/, "")}`
      : undefined;

    const isPhysicalStore = store.type === "فعلي";
    const hasLocation = isPhysicalStore && Boolean(store.latitude && store.longitude);
    const mapsUrl = hasLocation
      ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}`
      : undefined;

    return { whatsappHref, isPhysicalStore, hasLocation, mapsUrl };
  }, [store.whatsappNumber, store.type, store.latitude, store.longitude]);

  return (
    <section 
      className="overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl shadow-slate-900/15 mb-10"
      style={{ contain: 'layout style paint' }}
    >
      <div className="relative isolate overflow-hidden">
        <div 
          className="absolute -left-20 -top-10 h-72 w-72 rounded-full bg-primary/10" 
          style={{ pointerEvents: 'none' }} 
        />
        <div 
          className="absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-cyan-500/5" 
          style={{ pointerEvents: 'none' }} 
        />
        
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div 
            className="relative min-h-[380px] bg-slate-800 overflow-hidden rounded-lg"
          >
            {store.coverImageUrl ? (
              <Image
                src={store.coverImageUrl}
                alt={store.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={true}
                quality={80}
                decoding="async"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-700 p-8">
                <Globe className="w-20 h-20 opacity-30 text-white" />
              </div>
            )}
            
            <div 
              className="absolute left-6 top-6 rounded-lg bg-white/10 p-2 border border-white/20"
            >
              <div 
                className="relative h-16 w-16 rounded-lg overflow-hidden bg-slate-700"
              >
                {store.logoUrl ? (
                  <Image 
                    src={store.logoUrl} 
                    alt={store.name} 
                    fill 
                    className="object-cover"
                    decoding="async"
                    quality={75}
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
                  className="rounded-lg bg-white/10 p-3 border border-white/10 flex flex-col items-center justify-center hover:bg-white/15 transition-colors"
                >
                  <Star className="w-4 h-4 text-amber-300 mb-1" />
                  <span className="text-lg font-bold">{store.reviews > 0 ? store.rating.toFixed(1) : "-"}</span>
                  <span className="text-xs text-white/60 mt-1">تقييم</span>
                </div>
                
                <div 
                  className="rounded-lg bg-white/10 p-3 border border-white/10 flex flex-col items-center justify-center hover:bg-white/15 transition-colors"
                >
                  <Truck className={`w-4 h-4 mb-1 ${store.isActive ? "text-green-400" : "text-red-400"}`} />
                  <span className="text-sm font-semibold">{store.isActive ? "نشط" : "مغلق"}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Button 
                asChild 
                size="lg" 
                className="w-full bg-primary text-white hover:bg-primary/90 font-bold flex items-center justify-center gap-2 h-12 active:scale-95"
              >
                <a href="#store-products" aria-label="ابدأ التسوق">
                  <ShoppingCart className="w-5 h-5" />
                  <span>ابدأ التسوق</span>
                </a>
              </Button>
              
              <div className={storeInfo.isPhysicalStore ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
                {storeInfo.isPhysicalStore && (
                  storeInfo.hasLocation ? (
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full rounded-full bg-primary text-white hover:bg-primary/90 font-semibold flex items-center justify-center gap-2 h-12"
                    >
                      <a href={storeInfo.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="الموقع على الخريطة">
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
                {storeInfo.whatsappHref ? (
                  <Button 
                    asChild 
                    size="lg" 
                    className="w-full rounded-full bg-primary text-white hover:bg-primary/90 font-semibold flex items-center justify-center gap-2 h-12"
                  >
                    <a href={storeInfo.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="واتساب">
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

export const StoreHero = memo(StoreHeroContent);
