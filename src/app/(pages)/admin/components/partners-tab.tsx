"use client";

import React, { useState } from "react";
import { Handshake, UserPlus, Edit, Trash2, Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, User } from "@/lib/types";
import { createRepresentative } from "@/services/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// ── نسب الخصم على الباقات ─────────────────────────────────
const DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25, 30];

// ── chip قابل للنسخ ───────────────────────────────────────
function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors"
    >
      {code}
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
    </button>
  );
}

// ── نموذج إنشاء شريك ─────────────────────────────────────
const CreatePartnerDialog = React.memo(function CreatePartnerDialog({
  isOpen, onOpenChange, onPartnerAdded,
}: { isOpen: boolean; onOpenChange: (v: boolean) => void; onPartnerAdded?: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [paymentSystem, setPaymentSystem] = useState<'salary' | 'commission'>('salary');
  const [packageDiscountPercent, setPackageDiscountPercent] = useState(0);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    partnerCode: '',
    monthlySalary: '', requiredStoresCount: '', commissionPercent: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const reset = () => {
    setForm({ name: '', email: '', password: '', partnerCode: '', monthlySalary: '', requiredStoresCount: '', commissionPercent: '' });
    setPaymentSystem('salary');
    setPackageDiscountPercent(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.partnerCode.trim()) {
      toast({ variant: "destructive", title: "الرجاء ملء جميع الحقول الإلزامية" }); return;
    }
    if (!/^[A-Z0-9_-]{2,20}$/.test(form.partnerCode)) {
      toast({ variant: "destructive", title: "الكود يجب أن يكون أحرف إنجليزية/أرقام (2-20 حرف)" }); return;
    }
    if (paymentSystem === 'salary' && (!form.monthlySalary || !form.requiredStoresCount)) {
      toast({ variant: "destructive", title: "أدخل الراتب وعدد المتاجر المطلوب" }); return;
    }
    const commissionPct = Number(form.commissionPercent) || 0;

    setSaving(true);
    try {
      const result = await createRepresentative({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        paymentSystem,
        monthlySalary: paymentSystem === 'salary' ? Number(form.monthlySalary) : undefined,
        requiredStoresCount: paymentSystem === 'salary' ? Number(form.requiredStoresCount) : undefined,
        commissionPercent: commissionPct,
        packageDiscountPercent,
        partnerCode: form.partnerCode.trim(),
      });
      if (result?.success === false) throw new Error(result.error);
      toast({ title: "✅ تم إنشاء حساب الشريك", description: `الكود: ${form.partnerCode}` });
      reset(); onOpenChange(false); onPartnerAdded?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل إنشاء الشريك", description: err?.message });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" /> إضافة شريك جديد
          </DialogTitle>
          <DialogDescription>أنشئ حساب شريك تسويق مع كود خاص وشروط واضحة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* الاسم */}
          <div className="space-y-1.5">
            <Label>الاسم الكامل *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: أحمد علي" disabled={saving} />
          </div>

          {/* البريد */}
          <div className="space-y-1.5">
            <Label>البريد الإلكتروني *</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="partner@example.com" dir="ltr" disabled={saving} />
          </div>

          {/* كلمة المرور */}
          <div className="space-y-1.5">
            <Label>كلمة المرور *</Label>
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" disabled={saving} />
          </div>

          {/* كود الشريك */}
          <div className="space-y-1.5">
            <Label>كود الشريك *</Label>
            <input
              type="text"
              value={form.partnerCode}
              onChange={e => set('partnerCode', e.target.value.toUpperCase())}
              placeholder="مثال: AHMED2024"
              maxLength={20}
              dir="ltr"
              disabled={saving}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-mono uppercase tracking-widest outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
            />
            <p className="text-xs text-slate-400">أحرف إنجليزية وأرقام فقط — يدخله صاحب المتجر عند التسجيل</p>
          </div>

          {/* نظام الدفع */}
          <div className="space-y-2">
            <Label>نظام الدفع *</Label>
            <div className="flex gap-2">
              {([['salary', '💰 راتب شهري'], ['commission', '📊 نسبة فقط']] as [string, string][]).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setPaymentSystem(v as 'salary' | 'commission')}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${paymentSystem === v ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {paymentSystem === 'salary' && (
            <>
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
              <div className="space-y-1.5">
                <Label>نسبة عمولة إضافية % <span className="text-slate-400 font-normal">(على كل متجر بعد الهدف)</span></Label>
                <Input type="number" min={0} max={100} value={form.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} placeholder="0" dir="ltr" disabled={saving} />
              </div>
            </>
          )}

          {paymentSystem === 'commission' && (
            <div className="space-y-1.5">
              <Label>نسبة العمولة % <span className="text-slate-400 font-normal">(على كل متجر)</span></Label>
              <Input type="number" min={0} max={100} value={form.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} placeholder="10" dir="ltr" disabled={saving} />
            </div>
          )}

          {/* خصم الباقة */}
          <div className="space-y-2">
            <Label>خصم على الباقات % <span className="text-slate-400 font-normal">(يمنحه للمتاجر عبر كوده)</span></Label>
            <div className="flex flex-wrap gap-2">
              {DISCOUNT_PRESETS.map(p => (
                <button key={p} type="button" onClick={() => setPackageDiscountPercent(p)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold border transition-all ${packageDiscountPercent === p ? 'bg-primary text-white border-primary scale-105' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}>
                  {p === 0 ? 'بدون خصم' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={saving}>إلغاء</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Handshake className="h-4 w-4" />
              {saving ? 'جاري الإنشاء…' : 'إنشاء الشريك'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
CreatePartnerDialog.displayName = 'CreatePartnerDialog';

// ── نموذج تعديل الشريك ────────────────────────────────────
const EditPartnerDialog = React.memo(function EditPartnerDialog({
  isOpen, onOpenChange, partner, onUpdated,
}: { isOpen: boolean; onOpenChange: (v: boolean) => void; partner: User | null; onUpdated?: (id: string, updates: Partial<User>) => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [paymentSystem, setPaymentSystem] = useState<'salary' | 'commission'>((partner?.paymentSystem as any) ?? 'salary');
  const [packageDiscountPercent, setPackageDiscountPercent] = useState(partner?.packageDiscountPercent ?? 0);
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
    }
  }, [partner]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner?.id) return;
    if (!form.name.trim()) { toast({ variant: "destructive", title: "أدخل الاسم" }); return; }
    setSaving(true);
    try {
      const updates: Partial<User> = {
        name: form.name.trim(),
        paymentSystem,
        packageDiscountPercent,
        commissionPercent: Number(form.commissionPercent) || 0,
        ...(paymentSystem === 'salary' && {
          monthlySalary: Number(form.monthlySalary) || 0,
          requiredStoresCount: Number(form.requiredStoresCount) || 0,
        }),
      };
      onUpdated?.(partner.id, updates);
      toast({ title: "✅ تم تحديث بيانات الشريك" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التحديث", description: err?.message });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الشريك</DialogTitle>
          {partner?.partnerCode && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">الكود:</span>
              <CodeChip code={partner.partnerCode} />
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>الاسم الكامل *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} disabled={saving} />
          </div>

          <div className="space-y-2">
            <Label>نظام الدفع</Label>
            <div className="flex gap-2">
              {([['salary', '💰 راتب شهري'], ['commission', '📊 نسبة فقط']] as [string, string][]).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setPaymentSystem(v as 'salary' | 'commission')}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${paymentSystem === v ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {paymentSystem === 'salary' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الراتب الشهري (د.ع)</Label>
                  <Input type="number" min={0} value={form.monthlySalary} onChange={e => set('monthlySalary', e.target.value)} dir="ltr" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label>المتاجر المطلوبة</Label>
                  <Input type="number" min={1} value={form.requiredStoresCount} onChange={e => set('requiredStoresCount', e.target.value)} dir="ltr" disabled={saving} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>نسبة عمولة إضافية % <span className="text-slate-400 font-normal">(بعد الهدف)</span></Label>
                <Input type="number" min={0} max={100} value={form.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} dir="ltr" disabled={saving} />
              </div>
            </>
          )}

          {paymentSystem === 'commission' && (
            <div className="space-y-1.5">
              <Label>نسبة العمولة %</Label>
              <Input type="number" min={0} max={100} value={form.commissionPercent} onChange={e => set('commissionPercent', e.target.value)} dir="ltr" disabled={saving} />
            </div>
          )}

          <div className="space-y-2">
            <Label>خصم على الباقات %</Label>
            <div className="flex flex-wrap gap-2">
              {DISCOUNT_PRESETS.map(p => (
                <button key={p} type="button" onClick={() => setPackageDiscountPercent(p)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold border transition-all ${packageDiscountPercent === p ? 'bg-primary text-white border-primary scale-105' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}>
                  {p === 0 ? 'بدون خصم' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
            <Button type="submit" disabled={saving}>{saving ? 'جاري الحفظ…' : '✅ حفظ التغييرات'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
EditPartnerDialog.displayName = 'EditPartnerDialog';

// ── التبويب الرئيسي ───────────────────────────────────────
export function PartnersTab({
  representatives,
  stores,
  onRepresentativeAdded,
  onRepresentativeDeleted,
  onRepresentativeUpdated,
  onRefresh,
}: {
  representatives: User[];
  stores: Store[];
  onRepresentativeAdded?: () => void;
  onRepresentativeDeleted?: (id: string) => void;
  onRepresentativeUpdated?: (id: string, updates: Partial<User>) => void;
  onRefresh?: () => void;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<User | null>(null);
  const { toast } = useToast();

  const storeCount = (id: string) => stores.filter(s => s.registeredByAgentId === id).length;

  const handleDelete = async (id: string) => {
    const count = storeCount(id);
    if (count > 0) {
      toast({ variant: "destructive", title: "❌ لا يمكن الحذف", description: `هذا الشريك لديه ${count} متجر مرتبط. يجب نقلها أولاً.` });
      return;
    }
    onRepresentativeDeleted?.(id);
  };

  const paymentLabel = (p: User) => {
    if (p.paymentSystem === 'salary') return `💰 ${(p.monthlySalary ?? 0).toLocaleString()} د.ع / شهر`;
    return `📊 ${p.commissionPercent ?? 0}% / متجر`;
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Handshake className="w-5 h-5 text-primary" />
            إدارة الشركاء ({representatives.length})
          </CardTitle>
          <CardDescription>إضافة وتتبع أداء ومستحقات شركاء التسويق</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" /> تحديث
            </Button>
          )}
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> إضافة شريك
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {representatives.length === 0 ? (
          <div className="text-center py-16">
            <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm">لا يوجد شركاء مسجلون حتى الآن</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-4 sm:hidden">
              {representatives.map(p => (
                <div key={p.id} className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                    {p.partnerCode && <CodeChip code={p.partnerCode} />}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">نظام الدفع</p>
                      <p className="font-semibold mt-0.5">{paymentLabel(p)}</p>
                    </div>
                    {p.paymentSystem === 'salary' && (
                      <div>
                        <p className="text-muted-foreground">الهدف الشهري</p>
                        <p className="font-semibold mt-0.5">{p.requiredStoresCount ?? '-'} متجر</p>
                      </div>
                    )}
                    {(p.commissionPercent ?? 0) > 0 && (
                      <div>
                        <p className="text-muted-foreground">{p.paymentSystem === 'salary' ? 'عمولة بعد الهدف' : 'نسبة العمولة'}</p>
                        <p className="font-semibold mt-0.5 text-primary">{p.commissionPercent}%</p>
                      </div>
                    )}
                    {(p.packageDiscountPercent ?? 0) > 0 && (
                      <div>
                        <p className="text-muted-foreground">خصم الباقة</p>
                        <p className="font-semibold mt-0.5 text-emerald-600">{p.packageDiscountPercent}%</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">المتاجر المسجلة</p>
                      <p className="font-bold mt-0.5">{storeCount(p.id)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setEditingPartner(p); setIsEditOpen(true); }}>
                      <Edit className="h-3.5 w-3.5" /> تعديل
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="flex-1 gap-1">
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>حذف الشريك؟</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogDescription>سيتم حذف حساب {p.name} نهائياً.</AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                    <th className="px-4 py-3 text-right font-semibold">البريد</th>
                    <th className="px-4 py-3 text-right font-semibold">الكود</th>
                    <th className="px-4 py-3 text-right font-semibold">الدفع</th>
                    <th className="px-4 py-3 text-right font-semibold">الهدف</th>
                    <th className="px-4 py-3 text-right font-semibold">عمولة %</th>
                    <th className="px-4 py-3 text-right font-semibold">خصم الباقة</th>
                    <th className="px-4 py-3 text-right font-semibold">المتاجر</th>
                    <th className="px-4 py-3 text-right font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {representatives.map(p => (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.email}</td>
                      <td className="px-4 py-3">{p.partnerCode ? <CodeChip code={p.partnerCode} /> : <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{paymentLabel(p)}</td>
                      <td className="px-4 py-3">{p.paymentSystem === 'salary' ? `${p.requiredStoresCount ?? 0} متجر` : '—'}</td>
                      <td className="px-4 py-3">
                        {(p.commissionPercent ?? 0) > 0
                          ? <span className="font-bold text-primary">{p.commissionPercent}%</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {(p.packageDiscountPercent ?? 0) > 0
                          ? <span className="font-bold text-emerald-600">{p.packageDiscountPercent}%</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-bold">{storeCount(p.id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingPartner(p); setIsEditOpen(true); }}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>حذف الشريك؟</AlertDialogTitle></AlertDialogHeader>
                              <AlertDialogDescription>سيتم حذف حساب {p.name} نهائياً.</AlertDialogDescription>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>

      <CreatePartnerDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onPartnerAdded={() => { setIsCreateOpen(false); onRepresentativeAdded?.(); }} />
      <EditPartnerDialog isOpen={isEditOpen} onOpenChange={setIsEditOpen} partner={editingPartner} onUpdated={onRepresentativeUpdated} />
    </Card>
  );
}
