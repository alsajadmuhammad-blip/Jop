"use client";

import Image from "next/image";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, MapPin, Truck, Clock, Check, X } from "lucide-react";
import type { Store } from "@/lib/types";

interface StoreInfoSidebarProps {
  store: Store;
}

function StoreInfoSidebarContent({ store }: StoreInfoSidebarProps) {
  const hasDelivery = Boolean(store.hasDelivery);

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-xl" style={{ contain: 'layout style paint' }}>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-blue-200" style={{ contain: 'strict' }}>
              {store.logoUrl ? <Image src={store.logoUrl} alt={store.name} fill className="object-cover" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{store.name}</h3>
              <p className="text-xs text-slate-600 mt-2">معلومات المتجر</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg" style={{ contain: 'layout style paint' }}>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="rating" className="border-b border-slate-200 last:border-0">
              <AccordionTrigger className="px-5 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">التقييم</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 pt-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 border border-blue-200">
                  <span className="text-2xl font-bold text-blue-900">{store.reviews > 0 ? store.rating.toFixed(1) : "-"}</span>
                  <p className="text-xs text-blue-700 mt-1">من {store.reviews} تقييم</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="status" className="border-b border-slate-200 last:border-0">
              <AccordionTrigger className="px-5 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full ${store.isActive ? "bg-green-100" : "bg-red-100"}`}>
                    {store.isActive ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">حالة المتجر</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 pt-2">
                <div className={`rounded-lg bg-gradient-to-br p-4 border ${store.isActive ? "from-green-50 to-emerald-50 border-green-200" : "from-red-50 to-pink-50 border-red-200"}`}>
                  <span className={`text-sm font-bold block ${store.isActive ? "text-green-900" : "text-red-900"}`}>
                    {store.isActive ? "✓ المتجر نشط" : "✗ المتجر مغلق"}
                  </span>
                </div>
              </AccordionContent>
            </AccordionItem>

            {hasDelivery && (
              <AccordionItem value="delivery" className="border-b border-slate-200 last:border-0">
                <AccordionTrigger className="px-5 py-4 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">التوصيل</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 pt-2">
                  <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 border border-blue-200">
                    <span className="text-sm font-bold text-blue-900">✓ خدمة التوصيل متوفرة</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="hours" className="border-b border-slate-200 last:border-0">
              <AccordionTrigger className="px-5 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-200">
                    <Clock className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">ساعات العمل</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 pt-2">
                <div className="rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 p-4 border border-slate-200">
                  <span className="text-sm font-bold text-slate-900">
                    {store.businessHours ? `من ${store.businessHours.open.toString().padStart(2, '0')}:00 إلى ${store.businessHours.close.toString().padStart(2, '0')}:00` : 'غير محدد'}
                  </span>
                </div>
              </AccordionContent>
            </AccordionItem>

            {store.location && (
              <AccordionItem value="location" className="border-b border-slate-200 last:border-0">
                <AccordionTrigger className="px-5 py-4 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">الموقع</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 pt-2">
                  <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 p-4 border border-red-200">
                    <span className="text-sm font-bold text-red-900 break-words">{store.location}</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

export const StoreInfoSidebar = memo(StoreInfoSidebarContent);
