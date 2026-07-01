/**
 * Store Orders Tab Component
 */

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/lib/types";
import { fetchStoreOrders, updateOrderStatus } from "@/services/orders";
import { ShoppingCart, Phone, Clock, MapPin, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState as useLocalState } from "react";

const statusLabels: Record<OrderStatus, string> = {
  pending: "في الانتظار",
  accepted: "تم القبول",
  preparing: "قيد التجهيز",
  ready_for_pickup: "جاهز للاستلام",
  delivering: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 border-purple-200",
  ready_for_pickup: "bg-orange-100 text-orange-800 border-orange-200",
  delivering: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const nextStatusMap: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "delivering", "cancelled"],
  ready_for_pickup: ["delivering", "cancelled"],
  delivering: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

function OrderCard({
  order,
  orderNumber,
  onStatusChange,
  isUpdating,
}: {
  order: Order;
  orderNumber: number;
  onStatusChange: (id: string, status: OrderStatus) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useLocalState(order.status === "pending");
  const nextStatuses = nextStatusMap[order.status] || [];
  const hasAddress = order.customerGovernorate || order.customerAddress;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${order.status === "cancelled" ? "opacity-60" : ""}`}>
      {/* Card Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-slate-900">طلب #{orderNumber}</span>
            <Badge className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{new Date(order.createdAt).toLocaleString("ar-EG")}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-600" /> : <ChevronDown className="h-4 w-4 text-slate-600" />}
        </button>
      </div>

      {/* Quick Summary (always visible) */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-3">
        {/* Customer phone */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 leading-none mb-0.5">الهاتف</p>
            <a
              href={`https://wa.me/${order.customerPhone?.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary hover:underline truncate block"
              dir="ltr"
            >
              {order.customerPhone || "—"}
            </a>
          </div>
        </div>
        {/* Governorate */}
        {hasAddress && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 leading-none mb-0.5">المحافظة</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{order.customerGovernorate || "—"}</p>
            </div>
          </div>
        )}
        {/* Total */}
        <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-slate-600">د.ع</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 leading-none mb-0.5">الإجمالي</p>
            <p className="text-sm font-bold text-slate-900">{order.totalAmount.toLocaleString()} د.ع</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50">

          {/* Customer details */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">معلومات العميل</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400 text-xs">الاسم</span>
                <p className="font-semibold text-slate-900">{order.customerName || "—"}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">الهاتف الأساسي</span>
                <a href={`https://wa.me/${order.customerPhone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline block" dir="ltr">
                  {order.customerPhone || "—"}
                </a>
              </div>
              {order.customerPhoneBackup && (
                <div>
                  <span className="text-slate-400 text-xs">الهاتف الاحتياطي</span>
                  <a href={`tel:${order.customerPhoneBackup}`} className="font-semibold text-slate-900 hover:underline block" dir="ltr">
                    {order.customerPhoneBackup}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Delivery address */}
          {hasAddress && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">عنوان التوصيل</p>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 text-sm">
                {order.customerGovernorate && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs w-16 shrink-0">المحافظة</span>
                    <span className="font-semibold text-slate-900">{order.customerGovernorate}</span>
                  </div>
                )}
                {order.customerAddress && (
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-xs w-16 shrink-0 mt-0.5">العنوان</span>
                    <span className="font-medium text-slate-800 leading-snug">{order.customerAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">المنتجات</p>
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-700">{item.productName} <span className="text-slate-400">×{item.quantity}</span></span>
                  <span className="font-semibold text-slate-900">{item.totalPrice.toLocaleString()} د.ع</span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 font-bold text-sm bg-slate-50">
                <span>الإجمالي</span>
                <span className="text-primary">{order.totalAmount.toLocaleString()} د.ع</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">ملاحظات العميل</p>
              <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">{order.notes}</p>
            </div>
          )}

          {/* Status Actions */}
          {nextStatuses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">تحديث الحالة</p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "cancelled" ? "destructive" : "outline"}
                    className={s !== "cancelled" ? "border-primary/30 text-primary hover:bg-primary hover:text-white" : ""}
                    disabled={isUpdating}
                    onClick={() => onStatusChange(order.id, s)}
                  >
                    {isUpdating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : statusLabels[s]}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {nextStatuses.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-1">الطلب في حالته النهائية</p>
          )}
        </div>
      )}
    </div>
  );
}

interface StoreOrdersTabProps {
  storeId: string;
}

export function StoreOrdersTab({ storeId }: StoreOrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadOrders(); }, [storeId]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      setOrders(await fetchStoreOrders(storeId));
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل الطلبات" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        toast({ title: "تم التحديث", description: `الحالة: ${statusLabels[newStatus]}` });
      }
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الحالة" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200">
        <ShoppingCart className="h-14 w-14 text-slate-200 mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-slate-700">لا توجد طلبات بعد</h3>
        <p className="text-sm text-slate-400 mt-1">ستظهر طلبات زبائنك هنا فور وصولها.</p>
      </div>
    );
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900">الطلبات</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{orders.length}</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {pendingCount} جديد
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading} className="gap-1.5 rounded-lg text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث
        </Button>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {orders.map((order, index) => (
          <OrderCard
            key={order.id}
            order={order}
            orderNumber={orders.length - index}
            onStatusChange={handleStatusChange}
            isUpdating={updatingOrderId === order.id}
          />
        ))}
      </div>
    </div>
  );
}
