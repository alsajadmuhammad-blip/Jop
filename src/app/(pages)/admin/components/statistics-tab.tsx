"use client";

import React, { useMemo, useEffect, useState } from "react";
import type { Store, User, StorePackage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/services/supabase";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  TrendingUp, Users, Store as StoreIcon, CheckCircle,
  Clock, XCircle, Award, ShoppingBag,
} from "lucide-react";

// ─── ثوابت ────────────────────────────────────────────────────────
const MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function fmtNum(n: number) { return n.toLocaleString('ar-IQ'); }

// ─── بطاقة مؤشر ──────────────────────────────────────────────────
function MetricCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${accent ?? 'bg-muted'} mb-3`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-black leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────
export function StatisticsTab({
  stores,
  representatives,
  packages,
}: {
  stores: Store[];
  representatives: User[];
  packages: StorePackage[];
}) {
  const [ordersCount, setOrdersCount]   = useState<number | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // جلب عدد الطلبات من DB
  useEffect(() => {
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        setOrdersCount(count ?? 0);
        setOrdersLoading(false);
      });
  }, []);

  // ── تصنيفات المتاجر ──────────────────────────────────────────
  const activeStores  = stores.filter(s => s.isActive);
  const pendingStores = stores.filter(s => !s.isActive && !s.activationDate);
  const stoppedStores = stores.filter(s => !s.isActive && !!s.activationDate);

  const now   = new Date();
  const thisM = now.getMonth();
  const thisY = now.getFullYear();
  const newThisMonth = stores.filter(s => {
    if (!s.createdAt) return false;
    const d = new Date(String(s.createdAt));
    return d.getMonth() === thisM && d.getFullYear() === thisY;
  });

  // ── مخطط آخر 6 أشهر ─────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth();
      const y = d.getFullYear();
      const count = stores.filter(s => {
        if (!s.createdAt) return false;
        const sd = new Date(String(s.createdAt));
        return sd.getMonth() === m && sd.getFullYear() === y;
      }).length;
      return { month: MONTHS_AR[m], count };
    });
  }, [stores]);

  // ── توزيع نوع السوق ─────────────────────────────────────────
  const marketData = useMemo(() => {
    const map = new Map<string, number>();
    stores.forEach(s => {
      const t = s.marketType?.trim() || 'غير محدد';
      map.set(t, (map.get(t) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [stores]);

  // ── أداء الشركاء ─────────────────────────────────────────────
  const partnerPerf = useMemo(() => {
    return representatives
      .map(r => ({
        ...r,
        storeCount:  stores.filter(s => s.registeredByAgentId === r.id).length,
        activeCount: stores.filter(s => s.registeredByAgentId === r.id && s.isActive).length,
      }))
      .sort((a, b) => b.storeCount - a.storeCount);
  }, [representatives, stores]);

  const totalEarnings = representatives.reduce((s, r) => s + (r.totalEarnings ?? 0), 0);

  const chartConfig = { count: { label: 'متجر', color: 'hsl(var(--primary))' } };

  return (
    <div className="space-y-6">

      {/* ── المؤشرات الرئيسية ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<StoreIcon className="h-5 w-5 text-primary" />}
          label="إجمالي المتاجر"
          value={stores.length}
          sub={`${newThisMonth.length} جديد هذا الشهر`}
          accent="bg-primary/10"
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          label="المتاجر النشطة"
          value={activeStores.length}
          sub={`${stores.length ? Math.round(activeStores.length / stores.length * 100) : 0}٪ من الإجمالي`}
          accent="bg-emerald-50"
        />
        <MetricCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          label="الشركاء"
          value={representatives.length}
          sub={totalEarnings > 0 ? `أرباح: ${fmtNum(totalEarnings)} د.ع` : 'لا توجد أرباح بعد'}
          accent="bg-blue-50"
        />
        <MetricCard
          icon={<ShoppingBag className="h-5 w-5 text-violet-600" />}
          label="إجمالي الطلبات"
          value={ordersLoading ? '...' : fmtNum(ordersCount ?? 0)}
          sub="جميع الطلبات المسجلة"
          accent="bg-violet-50"
        />
      </div>

      {/* ── مخطط التسجيلات + توزيع الحالة ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* المخطط الشريطي */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              التسجيلات الشهرية — آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={monthlyData} accessibilityLayer>
                <CartesianGrid vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} className="text-xs" width={24} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* توزيع الحالة */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزيع الحالة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'نشطة',          value: activeStores.length,  color: 'bg-emerald-500', icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> },
              { label: 'قيد المراجعة', value: pendingStores.length,  color: 'bg-amber-500',   icon: <Clock       className="h-3.5 w-3.5 text-amber-600"   /> },
              { label: 'موقوفة',        value: stoppedStores.length,  color: 'bg-red-500',     icon: <XCircle     className="h-3.5 w-3.5 text-red-600"     /> },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {item.icon}{item.label}
                  </span>
                  <span className="font-bold">{item.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: stores.length ? `${(item.value / stores.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}

            {/* ملخص سريع */}
            <div className="pt-2 border-t border-border/60 space-y-1 text-xs text-muted-foreground">
              <p>📦 الباقات المتاحة: <strong className="text-foreground">{packages.filter(p => p.isActive).length}</strong></p>
              <p>🗓️ جديد هذا الشهر: <strong className="text-foreground">{newThisMonth.length}</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── توزيع الفئات ── */}
      {marketData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزيع الفئات</CardTitle>
            <CardDescription>عدد المتاجر حسب نوع النشاط</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {marketData.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28 truncate text-right shrink-0">{item.name}</span>
                  <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-lg flex items-center justify-end pr-2.5 transition-all duration-500"
                      style={{ width: marketData[0]?.count ? `${(item.count / marketData[0].count) * 100}%` : '0%', minWidth: '2rem' }}
                    >
                      <span className="text-xs font-bold text-white">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── جدول أداء الشركاء ── */}
      {partnerPerf.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              أداء الشركاء
            </CardTitle>
            <CardDescription>مرتّب حسب عدد المتاجر المسجلة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-semibold">#</TableHead>
                    <TableHead className="font-semibold">الاسم</TableHead>
                    <TableHead className="text-center font-semibold">الكود</TableHead>
                    <TableHead className="text-center font-semibold">متاجر مسجلة</TableHead>
                    <TableHead className="text-center font-semibold">نشطة</TableHead>
                    <TableHead className="text-center font-semibold">تفعيلات الشهر</TableHead>
                    <TableHead className="text-center font-semibold">إجمالي الأرباح</TableHead>
                    <TableHead className="text-center font-semibold">نظام الدفع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerPerf.map((r, i) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/60">
                      <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-center">
                        {r.partnerCode
                          ? <Badge variant="outline" className="font-mono text-xs">{r.partnerCode}</Badge>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-center font-bold">{r.storeCount}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-emerald-600 font-semibold">{r.activeCount}</span>
                      </TableCell>
                      <TableCell className="text-center">{r.monthlyActivations ?? 0}</TableCell>
                      <TableCell className="text-center">
                        {(r.totalEarnings ?? 0) > 0
                          ? <span className="font-semibold text-primary">{fmtNum(r.totalEarnings!)} د.ع</span>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={r.paymentSystem === 'salary' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {r.paymentSystem === 'salary' ? '💰 راتب' : r.paymentSystem === 'commission' ? '📊 عمولة' : '—'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
