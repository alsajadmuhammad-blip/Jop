/**
 * Store Orders Tab Component
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/lib/types";
import { fetchStoreOrders, updateOrderStatus } from "@/services/orders";
import {
  ShoppingCart, Phone, Clock, MapPin, RefreshCw,
  ChevronDown, ChevronUp, ArrowUpDown, TrendingUp,
  CheckCircle2, XCircle, Loader2, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─────────────── Status meta ─────────────────────────────── */
const statusLabels: Record<OrderStatus, string> = {
  pending:          "في الانتظار",
  accepted:         "تم القبول",
  preparing:        "قيد التجهيز",
  ready_for_pickup: "جاهز للاستلام",
  delivering:       "قيد التوصيل",
  delivered:        "تم التسليم",
  cancelled:        "ملغى",
};

const statusColors: Record<OrderStatus, string> = {
  pending:          "bg-amber-100 text-amber-800 border-amber-200",
  accepted:         "bg-blue-100 text-blue-800 border-blue-200",
  preparing:        "bg-purple-100 text-purple-800 border-purple-200",
  ready_for_pickup: "bg-orange-100 text-orange-800 border-orange-200",
  delivering:       "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered:        "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled:        "bg-red-100 text-red-800 border-red-200",
};

const nextStatusMap: Record<OrderStatus, OrderStatus[]> = {
  pending:          ["accepted", "cancelled"],
  accepted:         ["preparing", "cancelled"],
  preparing:        ["ready_for_pickup", "delivering", "cancelled"],
  ready_for_pickup: ["delivering", "cancelled"],
  delivering:       ["delivered", "cancelled"],
  delivered:        [],
  cancelled:        [],
};

/* ─────────────── Filter tabs ─────────────────────────────── */
const FILTER_TABS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all",          label: "الكل" },
  { id: "pending",      label: "جديد" },
  { id: "accepted",     label: "مقبول" },
  { id: "preparing",    label: "يُجهَّز" },
  { id: "delivering",   label: "يُوصَّل" },
  { id: "delivered",    label: "مُسلَّم" },
  { id: "cancelled",    label: "ملغى" },
];

/* ─── مصدر الطلب: طلب تطبيق (واتساب) أو بيع فوري من الكاشير (كاش/تحويل) ─── */
type SourceFilter = "all" | "app" | "pos";
const SOURCE_TABS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "app", label: "طلبات التطبيق" },
  { id: "pos", label: "مبيعات الكاشير" },
];
function isPosOrder(order: Order): boolean {
  return order.paymentMethod === "cash" || order.paymentMethod === "transfer";
}

/* ─────────────── Sort options ────────────────────────────── */
type SortKey = "newest" | "oldest" | "highest" | "lowest";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",  label: "الأحدث أولاً" },
  { value: "oldest",  label: "الأقدم أولاً" },
  { value: "highest", label: "الأعلى سعراً" },
  { value: "lowest",  label: "الأقل سعراً" },
];

/* ─────────────── OrderCard ───────────────────────────────── */
function OrderCard({
  order,
  orderNumber,
  onStatusChange,
  isUpdating,
}: {
  order: Order;
  orderNumber: string;
  onStatusChange: (id: string, status: OrderStatus) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(order.status === "pending");
  const nextStatuses = nextStatusMap[order.status] || [];
  const hasAddress = order.customerGovernorate || order.customerAddress;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
        order.status === "cancelled" ? "opacity-60" : ""
      } ${order.status === "pending" ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-100"}`}
    >
      {/* ── Card Header ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-start justify-between gap-3 text-right hover:bg-slate-50/50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-base font-bold text-slate-900">طلب #{orderNumber}</span>
            <Badge
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[order.status]}`}
            >
              {statusLabels[order.status]}
            </Badge>
            <span
              className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${
                isPosOrder(order)
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : "bg-sky-50 text-sky-700 border-sky-200"
              }`}
            >
              {isPosOrder(order) ? "بيع فوري (كاشير)" : "طلب من التطبيق"}
            </span>
            {order.status === "pending" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                يحتاج إجراء
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(order.createdAt).toLocaleString("ar-IQ")}
            </span>
            <span className="font-bold text-slate-700">
              {order.totalAmount.toLocaleString()} د.ع
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-600" />
          )}
        </div>
      </button>

      {/* ── Quick Summary (always visible) ── */}
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
              onClick={(e) => e.stopPropagation()}
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
              <p className="text-sm font-semibold text-slate-900 truncate">
                {order.customerGovernorate || "—"}
              </p>
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
            <p className="text-sm font-bold text-slate-900">
              {order.totalAmount.toLocaleString()} د.ع
            </p>
          </div>
        </div>
      </div>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50">

          {/* Customer details */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              معلومات العميل
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400 text-xs">الاسم</span>
                <p className="font-semibold text-slate-900">{order.customerName || "—"}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">الهاتف الأساسي</span>
                <a
                  href={`https://wa.me/${order.customerPhone?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline block"
                  dir="ltr"
                >
                  {order.customerPhone || "—"}
                </a>
              </div>
              {order.customerPhoneBackup && (
                <div>
                  <span className="text-slate-400 text-xs">الهاتف الاحتياطي</span>
                  <a
                    href={`tel:${order.customerPhoneBackup}`}
                    className="font-semibold text-slate-900 hover:underline block"
                    dir="ltr"
                  >
                    {order.customerPhoneBackup}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Delivery address */}
          {hasAddress && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                عنوان التوصيل
              </p>
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
                    <span className="font-medium text-slate-800 leading-snug">
                      {order.customerAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              المنتجات
            </p>
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-700">
                    {item.productName}{" "}
                    <span className="text-slate-400">×{item.quantity}</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {item.totalPrice.toLocaleString()} د.ع
                  </span>
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                ملاحظات العميل
              </p>
              <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}

          {/* Status Actions */}
          {nextStatuses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                تحديث الحالة
              </p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "cancelled" ? "destructive" : "default"}
                    className={
                      s !== "cancelled"
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : ""
                    }
                    disabled={isUpdating}
                    onClick={() => onStatusChange(order.id, s)}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      statusLabels[s]
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {nextStatuses.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-1 flex items-center justify-center gap-1">
              {order.status === "delivered" ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> الطلب مُسلَّم بنجاح</>
              ) : (
                <><XCircle className="w-3.5 h-3.5 text-red-400" /> الطلب ملغى</>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main component ─────────────────────────── */
interface StoreOrdersTabProps {
  storeId: string;
}

export function StoreOrdersTab({ storeId }: StoreOrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

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

  /* ── Stats ── */
  const stats = useMemo(() => {
    const pending   = orders.filter((o) => o.status === "pending").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const revenue   = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const appCount = orders.filter((o) => !isPosOrder(o)).length;
    const posCount = orders.filter((o) => isPosOrder(o)).length;
    return { pending, delivered, cancelled, revenue, appCount, posCount };
  }, [orders]);

  /* ── Filter + Search + Sort ── */
  const visibleOrders = useMemo(() => {
    let list = [...orders];

    // filter by source: app orders vs. in-store POS sales
    if (sourceFilter === "app") list = list.filter((o) => !isPosOrder(o));
    if (sourceFilter === "pos") list = list.filter((o) => isPosOrder(o));

    // filter by status
    if (filterStatus !== "all") {
      list = list.filter((o) => o.status === filterStatus);
    }

    // search by name or phone
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q)
      );
    }

    // sort
    switch (sortKey) {
      case "newest":  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest":  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "highest": list.sort((a, b) => b.totalAmount - a.totalAmount); break;
      case "lowest":  list.sort((a, b) => a.totalAmount - b.totalAmount); break;
    }

    return list;
  }, [orders, sourceFilter, filterStatus, search, sortKey]);

  /* ── Sequential order numbers: oldest = #1, sorted by (createdAt, id) for determinism ── */
  const orderNumberMap = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const tDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (tDiff !== 0) return tDiff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    const map = new Map<string, number>();
    sorted.forEach((o, i) => map.set(o.id, i + 1));
    return map;
  }, [orders]);

  /* ── Count per status (for filter badge) ── */
  const countByStatus = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return map;
  }, [orders]);

  /* ─── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  /* ─── Empty state ── */
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200">
        <ShoppingCart className="h-14 w-14 text-slate-200 mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-slate-700">لا توجد طلبات بعد</h3>
        <p className="text-sm text-slate-400 mt-1">ستظهر طلبات زبائنك هنا فور وصولها.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ─── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">الطلبات</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {orders.length}
          </span>
          {stats.pending > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 animate-pulse">
              {stats.pending} جديد
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          disabled={loading}
          className="gap-1.5 rounded-lg text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث
        </Button>
      </div>

      {/* ─── Stats cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-center">
          <p className="text-xs text-amber-600 font-medium mb-0.5">طلبات جديدة</p>
          <p className="text-2xl font-extrabold text-amber-700">{stats.pending}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-center">
          <p className="text-xs text-emerald-600 font-medium mb-0.5">مُسلَّمة</p>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.delivered}</p>
        </div>
        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-center">
          <p className="text-xs text-primary font-medium mb-0.5">الإيراد</p>
          <p className="text-lg font-extrabold text-primary leading-tight">
            {stats.revenue.toLocaleString()}
            <span className="text-xs font-semibold"> د.ع</span>
          </p>
        </div>
      </div>

      {/* ─── مصدر الطلب: تطبيق أو كاشير ── */}
      <div className="flex overflow-x-auto no-scrollbar gap-2">
        {SOURCE_TABS.map((tab) => {
          const isActive = sourceFilter === tab.id;
          const count = tab.id === "all" ? orders.length : tab.id === "app" ? stats.appCount : stats.posCount;
          return (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition-colors ${
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
                  isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Search + Sort ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الزبون أو الهاتف..."
            className="pr-9 rounded-xl text-sm h-9"
          />
        </div>
        <div className="relative flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 h-9">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer appearance-none pr-1"
            aria-label="ترتيب الطلبات"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Filter tabs ── */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {FILTER_TABS.map((tab) => {
          const count = countByStatus[tab.id] ?? 0;
          const isActive = filterStatus === tab.id;
          if (tab.id !== "all" && count === 0) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
                  isActive ? "bg-white/25 text-white" : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Orders list ── */}
      {visibleOrders.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-100">
          <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">لا توجد طلبات بهذه المعايير</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              orderNumber={String(orderNumberMap.get(order.id) ?? order.id.slice(0, 8).toUpperCase())}
              onStatusChange={handleStatusChange}
              isUpdating={updatingOrderId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
