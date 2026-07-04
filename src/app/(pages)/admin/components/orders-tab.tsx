"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ShoppingBag, Search, RefreshCw, TrendingUp,
  Clock, CheckCircle, XCircle, Truck, PackageCheck, ChefHat,
  Eye, DollarSign, Filter,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import type { Order, OrderStatus, Store } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// ─── ثوابت ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:          { label: 'قيد الانتظار',    color: 'bg-amber-100 text-amber-800 border-amber-200',   icon: <Clock        className="h-3 w-3" /> },
  accepted:         { label: 'مقبول',            color: 'bg-blue-100 text-blue-800 border-blue-200',      icon: <CheckCircle  className="h-3 w-3" /> },
  preparing:        { label: 'قيد التحضير',      color: 'bg-violet-100 text-violet-800 border-violet-200',icon: <ChefHat      className="h-3 w-3" /> },
  ready_for_pickup: { label: 'جاهز للاستلام',   color: 'bg-cyan-100 text-cyan-800 border-cyan-200',     icon: <PackageCheck className="h-3 w-3" /> },
  delivering:       { label: 'قيد التوصيل',      color: 'bg-orange-100 text-orange-800 border-orange-200',icon: <Truck        className="h-3 w-3" /> },
  delivered:        { label: 'تم التسليم',       color: 'bg-green-100 text-green-800 border-green-200',  icon: <CheckCircle  className="h-3 w-3" /> },
  cancelled:        { label: 'ملغى',             color: 'bg-red-100 text-red-800 border-red-200',        icon: <XCircle      className="h-3 w-3" /> },
};

function fmtMoney(n: number) { return n.toLocaleString('ar-IQ') + ' د.ع'; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── صف مفصّل للطلب ─────────────────────────────────────────────────────────
function OrderDetailDialog({ order, open, onClose }: { order: Order | null; open: boolean; onClose: () => void }) {
  if (!order) return null;
  const meta = STATUS_META[order.status];
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            تفاصيل الطلب #{order.id.slice(-6).toUpperCase()}
          </DialogTitle>
          <DialogDescription>{fmtDate(order.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* الحالة */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الحالة</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${meta.color}`}>
              {meta.icon}{meta.label}
            </span>
          </div>

          {/* المتجر */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">المتجر</span>
            <span className="font-semibold">{order.storeName}</span>
          </div>

          {/* العميل */}
          {order.customerName && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">العميل</span>
              <span>{order.customerName}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الهاتف</span>
              <span dir="ltr">{order.customerPhone}</span>
            </div>
          )}
          {order.customerGovernorate && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المحافظة</span>
              <span>{order.customerGovernorate}</span>
            </div>
          )}
          {order.customerAddress && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">العنوان</span>
              <span className="text-right max-w-[60%]">{order.customerAddress}</span>
            </div>
          )}

          {/* المنتجات */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">المنتجات</div>
            <div className="divide-y divide-border/40">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <span className="flex-1 truncate">{item.productName}</span>
                  <span className="text-muted-foreground mx-2">× {item.quantity}</span>
                  <span className="font-semibold text-primary">{fmtMoney(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* الإجمالي */}
          <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
            <span className="font-bold">الإجمالي</span>
            <span className="text-xl font-black text-primary">{fmtMoney(order.totalAmount)}</span>
          </div>

          {/* الملاحظات */}
          {order.notes && (
            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <p className="font-semibold mb-1">ملاحظات:</p>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── بطاقة مؤشر صغيرة ───────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${accent} mb-3`}>{icon}</div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-black leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────────────
export function OrdersTab({ stores }: { stores: Store[] }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterStore, setFilterStore]   = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      const mapped: Order[] = data.map((row: any) => ({
        id:                row.id,
        storeId:           row.store_id ?? row.storeId ?? '',
        storeName:         row.store_name ?? row.storeName ?? (stores.find(s => s.id === (row.store_id ?? row.storeId))?.name ?? 'متجر غير معروف'),
        customerId:        row.customer_id ?? row.customerId ?? null,
        customerName:      row.customer_name ?? row.customerName ?? '',
        customerPhone:     row.customer_phone ?? row.customerPhone ?? '',
        customerPhoneBackup: row.customer_phone_backup ?? row.customerPhoneBackup ?? null,
        customerGovernorate: row.customer_governorate ?? row.customerGovernorate ?? null,
        customerAddress:   row.customer_address ?? row.customerAddress ?? null,
        items:             row.items ?? [],
        totalAmount:       row.total_amount ?? row.totalAmount ?? 0,
        status:            row.status ?? 'pending',
        notes:             row.notes ?? null,
        createdAt:         row.created_at ?? row.createdAt ?? new Date().toISOString(),
        updatedAt:         row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
        paymentMethod:     row.payment_method ?? row.paymentMethod ?? undefined,
      }));
      setOrders(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── فلترة ──
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      const matchStore  = filterStore  === 'all' || o.storeId === filterStore;
      const q = search.trim().toLowerCase();
      const matchSearch = !q
        || o.id.toLowerCase().includes(q)
        || (o.storeName ?? '').toLowerCase().includes(q)
        || (o.customerName ?? '').toLowerCase().includes(q)
        || (o.customerPhone ?? '').includes(q);
      return matchStatus && matchStore && matchSearch;
    });
  }, [orders, filterStatus, filterStore, search]);

  // ── مؤشرات ──
  const totalRevenue   = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0);
  const pendingOrders  = orders.filter(o => o.status === 'pending').length;
  const todayOrders    = orders.filter(o => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayRevenue   = todayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0);

  // قائمة المتاجر التي لها طلبات
  const storesWithOrders = useMemo(() => {
    const ids = new Set(orders.map(o => o.storeId));
    return stores.filter(s => ids.has(s.id));
  }, [orders, stores]);

  return (
    <div className="space-y-5">
      {/* ── المؤشرات ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="إجمالي الطلبات"      value={orders.length}              sub={`${todayOrders.length} اليوم`}                icon={<ShoppingBag className="h-4 w-4 text-primary" />}         accent="bg-primary/10" />
        <KpiCard label="قيد الانتظار"        value={pendingOrders}              sub="تحتاج مراجعة المتاجر"                           icon={<Clock       className="h-4 w-4 text-amber-600" />}      accent="bg-amber-50" />
        <KpiCard label="الإيراد (مسلّم)"     value={fmtMoney(totalRevenue)}     sub={`${orders.filter(o=>o.status==='delivered').length} طلب مكتمل`} icon={<DollarSign  className="h-4 w-4 text-emerald-600" />} accent="bg-emerald-50" />
        <KpiCard label="إيراد اليوم"         value={fmtMoney(todayRevenue)}     sub={`${todayOrders.filter(o=>o.status==='delivered').length} مكتمل اليوم`} icon={<TrendingUp className="h-4 w-4 text-blue-600" />}  accent="bg-blue-50" />
      </div>

      {/* ── الجدول ── */}
      <Card className="shadow-sm">
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-3 pb-3">
          <div>
            <CardTitle className="text-base">جميع الطلبات ({orders.length})</CardTitle>
            <CardDescription>عرض الطلبات من جميع المتاجر المسجّلة في المنصة</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث
          </Button>
        </CardHeader>

        <CardContent>
          {/* أدوات الفلترة */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الطلب، المتجر، أو العميل..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9 h-8 text-xs"
              />
            </div>
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as OrderStatus | 'all')}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Filter className="h-3 w-3 ml-1.5" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {(Object.keys(STATUS_META) as OrderStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="المتجر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المتاجر</SelectItem>
                {storesWithOrders.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>جاري تحميل الطلبات...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <div className="text-4xl mb-3">📭</div>
              <p>{orders.length === 0 ? 'لا توجد طلبات بعد' : 'لا توجد نتائج للبحث'}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="font-semibold w-20">رقم الطلب</TableHead>
                    <TableHead className="font-semibold">المتجر</TableHead>
                    <TableHead className="font-semibold">العميل</TableHead>
                    <TableHead className="text-center font-semibold">الحالة</TableHead>
                    <TableHead className="text-center font-semibold">المبلغ</TableHead>
                    <TableHead className="text-center font-semibold">التاريخ</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map(order => {
                    const meta = STATUS_META[order.status];
                    return (
                      <TableRow key={order.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{order.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[120px] truncate">
                          {order.storeName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[110px] truncate">
                          {order.customerName || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${meta.color}`}>
                            {meta.icon}{meta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-sm">
                          {fmtMoney(order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filtered.length > 200 && (
                <div className="py-3 text-center text-xs text-muted-foreground border-t border-border/60">
                  يتم عرض أحدث 200 طلب من أصل {filtered.length}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
