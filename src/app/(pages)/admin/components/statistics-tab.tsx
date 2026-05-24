"use client";

import type { Store, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function StatisticsTab({ stores, representatives }: { stores: Store[]; representatives: User[] }) {
  const ordersCount = 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>إحصائيات المنصة</CardTitle>
        <CardDescription>نظرة عامة على أهم الأرقام في المنصة.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <span className="text-3xl font-bold text-primary">{stores.length}</span>
            <span className="mt-2 text-muted-foreground">عدد المتاجر</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <span className="text-3xl font-bold text-primary">{representatives.length}</span>
            <span className="mt-2 text-muted-foreground">عدد المندوبين</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <span className="text-3xl font-bold text-primary">{ordersCount}</span>
            <span className="mt-2 text-muted-foreground">عدد الطلبات</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <span className="text-3xl font-bold text-primary">{stores.filter((store) => store.isActive).length}</span>
            <span className="mt-2 text-muted-foreground">المتاجر النشطة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
