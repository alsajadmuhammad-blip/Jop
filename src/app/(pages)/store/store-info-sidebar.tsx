"use client";

import Image from "next/image";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, MapPin, Truck, Clock, Globe } from "lucide-react";
import type { Store } from "@/lib/types";

interface StoreInfoSidebarProps {
  store: Store;
}

function StoreInfoSidebarContent({ store }: StoreInfoSidebarProps) {
  const hasDelivery = Boolean(store.hasDelivery);

  return (
    <div className="space-y-4">
      {/* Header Card - Logo & Name */}
      <Card className="border-0 shadow-xl overflow-hidden" style={{ contain: 'layout style paint' }}>
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-white flex-shrink-0 border-2 border-blue-200 shadow-md" style={{ contain: 'strict' }}>
                {store.logoUrl ? <Image src={store.logoUrl} alt={store.name} fill className="object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{store.name}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">معلومات المتجر</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Accordion */}
      <Card className="border-0 shadow-lg overflow-hidden" style={{ contain: 'layout style paint' }}>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {/* Rating */}
            <AccordionItem value="rating" className="border-b border-slate-100 last:border-0">
              <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100">
                    <Star className="w-5 h-5 text-blue-600 fill-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">التقييم</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 pt-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 border border-blue-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-700 font-medium uppercase">متوسط التقييم</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">{store.reviews > 0 ? store.rating.toFixed(1) : "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700 font-medium">{store.reviews} تقييم</p>
                      {store.reviews > 0 && (
                        <div className="flex gap-0.5 mt-2 justify-end">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.round(store.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-300 text-slate-300'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Hours */}
            <AccordionItem value="hours" className="border-b border-slate-100 last:border-0">
              <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-100">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">ساعات العمل</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 pt-2">
                <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 border border-purple-200/50">
                  <p className="text-sm font-bold text-purple-900">
                    {store.businessHours ? `${store.businessHours.open.toString().padStart(2, '0')}:00 - ${store.businessHours.close.toString().padStart(2, '0')}:00` : 'غير محدد'}
                  </p>
                  <p className="text-xs text-purple-700 mt-2">توقيت عمل المتجر يومياً</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Location */}
            {store.location && (
              <AccordionItem value="location" className="border-b border-slate-100 last:border-0">
                <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">الموقع</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 pt-2">
                  <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 p-4 border border-red-200/50">
                    <p className="text-sm font-bold text-red-900 break-words">{store.location}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Delivery Status */}
            {hasDelivery && (
              <AccordionItem value="delivery" className="border-b border-slate-100 last:border-0">
                <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-100">
                      <Truck className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">خدمة التوصيل</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 pt-2">
                  <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 border border-amber-200/50">
                    <p className="text-sm font-bold text-amber-900">✓ خدمة التوصيل متوفرة</p>
                    <p className="text-xs text-amber-700 mt-2">يمكن الطلب مع التوصيل إلى عنوانك</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Store Type */}
            {(store.marketType || store.type) && (
              <AccordionItem value="type" className="border-b border-slate-100 last:border-0">
                <AccordionTrigger className="px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-100">
                      <Globe className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">نوع المتجر</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 pt-2">
                  <div className="rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50/50 p-4 border border-teal-200/50">
                    <p className="text-sm font-bold text-teal-900">{store.marketType || store.type || "-"}</p>
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
