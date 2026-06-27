/**
 * Store Orders Tab Component
 * Displays all orders for the store and allows status updates
 */

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/lib/types";
import { fetchStoreOrders, updateOrderStatus } from "@/services/orders";
import { ShoppingCart, Phone, Clock } from "lucide-react";

const statusLabels: Record<OrderStatus, string> = {
  "pending": "في الانتظار",
  "accepted": "تم القبول",
  "preparing": "قيد التجهيز",
  "ready_for_pickup": "جاهز للاستلام",
  "delivering": "قيد التوصيل",
  "delivered": "تم التسليم",
  "cancelled": "ملغى",
};

const statusColors: Record<OrderStatus, string> = {
  "pending": "bg-yellow-100 text-yellow-800",
  "accepted": "bg-primary/10 text-primary",
  "preparing": "bg-purple-100 text-purple-800",
  "ready_for_pickup": "bg-orange-100 text-orange-800",
  "delivering": "bg-cyan-100 text-cyan-800",
  "delivered": "bg-green-100 text-green-800",
  "cancelled": "bg-red-100 text-red-800",
};

interface StoreOrdersTabProps {
  storeId: string;
}

export function StoreOrdersTab({ storeId }: StoreOrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, [storeId]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const fetchedOrders = await fetchStoreOrders(storeId);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحميل الطلبات",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? updatedOrder : order))
        );
        toast({
          title: "تم تحديث الحالة بنجاح",
          description: `حالة الطلب الآن: ${statusLabels[newStatus]}`,
        });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحديث حالة الطلب",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getNextPossibleStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const statusFlow: Record<OrderStatus, OrderStatus[]> = {
      "pending": ["accepted", "cancelled"],
      "accepted": ["preparing", "cancelled"],
      "preparing": ["ready_for_pickup", "delivering", "cancelled"],
      "ready_for_pickup": ["delivering", "cancelled"],
      "delivering": ["delivered", "cancelled"],
      "delivered": [],
      "cancelled": [],
    };
    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 rounded-lg bg-muted/40 border-2 border-dashed">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" strokeWidth={1} />
        <h2 className="mt-4 text-xl font-semibold">لا توجد طلبات حالياً</h2>
        <p className="mt-2 text-muted-foreground">
          لم تتلقَ أي طلبات بعد. انتظر وصول أول طلب!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">الطلبات</h2>
          <p className="text-muted-foreground">
            إجمالي الطلبات: {orders.length}
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders} disabled={loading}>
          تحديث
        </Button>
      </div>

      <div className="space-y-4">
        {orders.map((order, index) => {
          const orderNumber = orders.length - index;
          return (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    طلب #{orderNumber}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(order.createdAt).toLocaleString("ar-EG")}
                  </div>
                </div>
                <Badge className={statusColors[order.status]}>
                  {statusLabels[order.status]}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">اسم العميل</p>
                  <p className="font-semibold">
                    {order.customerName || "عميل"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">رقم الهاتف</p>
                  <a
                    href={`https://wa.me/${order.customerPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {order.customerPhone}
                  </a>
                </div>
              </div>

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
                  <div className="border-t pt-2 flex justify-between font-bold text-sm">
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

              {/* Status Update */}
              <div>
                <p className="text-sm font-semibold mb-2">تحديث حالة الطلب:</p>
                <div className="flex flex-wrap gap-2">
                  {getNextPossibleStatuses(order.status).length > 0 ? (
                    getNextPossibleStatuses(order.status).map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        size="sm"
                        variant="outline"
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                      >
                        {statusLabels[nextStatus]}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      هذا الطلب محفوظ في الحالة النهائية
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
