/**
 * Store Orders Tab — with monthly archive grouping
 */

"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/lib/types";
import { fetchStoreOrders, updateOrderStatus } from "@/services/orders";
import {
  ShoppingCart, Phone, Clock, MapPin, RefreshCw,
  ChevronDown, ChevronUp, TrendingUp,
  CheckCircle2, XCircle, Loader2, Search,
  Calendar, Banknote, Package, Filter, Printer,
} from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─────────────── Status meta ─────────────────────────────── */
const statusLabels: Record<OrderStatus, string> = {
  pending:          "جديد",
  accepted:         "مقبول",
  preparing:        "يُجهَّز",
  ready_for_pickup: "جاهز",
  delivering:       "يُوصَّل",
  delivered:        "مُسلَّم",
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

/* ─────────────── Filters ─────────────────────────────────── */
const FILTER_TABS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all",          label: "الكل" },
  { id: "pending",      label: "جديد" },
  { id: "accepted",     label: "مقبول" },
  { id: "preparing",    label: "يُجهَّز" },
  { id: "delivering",   label: "يُوصَّل" },
  { id: "delivered",    label: "مُسلَّم" },
  { id: "cancelled",    label: "ملغى" },
];

type SourceFilter = "all" | "app" | "pos";
function isPosOrder(order: Order): boolean {
  return order.paymentMethod === "cash" || order.paymentMethod === "transfer";
}

type SortKey = "newest" | "oldest" | "highest" | "lowest";

/* ─────────────── Month helpers ───────────────────────────── */
function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("ar-IQ", { year: "numeric", month: "long" });
}

/* ─────────────── Print invoice ──────────────────────────── */
function printOrderInvoice(order: Order, orderNumber: string, storeName = "المتجر") {
  const dateStr = new Date(order.createdAt).toLocaleString("ar-IQ", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const itemsRows = order.items.map((item) => `
    <tr>
      <td>${item.productName}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:left">${item.unitPrice?.toLocaleString() ?? "—"} د.ع</td>
      <td style="text-align:left">${item.totalPrice.toLocaleString()} د.ع</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>فاتورة #${orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .store-name { font-size: 22px; font-weight: 800; color: #3b5bdb; }
    .invoice-meta { text-align: left; }
    .invoice-meta h2 { font-size: 18px; font-weight: 700; color: #1e293b; }
    .invoice-meta p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; margin-top: 6px; }
    section { margin-bottom: 20px; }
    section h3 { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; }
    .info-item label { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 3px; }
    .info-item span { font-size: 13px; font-weight: 600; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f1f5f9; padding: 9px 12px; text-align: right; font-size: 11px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    thead th:last-child { text-align: left; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .total-row { background: #3b5bdb; color: #fff; }
    .total-row td { padding: 12px; font-size: 15px; font-weight: 800; border: none; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store-name">${storeName}</div>
      <div class="badge">فاتورة رسمية</div>
    </div>
    <div class="invoice-meta">
      <h2>طلب #${orderNumber}</h2>
      <p>${dateStr}</p>
      <p>طريقة الدفع: ${order.paymentMethod === "cash" ? "كاش" : order.paymentMethod === "transfer" ? "تحويل" : "واتساب"}</p>
    </div>
  </div>

  <section>
    <h3>معلومات العميل</h3>
    <div class="info-grid">
      <div class="info-item"><label>الاسم</label><span>${order.customerName || "—"}</span></div>
      <div class="info-item"><label>الهاتف</label><span>${order.customerPhone || "—"}</span></div>
      ${order.customerGovernorate ? `<div class="info-item"><label>المحافظة</label><span>${order.customerGovernorate}</span></div>` : ""}
      ${order.customerAddress ? `<div class="info-item"><label>العنوان</label><span>${order.customerAddress}</span></div>` : ""}
    </div>
  </section>

  <section>
    <h3>المنتجات</h3>
    <table>
      <thead>
        <tr>
          <th>المنتج</th>
          <th style="text-align:center">الكمية</th>
          <th style="text-align:left">سعر الوحدة</th>
          <th style="text-align:left">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr class="total-row">
          <td colspan="3">المجموع الكلي</td>
          <td style="text-align:left">${order.totalAmount.toLocaleString()} د.ع</td>
        </tr>
      </tbody>
    </table>
  </section>

  ${order.notes ? `<section><h3>ملاحظات</h3><p style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:10px 14px;">${order.notes}</p></section>` : ""}

  <div class="footer">
    تم إصدار هذه الفاتورة من منصة مركزي — ${new Date().toLocaleDateString("ar-IQ")}
  </div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=820,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

/* ─────────────── OrderCard ───────────────────────────────── */
const OrderCard = memo(function OrderCard({
  order,
  orderNumber,
  formattedDate,
  onStatusChange,
  isUpdating,
  archived = false,
  storeName,
}: {
  order: Order;
  orderNumber: string;
  formattedDate: string;
  onStatusChange: (id: string, status: OrderStatus) => void;
  isUpdating: boolean;
  archived?: boolean;
  storeName?: string;
}) {
  const [expanded, setExpanded] = useState(!archived && order.status === "pending");
  const nextStatuses = nextStatusMap[order.status] || [];
  const hasAddress = order.customerGovernorate || order.customerAddress;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
        order.status === "cancelled" ? "opacity-60" : ""
      } ${order.status === "pending" ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-100"}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3.5 flex items-start justify-between gap-3 text-right hover:bg-slate-50/50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-bold text-slate-900">#{orderNumber}</span>
            <Badge
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusColors[order.status]}`}
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
              {isPosOrder(order) ? "كاشير" : "تطبيق"}
            </span>
            {order.status === "pending" && !archived && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                يحتاج إجراء
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formattedDate}
            </span>
            <span className="font-bold text-slate-700">
              {order.totalAmount.toLocaleString()} د.ع
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors mt-0.5">
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-600" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
          )}
        </div>
      </button>

      {/* Quick row — always visible */}
      <div className="px-4 pb-3.5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="h-3 w-3 text-primary" />
          </div>
          <a
            href={`https://wa.me/${order.customerPhone?.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold text-primary hover:underline"
            dir="ltr"
          >
            {order.customerPhone || "—"}
          </a>
        </div>
        {hasAddress && (
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin className="h-3 w-3 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {order.customerGovernorate || "—"}
            </span>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/50">
          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">الاسم</span>
              <p className="font-semibold text-slate-900 mt-0.5">{order.customerName || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">الهاتف</span>
              <a
                href={`https://wa.me/${order.customerPhone?.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline block mt-0.5"
                dir="ltr"
              >
                {order.customerPhone || "—"}
              </a>
            </div>
            {order.customerPhoneBackup && (
              <div>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">هاتف احتياطي</span>
                <a href={`tel:${order.customerPhoneBackup}`} className="font-semibold text-slate-900 hover:underline block mt-0.5" dir="ltr">
                  {order.customerPhoneBackup}
                </a>
              </div>
            )}
          </div>

          {/* Address */}
          {hasAddress && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 text-sm">
              {order.customerGovernorate && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px] w-16 shrink-0">المحافظة</span>
                  <span className="font-semibold text-slate-900">{order.customerGovernorate}</span>
                </div>
              )}
              {order.customerAddress && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 text-[10px] w-16 shrink-0 mt-0.5">العنوان</span>
                  <span className="font-medium text-slate-800 leading-snug">{order.customerAddress}</span>
                </div>
              )}
            </div>
          )}

          {/* Products */}
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-slate-700">
                  {item.productName}{" "}
                  <span className="text-slate-400 text-xs">×{item.quantity}</span>
                </span>
                <span className="font-semibold text-slate-900 text-xs">
                  {item.totalPrice.toLocaleString()} د.ع
                </span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2 font-bold text-sm bg-slate-50/80">
              <span className="text-slate-600">الإجمالي</span>
              <span className="text-primary">{order.totalAmount.toLocaleString()} د.ع</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
              📝 {order.notes}
            </p>
          )}

          {/* Status actions */}
          {!archived && nextStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {nextStatuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === "cancelled" ? "destructive" : "default"}
                  className={s !== "cancelled" ? "bg-primary hover:bg-primary/90 text-white rounded-xl" : "rounded-xl"}
                  disabled={isUpdating}
                  onClick={() => onStatusChange(order.id, s)}
                >
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : statusLabels[s]}
                </Button>
              ))}
            </div>
          )}

          {!archived && nextStatuses.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-1 flex items-center justify-center gap-1">
              {order.status === "delivered" ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> الطلب مُسلَّم بنجاح</>
              ) : (
                <><XCircle className="w-3.5 h-3.5 text-red-400" /> الطلب ملغى</>
              )}
            </p>
          )}

          {/* زر الطباعة */}
          <div className="pt-1 border-t border-slate-100">
            <button
              onClick={() => printOrderInvoice(order, orderNumber, storeName)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة الفاتورة
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

/* ─────────────── MonthArchiveCard ───────────────────────── */
function MonthArchiveCard({
  monthKey,
  orders,
  orderNumberMap,
  formattedDateMap,
  onStatusChange,
  updatingOrderId,
  storeName,
}: {
  monthKey: string;
  orders: Order[];
  orderNumberMap: Map<string, number>;
  formattedDateMap: Map<string, string>;
  onStatusChange: (id: string, status: OrderStatus) => void;
  updatingOrderId: string | null;
  storeName?: string;
}) {
  const [open, setOpen] = useState(false);

  const revenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.totalAmount, 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const activeCount = orders.length - deliveredCount - cancelledCount;

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
      {/* Summary row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 text-right hover:bg-slate-50 transition-colors"
      >
        {/* Calendar icon */}
        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Calendar className="h-4.5 w-4.5 h-[18px] w-[18px] text-indigo-600" />
        </div>

        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-bold text-slate-800">{getMonthLabel(monthKey)}</p>
          <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Package className="h-3 w-3" />
              {orders.length} طلب
            </span>
            {deliveredCount > 0 && (
              <span className="text-[11px] text-emerald-600 font-semibold">
                ✓ {deliveredCount} مُسلَّم
              </span>
            )}
            {activeCount > 0 && (
              <span className="text-[11px] text-amber-600 font-semibold">
                ◕ {activeCount} نشط
              </span>
            )}
            {cancelledCount > 0 && (
              <span className="text-[11px] text-red-400">
                ✕ {cancelledCount} ملغى
              </span>
            )}
          </div>
        </div>

        {/* Revenue badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1">
            <Banknote className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">
              {revenue.toLocaleString()} د.ع
            </span>
          </div>
        </div>

        <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-600" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
          )}
        </div>
      </button>

      {/* Expanded orders */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-3 space-y-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              orderNumber={String(orderNumberMap.get(order.id) ?? order.id.slice(0, 6))}
              formattedDate={formattedDateMap.get(order.id) ?? ""}
              onStatusChange={onStatusChange}
              isUpdating={updatingOrderId === order.id}
              archived
              storeName={storeName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main component ─────────────────────────── */
interface StoreOrdersTabProps {
  storeId: string;
  storeName?: string;
  storeLogoUrl?: string;
}

export function StoreOrdersTab({ storeId, storeName, storeLogoUrl: _storeLogoUrl }: StoreOrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  // useState initializer runs only on client → avoids SSR/client date mismatch
  const [currentMonthKey] = useState(() => getCurrentMonthKey());
  const { toast } = useToast();

  useEffect(() => { loadOrders(); /* eslint-disable-next-line */ }, [storeId]);

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

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
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
  }, [toast]);

  /* ── Month split ── */
  const { currentMonthOrders, pastMonthGroups } = useMemo(() => {
    const current: Order[] = [];
    const past: Record<string, Order[]> = {};

    for (const order of orders) {
      const key = getMonthKey(order.createdAt);
      if (key === currentMonthKey) {
        current.push(order);
      } else {
        if (!past[key]) past[key] = [];
        past[key].push(order);
      }
    }

    // Sort past months newest first
    const sortedKeys = Object.keys(past).sort((a, b) => b.localeCompare(a));
    const pastMonthGroups = sortedKeys.map((key) => ({
      key,
      orders: past[key].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));

    return { currentMonthOrders: current, pastMonthGroups };
  }, [orders, currentMonthKey]);

  /* ── Stats (current month only) ── */
  const stats = useMemo(() => {
    const pending   = currentMonthOrders.filter((o) => o.status === "pending").length;
    const delivered = currentMonthOrders.filter((o) => o.status === "delivered").length;
    const cancelled = currentMonthOrders.filter((o) => o.status === "cancelled").length;
    const revenue   = currentMonthOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const appCount  = currentMonthOrders.filter((o) => !isPosOrder(o)).length;
    const posCount  = currentMonthOrders.filter((o) => isPosOrder(o)).length;
    return { pending, delivered, cancelled, revenue, appCount, posCount };
  }, [currentMonthOrders]);

  /* ── Filter + Search + Sort (current month) ── */
  const visibleOrders = useMemo(() => {
    let list = [...currentMonthOrders];

    if (sourceFilter === "app") list = list.filter((o) => !isPosOrder(o));
    if (sourceFilter === "pos") list = list.filter((o) => isPosOrder(o));
    if (filterStatus !== "all") list = list.filter((o) => o.status === filterStatus);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q)
      );
    }

    switch (sortKey) {
      case "newest":  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest":  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "highest": list.sort((a, b) => b.totalAmount - a.totalAmount); break;
      case "lowest":  list.sort((a, b) => a.totalAmount - b.totalAmount); break;
    }

    return list;
  }, [currentMonthOrders, sourceFilter, filterStatus, search, sortKey]);

  /* ── Sequential order numbers across ALL orders ── */
  const orderNumberMap = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return t !== 0 ? t : a.id < b.id ? -1 : 1;
    });
    const map = new Map<string, number>();
    sorted.forEach((o, i) => map.set(o.id, i + 1));
    return map;
  }, [orders]);

  /* ── Count per status (current month) ── */
  const countByStatus = useMemo(() => {
    const map: Record<string, number> = { all: currentMonthOrders.length };
    for (const o of currentMonthOrders) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return map;
  }, [currentMonthOrders]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    );
  }

  /* ── Empty state ── */
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200">
        <ShoppingCart className="h-14 w-14 text-slate-200 mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-slate-700">لا توجد طلبات بعد</h3>
        <p className="text-sm text-slate-400 mt-1">ستظهر طلبات زبائنك هنا فور وصولها.</p>
      </div>
    );
  }

  /* ── Active filters count (for badge) ── */
  const activeFiltersCount =
    (filterStatus !== "all" ? 1 : 0) +
    (sourceFilter !== "all" ? 1 : 0) +
    (sortKey !== "newest" ? 1 : 0);

  return (
    <div className="space-y-4">

      {/* ─── Stats ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-center">
          <p className="text-[10px] text-amber-600 font-semibold mb-0.5">جديدة</p>
          <p className="text-2xl font-extrabold text-amber-700 leading-none">{stats.pending}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-center">
          <p className="text-[10px] text-emerald-600 font-semibold mb-0.5">مُسلَّمة</p>
          <p className="text-2xl font-extrabold text-emerald-700 leading-none">{stats.delivered}</p>
        </div>
        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-center">
          <p className="text-[10px] text-primary font-semibold mb-0.5">الإيراد</p>
          <p className="text-sm font-extrabold text-primary leading-tight">
            {stats.revenue.toLocaleString()}
            <span className="text-[10px] font-semibold"> د.ع</span>
          </p>
        </div>
      </div>

      {/* ─── Search + actions row ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف..."
            className="pr-9 rounded-xl text-sm h-9 bg-white"
          />
        </div>
        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`relative h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            showFilters || activeFiltersCount > 0
              ? "border-primary bg-primary/5 text-primary"
              : "border-slate-200 text-slate-600 bg-white"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          فلترة
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {/* Refresh */}
        <button
          onClick={loadOrders}
          disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="تحديث"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ─── Collapsible filter panel ── */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">

          {/* Source segmented control */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">المصدر</p>
            <div className="flex gap-1.5">
              {(
                [
                  { id: "all" as SourceFilter, label: "الكل", count: currentMonthOrders.length },
                  { id: "app" as SourceFilter, label: "طلبات التطبيق", count: stats.appCount },
                  { id: "pos" as SourceFilter, label: "مبيعات الكاشير", count: stats.posCount },
                ] as { id: SourceFilter; label: string; count: number }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSourceFilter(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-bold transition-colors ${
                    sourceFilter === tab.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] mt-0.5 font-semibold ${sourceFilter === tab.id ? "text-primary/70" : "text-slate-400"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status chips */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">الحالة</p>
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5">
              {FILTER_TABS.map((tab) => {
                const count = countByStatus[tab.id] ?? 0;
                const isActive = filterStatus === tab.id;
                if (tab.id !== "all" && count === 0) return null;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm shadow-primary/20"
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
          </div>

          {/* Sort */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">الترتيب</p>
            <div className="flex gap-1.5 flex-wrap">
              {(
                [
                  { value: "newest" as SortKey, label: "الأحدث" },
                  { value: "oldest" as SortKey, label: "الأقدم" },
                  { value: "highest" as SortKey, label: "الأعلى" },
                  { value: "lowest" as SortKey, label: "الأقل" },
                ] as { value: SortKey; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortKey(opt.value)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                    sortKey === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setFilterStatus("all"); setSourceFilter("all"); setSortKey("newest"); }}
              className="w-full py-1.5 text-xs text-red-500 font-semibold hover:text-red-600 transition-colors"
            >
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>
      )}

      {/* ─── Current month section ── */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-slate-800">
              {getMonthLabel(currentMonthKey)}
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {visibleOrders.length}
            </span>
            {stats.pending > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 animate-pulse">
                {stats.pending} جديد
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium bg-primary/5 border border-primary/10 rounded-lg px-2 py-0.5 text-primary">
            الشهر الحالي
          </span>
        </div>

        {/* Orders */}
        {visibleOrders.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border-2 border-dashed border-slate-100">
            <TrendingUp className="h-9 w-9 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">
              {currentMonthOrders.length === 0 ? "لا توجد طلبات هذا الشهر بعد" : "لا توجد طلبات بهذه المعايير"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                orderNumber={String(orderNumberMap.get(order.id) ?? order.id.slice(0, 6))}
                onStatusChange={handleStatusChange}
                isUpdating={updatingOrderId === order.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Past months archive ── */}
      {pastMonthGroups.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              أرشيف الشهور السابقة
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="space-y-2">
            {pastMonthGroups.map(({ key, orders: monthOrders }) => (
              <MonthArchiveCard
                key={key}
                monthKey={key}
                orders={monthOrders}
                orderNumberMap={orderNumberMap}
                onStatusChange={handleStatusChange}
                updatingOrderId={updatingOrderId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
