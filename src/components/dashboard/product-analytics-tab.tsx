/**
 * Product Analytics Tab
 * Shows product ratings, order counts, and top products for the store owner.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Star, TrendingUp, ShoppingBag, Package, RefreshCw, ImageIcon, Award, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStoreOrders } from "@/services/orders";
import type { Order, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Star display ────────────────────────── */
function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn(
              "h-3.5 w-3.5",
              s <= full
                ? "text-amber-400 fill-amber-400"
                : s === full + 1 && half
                ? "text-amber-400 fill-amber-200"
                : "text-slate-200 fill-slate-200"
            )}
          />
        ))}
      </div>
      {reviews > 0 ? (
        <span className="text-[11px] text-slate-500 font-medium">
          {rating.toFixed(1)} ({reviews})
        </span>
      ) : (
        <span className="text-[11px] text-slate-400">لا تقييمات</span>
      )}
    </div>
  );
}

/* ── Types ───────────────────────────────── */
interface ProductStat {
  product: Product;
  orderCount: number;
  totalRevenue: number;
}

type SortKey = "orders" | "rating" | "revenue" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "orders",  label: "الأكثر طلباً" },
  { value: "rating",  label: "الأعلى تقييماً" },
  { value: "revenue", label: "الأعلى إيراداً" },
  { value: "name",    label: "الاسم" },
];

/* ── Main component ──────────────────────── */
export function ProductAnalyticsTab({
  storeId,
  products,
}: {
  storeId: string;
  products: Product[];
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("orders");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchStoreOrders(storeId);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) loadOrders();
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Compute per-product stats ─── */
  const productStats = useMemo<ProductStat[]>(() => {
    // Count orders per productId
    const orderCountMap = new Map<string, number>();
    const revenueMap    = new Map<string, number>();

    for (const order of orders) {
      // Skip cancelled orders in revenue, but count in orders
      const isCancelled = order.status === "cancelled";
      for (const item of order.items) {
        const pid = item.productId;
        if (!pid) continue;
        orderCountMap.set(pid, (orderCountMap.get(pid) ?? 0) + (item.quantity ?? 1));
        if (!isCancelled) {
          revenueMap.set(pid, (revenueMap.get(pid) ?? 0) + (item.totalPrice ?? 0));
        }
      }
    }

    return products.map((p) => ({
      product: p,
      orderCount: orderCountMap.get(p.id) ?? 0,
      totalRevenue: revenueMap.get(p.id) ?? 0,
    }));
  }, [products, orders]);

  /* ── Sorted list ─── */
  const sorted = useMemo(() => {
    const list = [...productStats];
    switch (sortKey) {
      case "orders":  return list.sort((a, b) => b.orderCount - a.orderCount);
      case "rating":  return list.sort((a, b) => (b.product.rating ?? 0) - (a.product.rating ?? 0));
      case "revenue": return list.sort((a, b) => b.totalRevenue - a.totalRevenue);
      case "name":    return list.sort((a, b) => a.product.name.localeCompare(b.product.name, "ar"));
    }
  }, [productStats, sortKey]);

  /* ── Summary stats ─── */
  const summary = useMemo(() => {
    const totalOrders  = productStats.reduce((s, p) => s + p.orderCount, 0);
    const totalRevenue = productStats.reduce((s, p) => s + p.totalRevenue, 0);
    const rated        = products.filter((p) => (p.reviews ?? 0) > 0);
    const avgRating    = rated.length
      ? rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length
      : 0;
    const topProduct   = productStats.reduce<ProductStat | null>(
      (best, cur) => (!best || cur.orderCount > best.orderCount ? cur : best),
      null
    );
    return { totalOrders, totalRevenue, avgRating, ratedCount: rated.length, topProduct };
  }, [productStats, products]);

  /* ── Max orders for bar scale ─── */
  const maxOrders = useMemo(
    () => Math.max(1, ...productStats.map((p) => p.orderCount)),
    [productStats]
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">تقييمات المنتجات</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {products.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          className="gap-1.5 rounded-lg text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث
        </Button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-sky-50 border border-sky-100 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-semibold text-sky-600">إجمالي الطلبات</span>
          </div>
          <p className="text-2xl font-extrabold text-sky-700">{summary.totalOrders}</p>
          <p className="text-[10px] text-sky-500 mt-0.5">قطع مُطلبة</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-600 fill-amber-400" />
            <span className="text-xs font-semibold text-amber-600">متوسط التقييم</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-700">
            {summary.avgRating > 0 ? summary.avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-[10px] text-amber-500 mt-0.5">{summary.ratedCount} منتج مُقيَّم</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600">الإيراد (بدون ملغى)</span>
          </div>
          <p className="text-lg font-extrabold text-emerald-700 leading-tight">
            {summary.totalRevenue.toLocaleString()}
            <span className="text-xs font-semibold mr-1">د.ع</span>
          </p>
        </div>
        <div className="rounded-2xl bg-violet-50 border border-violet-100 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-600">الأكثر طلباً</span>
          </div>
          {summary.topProduct && summary.topProduct.orderCount > 0 ? (
            <>
              <p className="text-sm font-extrabold text-violet-700 line-clamp-1">
                {summary.topProduct.product.name}
              </p>
              <p className="text-[10px] text-violet-500 mt-0.5">
                {summary.topProduct.orderCount} قطعة
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-violet-400">لا طلبات بعد</p>
          )}
        </div>
      </div>

      {/* ── Sort selector ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">ترتيب:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortKey(opt.value)}
            className={cn(
              "flex-shrink-0 rounded-2xl px-3 py-1.5 text-xs font-bold transition-all",
              sortKey === opt.value
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Products list ── */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-100 text-center">
          <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">لا توجد منتجات بعد</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {sorted.map(({ product, orderCount, totalRevenue }, idx) => (
              <div key={product.id} className="flex items-center gap-3 px-4 py-3">

                {/* رتبة */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black",
                  idx === 0 ? "bg-amber-400 text-white" :
                  idx === 1 ? "bg-slate-300 text-white" :
                  idx === 2 ? "bg-orange-300 text-white" :
                  "bg-slate-100 text-slate-400"
                )}>
                  {idx + 1}
                </div>

                {/* صورة */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                  {product.imageUrl ? (
                    product.imageUrl.startsWith("data:") ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="48px" />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* معلومات */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                  <StarRow rating={product.rating ?? 0} reviews={product.reviews ?? 0} />
                  {totalRevenue > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      إيراد: {totalRevenue.toLocaleString()} د.ع
                    </p>
                  )}
                </div>

                {/* عداد الطلبات + شريط */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[56px]">
                  <div className="flex items-center gap-1">
                    <TrendingUp className={cn("h-3 w-3", orderCount > 0 ? "text-sky-500" : "text-slate-300")} />
                    <span className={cn(
                      "text-sm font-extrabold tabular-nums",
                      orderCount > 0 ? "text-sky-700" : "text-slate-300"
                    )}>
                      {orderCount}
                    </span>
                  </div>
                  {/* شريط نسبي */}
                  <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        orderCount > 0 ? "bg-sky-400" : "bg-slate-200"
                      )}
                      style={{ width: `${(orderCount / maxOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">طلبات</span>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      {products.length > 0 && (
        <p className="text-center text-[11px] text-slate-400">
          يُحسب عدد الطلبات من مجموع القطع المطلوبة من كل منتج عبر جميع الطلبات.
        </p>
      )}

    </div>
  );
}
