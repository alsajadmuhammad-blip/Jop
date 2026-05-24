"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { StoreRatingDialogWrapper } from "@/components/store-rating-dialog-wrapper";
import { Button } from "@/components/ui/button";
import type { Store } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

interface StoreInfoSidebarProps {
  store: Store;
}

export function StoreInfoSidebar({ store }: StoreInfoSidebarProps) {
  const { user } = useAuth();

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">معلومات المتجر</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {store.logoUrl ? (
              <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
            ) : (
              <div className="text-sm text-slate-500">بدون شعار</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{store.name}</h3>
            <p className="text-xs text-muted-foreground">{store.marketType || 'متجر إلكتروني'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">التقييم</p>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{store.reviews > 0 ? store.rating.toFixed(1) : 'جديد'}</span>
                {store.reviews > 0 && <span className="text-xs text-slate-500">({store.reviews})</span>}
              </div>
            </div>
            <StoreRatingDialogWrapper storeId={store.id} storeName={store.name} ownerId={store.ownerId} />
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground">الموقع</p>
            <p className="font-semibold">{store.location || `${store.latitude || ''}${store.longitude ? ', ' + store.longitude : ''}` || 'غير محدد'}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">التوصيل</p>
              <p className="font-semibold">{store.hasDelivery ? 'متاح' : 'غير متاح'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">الحالة</p>
              <p className={`font-semibold ${store.isActive ? 'text-green-600' : 'text-red-600'}`}>{store.isActive ? 'نشط' : 'متوقف'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
