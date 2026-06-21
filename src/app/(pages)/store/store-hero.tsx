"use client";

import Image from "next/image";
import { useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Truck, Globe, ShoppingCart, MessageSquare, Star, Map, Package } from "lucide-react";
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
      className="relative overflow-hidden mb-0"
      style={{ contain: 'layout style paint' }}
    >
      {/* Hero Background - Logo */}
      <div 
        className="relative w-full h-[300px] bg-slate-900 overflow-hidden"
      >
        {store.logoUrl ? (
          <Image
            src={store.logoUrl}
            alt={store.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority={true}
            quality={75}
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-8">
            <Globe className="w-24 h-24 opacity-15 text-white" />
          </div>
        )}
      </div>

      {/* Royal Blue spacer */}
      <div 
        className="relative w-full h-6 bg-gradient-to-b from-blue-700 to-blue-600"
      />

      {/* Card - overlays hero with minimal offset */}
      <div 
        className="relative px-4 sm:px-6 lg:px-8 -mt-6 mb-0 z-10"
      >
        <div 
          className="mx-auto max-w-7xl rounded-t-3xl bg-white overflow-hidden border border-slate-100"
          style={{
            boxShadow: '0 -5px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Store Title and Info */}
            <div className="grid gap-6 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-slate-900 mb-4">
                  {store.name}
                </h1>
                
                {/* Stats Cards */}
                <div className="grid gap-2 grid-cols-3 w-full">
                  <div 
                    className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-3 border border-amber-200/50 flex flex-col items-center justify-center hover:from-amber-100 hover:to-orange-100 transition-colors"
                  >
                    <Star className="w-4 h-4 text-amber-500 mb-1 fill-amber-500" />
                    <span className="text-base font-bold text-slate-900">{store.reviews > 0 ? store.rating.toFixed(1) : "-"}</span>
                    <span className="text-xs text-slate-600">تقييم</span>
                  </div>
                  
                  <div 
                    className={`rounded-lg p-3 border flex flex-col items-center justify-center transition-colors ${
                      store.isActive 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 hover:from-green-100 hover:to-emerald-100' 
                        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200/50 hover:from-red-100 hover:to-pink-100'
                    }`}
                  >
                    <Truck className={`w-4 h-4 mb-1 ${store.isActive ? "text-green-600 fill-green-600" : "text-red-600 fill-red-600"}`} />
                    <span className={`text-xs font-bold ${store.isActive ? 'text-green-700' : 'text-red-700'}`}>
                      {store.isActive ? "نشط" : "مغلق"}
                    </span>
                  </div>

                  <div 
                    className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 p-3 border border-blue-200/50 flex flex-col items-center justify-center hover:from-blue-100 hover:to-cyan-100 transition-colors"
                  >
                    <Package className="w-4 h-4 text-blue-600 mb-1 fill-blue-600" />
                    <span className="text-xs font-bold text-blue-700">
                      {store.hasDelivery ? "متاح" : "غير متاح"}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">توصيل</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                asChild 
                size="lg" 
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-white hover:from-primary/90 hover:to-primary/70 font-bold flex items-center justify-center gap-2 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <a href="#store-products" aria-label="ابدأ التسوق">
                  <ShoppingCart className="w-5 h-5" />
                  <span>ابدأ التسوق</span>
                </a>
              </Button>
              
              <div className={storeInfo.isPhysicalStore ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
                {storeInfo.isPhysicalStore && (
                  storeInfo.hasLocation ? (
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-semibold flex items-center justify-center gap-2 h-11 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      <a href={storeInfo.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="الموقع على الخريطة">
                        <Map className="w-4 h-4" />
                        <span className="text-sm">الخريطة</span>
                      </a>
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="w-full rounded-xl bg-slate-100 text-slate-400 border border-slate-200 font-semibold flex items-center justify-center gap-2 h-11" 
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
                    className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-semibold flex items-center justify-center gap-2 h-11 shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    <a href={storeInfo.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="واتساب">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">واتساب</span>
                    </a>
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full rounded-xl bg-slate-100 text-slate-400 border border-slate-200 font-semibold flex items-center justify-center gap-2 h-11" 
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
                buttonClassName="w-full font-semibold flex items-center justify-center gap-2 h-11 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const StoreHero = memo(StoreHeroContent);
