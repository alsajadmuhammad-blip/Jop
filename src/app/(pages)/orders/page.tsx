"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";
import { fetchCustomerOrders } from "@/services/orders";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Phone } from "lucide-react";

// نموذج الطلب للزبون
export type CustomerOrder = Order;

const statusLabels: Record<string, string> = {
  pending: "في الانتظار",
  accepted: "تم القبول",
  preparing: "قيد التجهيز",
  ready_for_pickup: "جاهز للاستلام",
  delivering: "قيد التوصيل",
  delivered: "تم الاستلام",
  cancelled: "ملغى",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-orange-100 text-orange-800",
  delivering: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    async function loadOrders() {
      setLoading(true);
      try {
        if (user) {
          const fetchedOrders = await fetchCustomerOrders(user.id);
          setOrders(fetchedOrders);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل تحميل الطلبات",
        });
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user, authLoading, router, toast]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
      {orders && orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      {order.storeName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      طلب #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleString("ar-EG")}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Items */}
                <div>
                  <p className="text-sm font-semibold mb-2">المنتجات:</p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-semibold">
                          {item.totalPrice.toLocaleString()} د.ع
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>الإجمالي:</span>
                      <span>{order.totalAmount.toLocaleString()} د.ع</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div>
                    <p className="text-sm font-semibold mb-1">ملاحظات:</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {order.notes}
                    </p>
                  </div>
                )}

                {/* Contact Store */}
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${order.customerPhone?.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    تواصل مع المتجر
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12 rounded-lg bg-muted/40">
          <ShoppingCart className="mx-auto h-16 w-16 mb-4" strokeWidth={1} />
          <p className="text-lg">لا توجد طلبات حالياً.</p>
          <p className="text-sm">ابدأ بإضافة منتجات إلى السلة والطلب من متجرك المفضل.</p>
        </div>
      )}
    </div>
  );
}
