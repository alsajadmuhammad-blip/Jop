"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Globe, ExternalLink } from "lucide-react";
import type { Store } from "@/lib/types";

interface StoreContactSidebarProps {
  store: Store;
}

export function StoreContactSidebar({ store }: StoreContactSidebarProps) {
  const hasLocation = Boolean(store.latitude && store.longitude);
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/?q=${store.latitude},${store.longitude}`
    : undefined;
  const hasContact = Boolean(store.whatsappNumber || hasLocation || store.marketType || store.type);

  if (!hasContact) return null;

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="space-y-3 p-5">
        {store.whatsappNumber && (
          <Button asChild className="w-full h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 text-sm">
            <a href={`https://wa.me/${store.whatsappNumber.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer">
              <Phone className="w-5 h-5" />
              <span>تواصل عبر واتساب</span>
            </a>
          </Button>
        )}

        {hasLocation && mapsUrl && (
          <Button asChild className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 text-sm">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-5 h-5" />
              <span>موقعنا على الخريطة</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}

        {store.location && (
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <MapPin className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-600 font-semibold uppercase">العنوان</span>
              <span className="font-semibold text-slate-900 text-sm mt-1">{store.location}</span>
            </div>
          </div>
        )}

        {(store.marketType || store.type) && (
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-primary font-semibold uppercase">نوع المتجر</span>
              <span className="font-bold text-primary text-sm mt-0.5">{store.marketType || store.type || "-"}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
