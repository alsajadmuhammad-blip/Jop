"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchOrderById } from "@/services/orders";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  pending: "في الانتظار",
  accepted: "تم القبول",
  preparing: "قيد التجهيز",
  delivering: "قيد التوصيل",
  received: "تم الاستلام"
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleTrack = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const result = await fetchOrderById(orderId);
      if (result) {
        setOrder(result);
      } else {
        setOrder(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error("Error fetching order by ID", err);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل جلب بيانات الطلب. حاول لاحقاً.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">تتبع الطلب</h1>
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="أدخل رقم الطلب"
          value={orderId}
          onChange={e => setOrderId(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleTrack} disabled={loading || !orderId}>
          تتبع
        </Button>
      </div>
      {loading && <div>جاري البحث...</div>}
      {notFound && <div className="text-red-500">لم يتم العثور على طلب بهذا الرقم.</div>}
      {order && (
        <Card className="shadow-md max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>
              <span className="text-lg font-bold">{order.storeName}</span>
              <Badge className="mx-2" variant="outline">{statusLabels[order.status]}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("ar-EG")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">المجموع: <span className="font-bold">{order.total} ر.س</span></div>
            <div className="mb-2">المنتجات:
              <ul className="list-disc pr-6">
                {order.items.map((item: any, idx: number) => (
                  <li key={idx}>{item.name} × {item.quantity}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
