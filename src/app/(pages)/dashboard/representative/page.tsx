"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Store } from '@/lib/types';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/use-auth';
import {
  LogOut, CheckCircle, Hourglass, XCircle,
  DollarSign, Copy, Check, Users, Wallet,
  TrendingUp, Clock, Award, AlertCircle, Target,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

// ─── مساعدات ──────────────────────────────────────────────────────

function isCurrentMonth(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('ar-IQ');
}

// ─── كود الشريك ───────────────────────────────────────────────────

function PartnerCodeCard({ code, discountPercent }: { code: string; discountPercent: number }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-l from-primary/5 via-white to-white shadow-sm">
      <CardContent className="py-5 px-6">
        <p className="text-xs font-semibold text-muted-foreground mb-3">
          كودك الخاص — شاركه مع أصحاب المتاجر ليستخدموه عند التسجيل
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copy}
            className="inline-flex items-center gap-2.5 rounded-xl border-2 border-primary/40 bg-white px-5 py-2.5 font-mono text-2xl font-black tracking-widest text-primary hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
          >
            {code}
            {copied
              ? <Check className="h-5 w-5 text-emerald-500" />
              : <Copy className="h-5 w-5 text-primary/40" />}
          </button>
          {discountPercent > 0 && (
            <span className="rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold px-4 py-1.5 border border-emerald-200">
              يمنح خصم {discountPercent}٪ على الباقة
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── بطاقة إحصاء ──────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon, accent,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-full p-2 ${accent ?? 'bg-muted'}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── شارة الحالة ──────────────────────────────────────────────────

function StoreBadge({ store }: { store: Store }) {
  if (store.isActive)
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"><CheckCircle className="ml-1 h-3 w-3" />نشط</Badge>;
  if (!store.activationDate)
    return <Badge variant="outline" className="border-amber-300 text-amber-700"><Hourglass className="ml-1 h-3 w-3" />قيد المراجعة</Badge>;
  return <Badge variant="destructive"><XCircle className="ml-1 h-3 w-3" />موقوف</Badge>;
}

// ─── مكوّن الداشبورد ───────────────────────────────────────────────

function PartnerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  // ── جلب المتاجر المرتبطة بهذا الشريك ──────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name, description, type, market_type, location, is_active, activation_date, created_at, owner_email, package_name, package_id, registered_by_agent_id')
          .eq('registered_by_agent_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped: Store[] = (data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? null,
          type: r.type,
          marketType: r.market_type ?? '',
          location: r.location ?? '',
          isActive: r.is_active ?? false,
          activationDate: r.activation_date ?? null,
          createdAt: r.created_at ?? null,
          ownerEmail: r.owner_email ?? '',
          packageName: r.package_name ?? '',
          packageId: r.package_id ?? '',
          registeredByAgentId: r.registered_by_agent_id ?? null,
          // حقول مطلوبة بالنوع
          logoUrl: null, coverImageUrl: null, rating: 0, reviews: 0,
          latitude: null, longitude: null, businessHours: null,
          products: [], whatsappNumber: '', hasDelivery: false,
          productLimit: 0, subscriptionDuration: 0,
          ownerId: null, password: null, referralCode: null,
        } as unknown as Store));

        setStores(mapped);
      } catch (err) {
        console.error('partner stores fetch error:', err);
        toast({ title: 'خطأ في تحميل المتاجر', variant: 'destructive' });
      } finally {
        setLoadingStores(false);
      }
    })();
  }, [user, toast]);

  // ── حسابات مشتقة ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const active   = stores.filter(s => s.isActive);
    const pending  = stores.filter(s => !s.isActive && !s.activationDate);
    const stopped  = stores.filter(s => !s.isActive && !!s.activationDate);
    const thisMonthActivated = active.filter(s => isCurrentMonth(s.activationDate));

    return {
      total: stores.length,
      active: active.length,
      pending: pending.length,
      stopped: stopped.length,
      thisMonthActivated: thisMonthActivated.length,
    };
  }, [stores]);

  // ── بيانات المخطط: تسجيلات شهرية ─────────────────────────────
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    stores.forEach(s => {
      if (!s.createdAt) return;
      const d = new Date(s.createdAt as string);
      const key = d.toLocaleString('ar-SA', { month: 'short', year: 'numeric' });
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([month, count]) => ({ month, count }))
      .slice(-6); // آخر 6 أشهر فقط
  }, [stores]);

  const chartConfig: ChartConfig = {
    count: { label: 'متجر', color: 'hsl(var(--primary))' },
  };

  // ── بيانات الشريك ─────────────────────────────────────────────
  const paymentSystem       = user?.paymentSystem ?? 'commission';
  const monthlySalary       = user?.monthlySalary ?? 0;
  const requiredStores      = user?.requiredStoresCount ?? 0;
  const commissionPct       = user?.commissionPercent ?? 0;
  const packageDiscountPct  = user?.packageDiscountPercent ?? 0;
  const partnerCode         = user?.partnerCode ?? '';
  const totalEarnings       = user?.totalEarnings ?? 0;
  const isSalary            = paymentSystem === 'salary';

  // تقدم الهدف (للراتب فقط) — نتجنّب الهدف الصفري كي لا يظهر "حققت هدفك" بلا معنى
  const hasValidTarget = isSalary && requiredStores > 0;
  const progressPct = hasValidTarget
    ? Math.min(100, Math.round((stats.active / requiredStores) * 100))
    : 0;
  const targetReached = hasValidTarget && stats.active >= requiredStores;
  const extraStores   = targetReached ? stats.active - requiredStores : 0;

  if (loadingStores) return <LoadingSpinner isLoading />;

  return (
    <div className="min-h-screen bg-slate-50/60" dir="rtl">

      {/* ── الهيدر ── */}
      <div className="bg-white border-b border-border/60 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold leading-none">لوحة تحكم الشريك</h1>
            <p className="text-sm text-muted-foreground mt-0.5">أهلاً، {user?.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── كود الشريك ── */}
        {partnerCode && (
          <PartnerCodeCard code={partnerCode} discountPercent={packageDiscountPct} />
        )}

        {/* ── بطاقات الإحصاء ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="تفعيلات هذا الشهر"
            value={stats.thisMonthActivated}
            sub="متجر فُعِّل الشهر الحالي"
            icon={<Clock className="h-4 w-4 text-blue-600" />}
            accent="bg-blue-50"
          />
          <StatCard
            title="إجمالي المتاجر النشطة"
            value={stats.active}
            sub={`من أصل ${stats.total} مسجّل`}
            icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
            accent="bg-emerald-50"
          />
          <StatCard
            title="قيد المراجعة"
            value={stats.pending}
            sub="تنتظر موافقة المشرف"
            icon={<Hourglass className="h-4 w-4 text-amber-600" />}
            accent="bg-amber-50"
          />
          <StatCard
            title="إجمالي الأرباح"
            value={`${fmtCurrency(totalEarnings)} د.ع`}
            sub="الأرباح التراكمية الكلية"
            icon={<Wallet className="h-4 w-4 text-violet-600" />}
            accent="bg-violet-50"
          />
        </div>

        {/* ── نظام الراتب ── */}
        {isSalary && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                تفاصيل الراتب والهدف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* شرائح التفاصيل — تظهر دائماً */}
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3 min-w-[110px]">
                  <span className="text-xs text-muted-foreground mb-1">الراتب الشهري</span>
                  <span className="text-xl font-black text-primary leading-none">
                    {monthlySalary > 0 ? fmtCurrency(monthlySalary) : '—'}
                  </span>
                  {monthlySalary > 0 && <span className="text-xs text-muted-foreground mt-0.5">دينار عراقي</span>}
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 min-w-[110px]">
                  <span className="text-xs text-muted-foreground mb-1">العدد المطلوب</span>
                  <span className="text-xl font-black text-blue-600 leading-none">
                    {requiredStores > 0 ? requiredStores : '—'}
                  </span>
                  {requiredStores > 0 && <span className="text-xs text-muted-foreground mt-0.5">متجر / شهر</span>}
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 min-w-[110px]">
                  <span className="text-xs text-muted-foreground mb-1">عمولة فوق الهدف</span>
                  <span className="text-xl font-black text-emerald-600 leading-none">{commissionPct}٪</span>
                  <span className="text-xs text-muted-foreground mt-0.5">من كل متجر إضافي</span>
                </div>
              </div>

              {/* شريط التقدم — فقط إذا كان الهدف محدداً */}
              {hasValidTarget && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {targetReached
                        ? <span className="text-emerald-600 font-semibold">✅ حققت هدفك! {extraStores > 0 ? `لديك ${extraStores} متجر إضافي` : ''}</span>
                        : `متبقي ${requiredStores - stats.active} متجر`}
                    </span>
                    <span className="font-bold text-primary">{stats.active} / {requiredStores}</span>
                  </div>
                  <Progress value={progressPct} className="h-3" />
                  <p className="text-xs text-muted-foreground text-left">{progressPct}٪ من الهدف</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── نظام العمولة ── */}
        {!isSalary && (
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                تفاصيل العمولة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4 min-w-[130px]">
                  <span className="text-xs text-muted-foreground mb-1">نسبتك من كل مشترك</span>
                  <span className="text-3xl font-black text-primary leading-none">{commissionPct}٪</span>
                  <span className="text-xs text-muted-foreground mt-1">من سعر الباقة</span>
                </div>
                <div className="flex flex-col justify-center gap-1.5 text-sm text-muted-foreground">
                  <p>• تُحتسب العمولة عند تفعيل المتجر من المشرف</p>
                  <p>• تُضاف تلقائياً لإجمالي أرباحك</p>
                  {packageDiscountPct > 0 && (
                    <p>• المتاجر المسجّلة بكودك تحصل على خصم <strong className="text-foreground">{packageDiscountPct}٪</strong></p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── المتاجر قيد المراجعة — تنبيه منفصل ── */}
        {stats.pending > 0 && (
          <Card className="shadow-sm border-amber-200 bg-amber-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {stats.pending} متجر قيد المراجعة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-amber-200/60">
                {stores.filter(s => !s.isActive && !s.activationDate).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-amber-900">{s.name}</span>
                    <span className="text-xs text-amber-700">{fmtDate(s.createdAt as string)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── المخطط + إحصاء سريع ── */}
        {chartData.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                التسجيلات الشهرية
              </CardTitle>
              <CardDescription>عدد المتاجر التي سُجِّلت عبر كودك كل شهر</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} className="text-xs" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* ── جدول المتاجر بالكامل ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              جميع المتاجر المسجّلة
            </CardTitle>
            <CardDescription>المتاجر التي استخدم أصحابها كودك عند التسجيل</CardDescription>
          </CardHeader>
          <CardContent>
            {stores.length === 0 ? (
              <div className="text-center py-16 rounded-xl border-2 border-dashed border-border">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/40" strokeWidth={1} />
                <p className="mt-3 text-base font-medium text-muted-foreground">لا توجد متاجر بعد</p>
                <p className="text-sm text-muted-foreground mt-1">عندما يستخدم أحدهم كودك سيظهر هنا</p>
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-slate-100 rounded-xl p-1">
                  <TabsTrigger value="all" className="rounded-lg text-xs">الكل ({stats.total})</TabsTrigger>
                  <TabsTrigger value="active" className="rounded-lg text-xs">نشط ({stats.active})</TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-lg text-xs">مراجعة ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="stopped" className="rounded-lg text-xs">موقوف ({stats.stopped})</TabsTrigger>
                </TabsList>

                {(['all', 'active', 'pending', 'stopped'] as const).map(tab => {
                  const filtered = stores.filter(s => {
                    if (tab === 'all') return true;
                    if (tab === 'active') return s.isActive;
                    if (tab === 'pending') return !s.isActive && !s.activationDate;
                    return !s.isActive && !!s.activationDate;
                  });
                  return (
                    <TabsContent key={tab} value={tab}>
                      {filtered.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">لا توجد متاجر في هذه الفئة</p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-border/60">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/80">
                                <TableHead className="font-semibold">اسم المتجر</TableHead>
                                <TableHead className="font-semibold">النوع</TableHead>
                                <TableHead className="font-semibold">الباقة</TableHead>
                                <TableHead className="text-center font-semibold">الحالة</TableHead>
                                <TableHead className="font-semibold">تاريخ التسجيل</TableHead>
                                <TableHead className="font-semibold">تاريخ التفعيل</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map(store => (
                                <TableRow key={store.id} className="hover:bg-slate-50/60">
                                  <TableCell className="font-medium">{store.name}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{store.marketType || store.type || '—'}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{store.packageName || '—'}</TableCell>
                                  <TableCell className="text-center"><StoreBadge store={store} /></TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{fmtDate(store.createdAt as string)}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{fmtDate(store.activationDate)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية مع حماية الدور ──────────────────────────────

export default function RepresentativePage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || userRole !== 'representative') router.replace('/login');
  }, [user, userRole, loading, router]);

  if (loading || !user || userRole !== 'representative') {
    return <LoadingSpinner isLoading />;
  }

  return <PartnerDashboard />;
}
