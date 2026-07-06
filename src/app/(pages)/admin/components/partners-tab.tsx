"use client";

import React, { useState, useMemo } from "react";
import {
  Handshake, UserPlus, Edit, Trash2, Copy, Check,
  RefreshCw, Search, TrendingUp, Store as StoreIcon,
  DollarSign, Target, RotateCcw, Package2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, StorePackage, User } from "@/lib/types";
import { createRepresentative } from "@/services/supabase-admin";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── ثوابت ──────────────────────────────────────────────────────────────────
const DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25, 30];
function fmtMoney(n: number) { return n.toLocaleString('ar-IQ') + ' د.ع'; }

// ─── chip الكود ──────────────────────────────────────────────────────────────
function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors"
    >
      {code}
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
    </button>
  );
}

// ─── شارة نظام الدفع ─────────────────────────────────────────────────────────
function PaymentBadge({ partner }: { partner: User }) {
  if (partner.paymentSystem === 'salary') {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
        💰 راتب — {fmtMoney(partner.monthlySalary ?? 0)}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-xs font-medium">
      📊 عمولة — {partner.commissionPercent ?? 0}%
    </Badge>
  );
}

// ─── نموذج إنشاء شريك ────────────────────────────────────────────────────────
const CreatePartnerDialog = React.memo(function CreatePartnerDialog({
  isOpen, onOpenChange, onPartnerAdded,
}: { isOpen: boolean; onOpenChange: (v: boolean) => void; onPartnerAdded?: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [paymentSystem, setPaymentSystem] = useState<'salary' | 'commission'>('salary');
  const [packageDiscountPercent, setPackageDiscountPercent] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', partnerCode: '', monthlySalary: '', requiredStoresCount: '', commissionPercent: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const reset = () => {
    setForm({ name: '', email: '', password: '', partnerCode: '', monthlySalary: '', requiredStoresCount: '', commissionPercent: '' });
    setPaymentSystem('salary'); setPackageDiscountPercent(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.partnerCode.trim()) {
      toast({ variant: "destructive", title: "أدخل جميع الحقول الإلزامية" }); return;
    }
    if (!/^[A-Z0-9_-]{2,20}$/.test(form.partnerCode)) {
      toast({ variant: "destructive", title: "الكود يجب أن يكون أحرف إنجليزية وأرقام فقط (2-20 حرف)" }); return;
    }
    if (paymentSystem === 'salary' && (!form.monthlySalary || !form.requiredStoresCount)) {
      toast({ variant: "destructive", title: "أدخل الراتب الشهري وعدد المتاجر المطلوب" }); return;
    }
    setSaving(true);
    try {
      const result = await createRepresentative({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        paymentSystem,
        monthlySalary: paymentSystem === 'salary' ? Number(form.monthlySalary) : undefined,
        requiredStoresCount: paymentSystem === 'salary' ? Number(form.requiredStoresCount) : undefined,
        commissionPercent: Number(form.commissionPercent) || 0,
        packageDiscountPercent,
        partnerCode: form.partnerCode.trim(),
      });
      if (result?.success === false) throw new Error(result.error);
      toast({ title: "✅ تم إنشاء الحساب بنجاح", description: `الكود: ${form.partnerCode}` });
      reset(); onOpenChange(false); onPartnerAdded?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الإنشاء", description: err?.message });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-full max-w-lg max-h-[92vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" /> إضافة مسوّق جديد
          </DialogTitle>
          <DialogDescription>أنشئ حساب مسوّق مع كود خاص وشروط واضحة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الاسم الكامل *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="أحمد علي" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>الكود التسويقي *</Label>
              <input
                value={form.partnerCode}
                onChange={e => set('partnerCode', e.target.value.toUpperCase())}
                placeholder="AHMED2024" maxLength={20} dir="ltr" disabled={saving}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-mono uppercase tracking-widest outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <p className="text-[11px] text-muted-foreground">أحرف إنجليزية وأرقام فقط</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>البريد الإلكتروني *</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="partner@example.com" dir="ltr" disabled={saving} />
          </div>

          <div className="space-y-1.5">
            <Label>كلمة المرور *</Label>
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" disabled={saving} />
          </div>

          {/* نظام الدفع */}
          <div className="space-y-2">
            <Label>نظام الدفع *</Label>
            <div className="flex gap-2">
              {(['salary', 'commission'] as const).map(v => (
                <button key={v} type="button" onClick={() => setPaymentSystem(v)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${paymentSystem === v ? 'bg-primary text-white border-primary' : 'bg-background text-foreground border-border hover:border-primary'}`}>
                  {v === 'salary' ? '💰 راتب شهري' : '📊 نسبة عمولة'}
                </button>
              ))}
            </div>
          </div>

          {paymentSystem === 'salary' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الراتب الشهري (د.ع) *</Label>
                <Input type="number" min={0} value={form.monthlySalary} onChange={e => set('monthlySalary', e.target.value)} placeholder="250000" dir="ltr" disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label>المتاجر المطلوبة *</Label>
                <Input type="number" min={1} value={form.requiredStoresCount} onChange={e => set('requiredStoresCount', e.target.value)} placeholder="10" dir="ltr" disabled={saving} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>نسبة العمولة % <span className="text-muted-foreground font-normal text-xs">{paymentSystem === 'salary' ? '(إضافية بعد الهدف)' : '(على كل متجر)'}</span></Label>
            <Input type="number" min={0} max={100} value={form.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} placeholder="0" dir="ltr" disabled={saving} />
          </div>

          {/* خصم الباقة */}
          <div className="space-y-2">
            <Label>خصم على الباقات % <span className="text-muted-foreground font-normal text-xs">(يمنحه للمتاجر عبر كوده)</span></Label>
            <div className="flex flex-wrap gap-2">
              {DISCOUNT_PRESETS.map(p => (
                <button key={p} type="button" onClick={() => setPackageDiscountPercent(p)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold border transition-all ${packageDiscountPercent === p ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary'}`}>
                  {p === 0 ? 'بدون خصم' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={saving}>إلغاء</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Handshake className="h-4 w-4" />
              {saving ? 'جاري الإنشاء…' : 'إنشاء الحساب'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
CreatePartnerDialog.displayName = 'CreatePartnerDialog';

// ─── نموذج تعديل الشريك ──────────────────────────────────────────────────────
const EditPartnerDialog = React.memo(function EditPartnerDialog({
  isOpen, onOpenChange, partner, packages, onUpdated,
}: {
  isOpen: boolean; onOpenChange: (v: boolean) => void;
  partner: User | null; packages?: StorePackage[];
  onUpdated?: (id: string, updates: Partial<User>) => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [paymentSystem, setPaymentSystem] = useState<'salary' | 'commission'>((partner?.paymentSystem as any) ?? 'salary');
  const [packageDiscountPercent, setPackageDiscountPercent] = useState(partner?.packageDiscountPercent ?? 0);
  // نقاط الباقات: { [packageId]: points }
  const [pkgPoints, setPkgPoints] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: partner?.name ?? '',
    monthlySalary: partner?.monthlySalary?.toString() ?? '',
    requiredStoresCount: partner?.requiredStoresCount?.toString() ?? '',
    commissionPercent: partner?.commissionPercent?.toString() ?? '',
  });

  React.useEffect(() => {
    if (partner) {
      setPaymentSystem((partner.paymentSystem as any) ?? 'salary');
      setPackageDiscountPercent(partner.packageDiscountPercent ?? 0);
      setForm({
        name: partner.name ?? '',
        monthlySalary: partner.monthlySalary?.toString() ?? '',
        requiredStoresCount: partner.requiredStoresCount?.toString() ?? '',
        commissionPercent: partner.commissionPercent?.toString() ?? '',
      });
      // تهيئة نقاط الباقات من بيانات الشريك
      const existing: Record<string, string> = {};
      if (partner.packagePoints) {
        Object.entries(partner.packagePoints).forEach(([k, v]) => {
          existing[k] = String(v);
        });
      }
      setPkgPoints(existing);
    }
  }, [partner]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const setPkgPt = (pkgId: string, v: string) => setPkgPoints(p => ({ ...p, [pkgId]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner?.id) return;
    if (!form.name.trim()) { toast({ variant: "destructive", title: "أدخل الاسم الكامل" }); return; }
    setSaving(true);
    try {
      // بناء map نقاط الباقات (نُبقي فقط القيم الصالحة > 0)
      const packagePointsMap: Record<string, number> = {};
      Object.entries(pkgPoints).forEach(([k, v]) => {
        const n = Number(v);
        if (n > 0) packagePointsMap[k] = n;
      });

      const updates: Partial<User> = {
        name: form.name.trim(), paymentSystem, packageDiscountPercent,
        commissionPercent: Number(form.commissionPercent) || 0,
        packagePoints: Object.keys(packagePointsMap).length > 0 ? packagePointsMap : null,
        ...(paymentSystem === 'salary' && {
          monthlySalary: Number(form.monthlySalary) || 0,
          requiredStoresCount: Number(form.requiredStoresCount) || 0,
        }),
      };
      onUpdated?.(partner.id, updates);
      toast({ title: "✅ تم تحديث البيانات بنجاح" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التحديث", description: err?.message });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg max-h-[92vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل البيانات</DialogTitle>
          {partner?.partnerCode && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">الكود:</span>
              <CodeChip code={partner.partnerCode} />
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>الاسم الكامل *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} disabled={saving} />
          </div>

          <div className="space-y-2">
            <Label>نظام الدفع</Label>
            <div className="flex gap-2">
              {(['salary', 'commission'] as const).map(v => (
                <button key={v} type="button" onClick={() => setPaymentSystem(v)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${paymentSystem === v ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary'}`}>
                  {v === 'salary' ? '💰 راتب شهري' : '📊 نسبة عمولة'}
                </button>
              ))}
            </div>
          </div>

          {paymentSystem === 'salary' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الراتب الشهري (د.ع)</Label>
                <Input type="number" min={0} value={form.monthlySalary} onChange={e => set('monthlySalary', e.target.value)} dir="ltr" disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label>
                  الهدف الشهري (نقاط)
                  <span className="text-[10px] text-muted-foreground font-normal mr-1">
                    — تُحتسب بنقاط الباقة أدناه
                  </span>
                </Label>
                <Input type="number" min={1} value={form.requiredStoresCount} onChange={e => set('requiredStoresCount', e.target.value)} dir="ltr" disabled={saving} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>نسبة العمولة % <span className="text-muted-foreground font-normal text-xs">{paymentSystem === 'salary' ? '(إضافية بعد الهدف)' : '(على كل متجر)'}</span></Label>
            <Input type="number" min={0} max={100} value={form.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} dir="ltr" disabled={saving} />
          </div>

          {/* ── نقاط الباقات (خاصة بهذا الشريك) ── */}
          {packages && packages.filter(p => p.isActive).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package2 className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-sm">نقاط كل باقة نحو الهدف</Label>
                <span className="text-[10px] text-muted-foreground">(الافتراضي: 1 نقطة)</span>
              </div>
              <div className="rounded-xl border border-border/60 divide-y divide-border/40 overflow-hidden">
                {packages.filter(p => p.isActive).map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-muted/20">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{pkg.name}</p>
                      <p className="text-[11px] text-muted-foreground">{pkg.price.toLocaleString('ar-IQ')} د.ع</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number" min="1" max="20" step="1"
                        value={pkgPoints[pkg.id] ?? '1'}
                        onChange={e => setPkgPt(pkg.id, e.target.value)}
                        disabled={saving}
                        className="w-14 h-8 text-center text-sm font-bold rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        dir="ltr"
                      />
                      <span className="text-xs text-muted-foreground">نقطة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>خصم على الباقات %</Label>
            <div className="flex flex-wrap gap-2">
              {DISCOUNT_PRESETS.map(p => (
                <button key={p} type="button" onClick={() => setPackageDiscountPercent(p)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold border transition-all ${packageDiscountPercent === p ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary'}`}>
                  {p === 0 ? 'بدون خصم' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
            <Button type="submit" disabled={saving}>{saving ? 'جاري الحفظ…' : '✅ حفظ التغييرات'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
EditPartnerDialog.displayName = 'EditPartnerDialog';

// ─── بطاقة شريك ──────────────────────────────────────────────────────────────
function PartnerCard({ partner, storeCount, activeStoreCount, onEdit, onDelete, onResetActivations }: {
  partner: User;
  storeCount: number;
  activeStoreCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onResetActivations: () => void;
}) {
  const monthlyActs = partner.monthlyActivations ?? 0;
  const requiredActs = partner.requiredStoresCount ?? 0;
  const progress = partner.paymentSystem === 'salary' && requiredActs > 0
    ? Math.min(100, Math.round((monthlyActs / requiredActs) * 100))
    : 0;

  return (
    <Card className="border border-border/70 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* الرأس */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm leading-tight truncate">{partner.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{partner.email}</p>
          </div>
          {partner.partnerCode && <CodeChip code={partner.partnerCode} />}
        </div>

        {/* شارة نظام الدفع */}
        <div><PaymentBadge partner={partner} /></div>

        {/* الإحصاءات */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <StoreIcon className="h-3 w-3" />
              <span className="text-[10px]">المتاجر</span>
            </div>
            <p className="text-lg font-black leading-none">{storeCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{activeStoreCount} نشط</p>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-[10px]">إجمالي الأرباح</span>
            </div>
            <p className="text-sm font-black leading-none text-emerald-600">
              {(partner.totalEarnings ?? 0).toLocaleString('ar-IQ')}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">د.ع</p>
          </div>
        </div>

        {/* تقدم الهدف الشهري */}
        {partner.paymentSystem === 'salary' && (partner.requiredStoresCount ?? 0) > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>الهدف الشهري</span>
              </div>
              <span className="font-bold">{monthlyActs} / {requiredActs}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress >= 60 ? 'bg-blue-500' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{progress}% مكتمل</span>
              <button
                type="button"
                onClick={onResetActivations}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition"
              >
                <RotateCcw className="h-2.5 w-2.5" /> إعادة تعيين الشهر
              </button>
            </div>
          </div>
        )}

        {/* خصم الباقة */}
        {(partner.packageDiscountPercent ?? 0) > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" />
            يمنح خصم {partner.packageDiscountPercent}% على الباقات
          </div>
        )}

        {/* الأزرار */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" /> تعديل
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1 text-xs h-8 px-3">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle></AlertDialogHeader>
              <AlertDialogDescription>سيتم حذف حساب <strong>{partner.name}</strong> نهائياً.</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── التبويب الرئيسي ──────────────────────────────────────────────────────────
export function PartnersTab({
  representatives,
  stores,
  packages,
  onRepresentativeAdded,
  onRepresentativeDeleted,
  onRepresentativeUpdated,
  onRefresh,
}: {
  representatives: User[];
  stores: Store[];
  packages?: StorePackage[];
  onRepresentativeAdded?: () => void;
  onRepresentativeDeleted?: (id: string) => void;
  onRepresentativeUpdated?: (id: string, updates: Partial<User>) => void;
  onRefresh?: () => void;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [editingPartner, setEditingPartner] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const storeCount       = (id: string) => stores.filter(s => s.registeredByAgentId === id).length;
  const activeStoreCount = (id: string) => stores.filter(s => s.registeredByAgentId === id && s.isActive).length;

  const handleDelete = async (id: string) => {
    const count = storeCount(id);
    if (count > 0) {
      toast({ variant: "destructive", title: "❌ لا يمكن الحذف", description: `هذا الحساب لديه ${count} متجر مرتبط. يجب نقلها أولاً.` });
      return;
    }
    onRepresentativeDeleted?.(id);
  };

  const handleResetActivations = async (partner: User) => {
    try {
      await supabase.from('users').update({
        monthly_activations: 0,
        monthlyActivations: 0,
        last_reset_date: new Date().toISOString(),
      }).eq('id', partner.id);
      onRepresentativeUpdated?.(partner.id, { monthlyActivations: 0, lastResetDate: new Date().toISOString() });
      toast({ title: '✅ تم إعادة تعيين التفعيلات الشهرية' });
    } catch {
      toast({ variant: 'destructive', title: 'فشل إعادة التعيين' });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return representatives;
    return representatives.filter(p =>
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.partnerCode ?? '').toLowerCase().includes(q)
    );
  }, [representatives, search]);

  // ملخص سريع
  const totalEarnings     = representatives.reduce((s, r) => s + (r.totalEarnings ?? 0), 0);
  const totalStores       = representatives.reduce((s, r) => s + storeCount(r.id), 0);
  const totalActivations  = representatives.reduce((s, r) => s + (r.monthlyActivations ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* ── ملخص سريع ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'الشركاء',         value: representatives.length, cls: 'text-primary',     bg: 'bg-primary/8'   },
          { label: 'متاجر مسجلة',     value: totalStores,            cls: 'text-blue-600',    bg: 'bg-blue-50'     },
          { label: 'تفعيلات الشهر',   value: totalActivations,       cls: 'text-emerald-600', bg: 'bg-emerald-50'  },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border border-border/40 ${item.bg} p-3 text-center`}>
            <p className={`text-2xl font-black ${item.cls}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── الهيدر ── */}
      <Card className="shadow-sm">
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-3 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Handshake className="w-5 h-5 text-primary" />
              إدارة الشركاء ({representatives.length})
            </CardTitle>
            <CardDescription>تتبع أداء ومستحقات شركاء التسويق</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5 text-xs h-8">
                <RefreshCw className="w-3.5 h-3.5" /> تحديث
              </Button>
            )}
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5 text-xs h-8">
              <UserPlus className="w-3.5 h-3.5" /> إضافة مسوّق
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* بحث */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو البريد أو الكود..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pr-9 h-9"
            />
          </div>

          {representatives.length === 0 ? (
            <div className="text-center py-16">
              <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-30" strokeWidth={1.5} />
              <p className="text-muted-foreground text-sm">لا يوجد شركاء مسجلون حتى الآن</p>
              <Button className="mt-4 gap-2" onClick={() => setIsCreateOpen(true)}>
                <UserPlus className="h-4 w-4" /> إضافة أول مسوّق
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">لا توجد نتائج للبحث</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => (
                <PartnerCard
                  key={p.id}
                  partner={p}
                  storeCount={storeCount(p.id)}
                  activeStoreCount={activeStoreCount(p.id)}
                  onEdit={() => { setEditingPartner(p); setIsEditOpen(true); }}
                  onDelete={() => handleDelete(p.id)}
                  onResetActivations={() => handleResetActivations(p)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── إجمالي الأرباح ── */}
      {totalEarnings > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>إجمالي المستحقات المدفوعة لجميع الشركاء</span>
          </div>
          <span className="font-black text-base">{fmtMoney(totalEarnings)}</span>
        </div>
      )}

      <CreatePartnerDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onPartnerAdded={onRepresentativeAdded} />
      <EditPartnerDialog
        isOpen={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) setEditingPartner(null); }}
        partner={editingPartner} packages={packages} onUpdated={onRepresentativeUpdated}
      />
    </div>
  );
}
