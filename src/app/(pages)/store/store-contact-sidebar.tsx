"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MapPin, Globe } from "lucide-react";
import type { Store } from "@/lib/types";

interface StoreContactSidebarProps {
  store: Store;
}

export function StoreContactSidebar({ store }: StoreContactSidebarProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">التواصل</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {store.whatsappNumber && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Phone className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-slate-500">واتساب</p>
              <p className="text-sm font-semibold text-slate-900">{store.whatsappNumber}</p>
            </div>
          </div>
        )}

        {store.latitude && store.longitude && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
            <MapPin className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-xs text-slate-500">الموقع</p>
              <p className="text-sm font-semibold text-slate-900">{store.location || `${store.latitude}, ${store.longitude}`}</p>
            </div>
            <div className="flex-shrink-0">
              <a
                href={`geo:${store.latitude},${store.longitude}?q=${store.latitude},${store.longitude}(${encodeURIComponent(store.name)})`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-white text-sm"
              >
                افتح الخريطة
              </a>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <Globe className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-slate-500">الموقع</p>
            <p className="text-sm font-semibold text-slate-900">متجر إلكتروني</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
