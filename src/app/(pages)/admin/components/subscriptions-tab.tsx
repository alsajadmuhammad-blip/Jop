"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PlusCircle, Edit, Trash2, Infinity, Package, Search, Store as StoreIcon, CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, StorePackage, PackageVisibility } from "@/lib/types";
import { createStorePackage, updateStorePackage, deleteStorePackage } from "@/services/supabase-db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── ثوابت ──────────────────────────────────────────────────────────────────
const VISIBILITY_META: Record<PackageVisibility, { label: string; cls: string; dot: string }> = {
  public:  { label: 'للعام',           cls: 'bg-blue-50 text-blue-700 border-blue-200',   dot: 'bg-blue-400'   },
  renewal: { label: 'للتجديد فقط',     cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400'  },
  both:    { label: 'للعام والتجديد',  cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-400'  },
};
const UNLIMITED = 999999;

function fmtPrice(n: number) { return n === 0 ? 'مجانية' : `${n.toLocaleString('ar-IQ')} د.ع`; }
function fmtLimit(n: number) {
  if (n >= UNLIMITED) return <span className="flex items-center gap-1 font-bold text-primary"><Infinity className="h-3.5 w-3.5" /> غير محدود</span>;
  return <span className="font-bold">{n.toLocaleString()}</span>;
}
function daysUntilExpiry(store: Store) {
  if (!store.activationDate || !store.subscriptionDuration) return null;
  const expiresAt = new Date(new Date(store.activationDate).getTime() + store.subscriptionDuration * 86400000);
  return Math.floor((expiresAt.getTime() - Date.now()) / 86400000);
}

// ─── بطاقة باقة ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, onEdit, onDelete, onToggle }: {
  pkg: StorePackage;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
}) {
  const vm = VISIBILITY_META[pkg.visibility ?? 'public'];
  return (
    <Card className={`border shadow-sm transition-all ${pkg.isActive ? 'border-border/70' : 'border-border/40 opacity-70'}`}>
      <CardContent className="p-4 space-y-3">
        {/* الاسم والحالة */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">{pkg.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{pkg.slug}</p>
          </div>
          <Switch checked={pkg.isActive} onCheckedChange={onToggle} />
        </div>

        {/* الشارات */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${vm.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${vm.dot}`} />
            {vm.label}
          </span>
          {!pkg.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500">
              موقوفة
            </span>
          )}
        </div>

        {/* التفاصيل */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 border border-border/40 p-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-1">السعر</p>
            <p className={`text-sm font-black ${pkg.price === 0 ? 'text-emerald-600' : 'text-primary'}`}>
              {pkg.price === 0 ? 'مجاني' : pkg.price.toLocaleString()}
            </p>
            {pkg.price > 0 && <p className="text-[10px] text-muted-foreground">د.ع</p>}
          </div>
          <div className="text-center border-x border-border/40">
            <p className="text-[10px] text-muted-foreground mb-1">المنتجات</p>
            <div className="flex justify-center">{fmtLimit(pkg.productLimit)}</div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-1">المدة</p>
            <p className="text-sm font-black">{pkg.subscriptionDuration}</p>
            <p className="text-[10px] text-muted-foreground">يوم</p>
          </div>
        </div>

        {/* المميزات */}
        {Array.isArray(pkg.metadata?.features) && pkg.metadata.features.length > 0 ? (
          <ul className="space-y-2 pt-2">
            {pkg.metadata.features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : pkg.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>
        ) : null}

        {/* أزرار */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" /> تعديل
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5 text-xs h-8 px-3" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── سطر تعيين باقة لمتجر ───────────────────────────────────────────────────
function StoreAssignRow({ store, packages, selected, onSelect, onAssign }: {
  store: Store;
  packages: StorePackage[];
  selected: string;
  onSelect: (v: string) => void;
  onAssign: () => void;
}) {
  const daysLeft = daysUntilExpiry(store);
  const isExpired   = store.isActive  && daysLeft !== null && daysLeft <= 0;
  const isExpiring  = store.isActive  && daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
  const isPending   = !store.isActive && !store.activationDate;
  const currentPkg  = packages.find(p => p.slug === store.packageName || p.id === store.packageId);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border/60 bg-white p-3">
      {/* معلومات المتجر */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className={`h-2 w-2 rounded-full shrink-0 ${isPending ? 'bg-amber-400' : isExpired ? 'bg-red-400' : store.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{store.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {currentPkg ? (
              <span className="flex items-center gap-1">
                <Package className="h-2.5 w-2.5" />{currentPkg.name}
              </span>
            ) : (
              <span className="text-amber-600">لا باقة</span>
            )}
            {daysLeft !== null && (
              <span className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : isExpiring ? 'text-orange-600' : ''}`}>
                <CalendarDays className="h-2.5 w-2.5" />
                {isExpired ? 'منتهي' : isPending ? 'غير مفعّل' : `${daysLeft}د`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* اختيار الباقة + تعيين */}
      <div className="flex items-center gap-2 shrink-0">
        <Select value={selected} onValueChange={onSelect}>
          <SelectTrigger className="w-[150px] sm:w-[180px] h-8 text-xs">
            <SelectValue placeholder="اختر باقة" />
          </SelectTrigger>
          <SelectContent>
            {packages.filter(p => p.isActive).map(p => (
              <SelectItem key={p.id} value={p.slug}>
                {p.name} — {fmtPrice(p.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 text-xs px-3 gap-1" onClick={onAssign} disabled={!selected}>
          تعيين
        </Button>
      </div>
    </div>
  );
}

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────────────
export function SubscriptionsTab({ stores, packages, onAssignPackage, onPackagesChanged }: {
  stores: Store[];
  packages: StorePackage[];
  onAssignPackage: (storeId: string, packageSlug: string) => Promise<void>;
  onPackagesChanged: () => Promise<void>;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<StorePackage | null>(null);
  const [formState, setFormState] = useState({
    name: '', slug: '', description: '', price: '',
    product_limit: '', unlimited_products: false,
    subscription_duration: '', is_active: true,
    visibility: 'public' as PackageVisibility,
    target_points: '1',
    features: [] as string[],
    newFeature: '',
  });
  const [deletePackage, setDeletePackage] = useState<StorePackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [selectedPkgByStore, setSelectedPkgByStore] = useState<Record<string, string>>({});
  const [storeSearch, setStoreSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const m: Record<string, string> = {};
    stores.forEach(s => { m[s.id] = s.packageName || packages.find(p => p.isActive)?.slug || ''; });
    setSelectedPkgByStore(m);
  }, [stores, packages]);

  const resetForm = () => {
    setFormState({ name: '', slug: '', description: '', price: '', product_limit: '', unlimited_products: false, subscription_duration: '', is_active: true, visibility: 'public', target_points: '1', features: [], newFeature: '' });
    setEditingPackage(null); setPackageError(null);
  };

  const slugify = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^ -\p{L}\p{N}-]+/gu, '')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');

  const openAdd = () => { resetForm(); setIsDialogOpen(true); };
  const openEdit = (pkg: StorePackage) => {
    setEditingPackage(pkg);
    setFormState({
      name: pkg.name, slug: pkg.slug, description: pkg.description || '',
      price: String(pkg.price),
      product_limit: pkg.productLimit >= UNLIMITED ? '' : String(pkg.productLimit),
      unlimited_products: pkg.productLimit >= UNLIMITED,
      subscription_duration: String(pkg.subscriptionDuration),
      is_active: pkg.isActive, visibility: pkg.visibility ?? 'public',
      target_points: String(pkg.targetPoints ?? 1),
      features: Array.isArray(pkg.metadata?.features) ? pkg.metadata.features : [],
      newFeature: '',
    });
    setPackageError(null); setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setPackageError(null);
    if (!formState.name.trim()) { setPackageError('أدخل اسم الباقة'); return; }
    if (Number(formState.price) < 0) { setPackageError('أدخل سعراً صحيحاً'); return; }
    if (!formState.unlimited_products && Number(formState.product_limit) <= 0) { setPackageError('أدخل حد منتجات أو فعّل غير محدود'); return; }
    if (Number(formState.subscription_duration) <= 0) { setPackageError('أدخل مدة اشتراك صحيحة'); return; }
    const slug = formState.slug.trim() || slugify(formState.name);
    if (!slug) { setPackageError('أدخل معرّف صالح'); return; }
    const productLimit = formState.unlimited_products ? UNLIMITED : Number(formState.product_limit);
    setIsSubmitting(true);
    try {
      const targetPts = Math.max(1, Number(formState.target_points) || 1);
      const payload = {
        name: formState.name, slug, description: formState.description || undefined,
        price: Number(formState.price), productLimit,
        subscriptionDuration: Number(formState.subscription_duration),
        isActive: formState.is_active, visibility: formState.visibility,
        targetPoints: targetPts,
        metadata: formState.features.length > 0 ? { features: formState.features } : null,
      };
      if (editingPackage) {
        const r = await updateStorePackage(editingPackage.id, payload);
        if (!r) throw new Error('فشل التحديث');
        toast({ title: '✅ تم تحديث الباقة' });
      } else {
        const r = await createStorePackage(payload);
        if (!r) throw new Error('فشل الإنشاء');
        toast({ title: '✅ تم إنشاء الباقة' });
      }
      await onPackagesChanged(); setIsDialogOpen(false); resetForm();
    } catch (err: any) {
      setPackageError(err.message || 'حدث خطأ');
    } finally { setIsSubmitting(false); }
  };

  const handleDeletePkg = async () => {
    if (!deletePackage) return;
    setIsSubmitting(true);
    try {
      if (!await deleteStorePackage(deletePackage.id)) throw new Error('فشل الحذف');
      toast({ title: '✅ تم حذف الباقة' }); setDeletePackage(null); await onPackagesChanged();
    } catch (err: any) {
      toast({ title: '❌ فشل الحذف', description: err.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const handleToggleActive = async (pkg: StorePackage, v: boolean) => {
    try {
      if (!await updateStorePackage(pkg.id, { isActive: v })) throw new Error();
      toast({ title: v ? '✅ تم تفعيل الباقة' : '✅ تم إيقاف الباقة' }); await onPackagesChanged();
    } catch {
      toast({ title: '❌ فشل تغيير الحالة', variant: 'destructive' });
    }
  };

  const handleAssign = async (storeId: string) => {
    const slug = selectedPkgByStore[storeId];
    if (!slug) { toast({ title: 'اختر باقة أولاً', variant: 'destructive' }); return; }
    try { await onAssignPackage(storeId, slug); } catch (e: any) {
      toast({ title: 'فشل التعيين', description: e.message, variant: 'destructive' });
    }
  };

  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(s => s.name.toLowerCase().includes(q) || (s.packageName ?? '').toLowerCase().includes(q));
  }, [stores, storeSearch]);

  const activePackages = packages.filter(p => p.isActive).length;

  return (
    <div className="space-y-5">
      {/* ── ملخص سريع ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'إجمالي الباقات', value: packages.length,  cls: 'text-primary',     bg: 'bg-primary/8'  },
          { label: 'مفعّلة',          value: activePackages,   cls: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'موقوفة',          value: packages.length - activePackages, cls: 'text-slate-500', bg: 'bg-slate-50' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border border-border/40 ${item.bg} p-3 text-center`}>
            <p className={`text-2xl font-black ${item.cls}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="packages" className="gap-2 text-xs">
            <Package className="h-3.5 w-3.5" /> الباقات ({packages.length})
          </TabsTrigger>
          <TabsTrigger value="assign" className="gap-2 text-xs">
            <StoreIcon className="h-3.5 w-3.5" /> تعيين للمتاجر ({stores.length})
          </TabsTrigger>
        </TabsList>

        {/* ── تبويب الباقات ── */}
        <TabsContent value="packages" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">إدارة خطط الاشتراك المتاحة</p>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={openAdd}>
              <PlusCircle className="h-3.5 w-3.5" /> إضافة باقة
            </Button>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد باقات مسجّلة بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <PackageCard
                  key={pkg.id} pkg={pkg}
                  onEdit={() => openEdit(pkg)}
                  onDelete={() => setDeletePackage(pkg)}
                  onToggle={v => handleToggleActive(pkg, v)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── تبويب التعيين ── */}
        <TabsContent value="assign" className="mt-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المتجر..."
                value={storeSearch} onChange={e => setStoreSearch(e.target.value)}
                className="pr-9 h-9 text-sm"
              />
            </div>

            {filteredStores.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">لا توجد متاجر</div>
            ) : (
              <div className="space-y-2">
                {filteredStores.map(store => (
                  <StoreAssignRow
                    key={store.id}
                    store={store}
                    packages={packages}
                    selected={selectedPkgByStore[store.id] || ''}
                    onSelect={v => setSelectedPkgByStore(c => ({ ...c, [store.id]: v }))}
                    onAssign={() => handleAssign(store.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ════ نافذة إضافة / تعديل الباقة ════ */}
      <Dialog open={isDialogOpen} onOpenChange={v => { if (!v) resetForm(); setIsDialogOpen(v); }}>
        <DialogContent className="w-full max-w-lg max-h-[92vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage ? 'عدّل تفاصيل الباقة ثم احفظ' : 'أضف باقة اشتراك جديدة مع تحديد شروطها'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>اسم الباقة *</Label>
                <Input value={formState.name} onChange={e => setFormState(s => ({ ...s, name: e.target.value }))} placeholder="الباقة الذهبية" />
              </div>
              <div className="space-y-1.5">
                <Label>المعرّف (Slug)</Label>
                <Input value={formState.slug} onChange={e => setFormState(s => ({ ...s, slug: e.target.value }))} placeholder="gold-plan" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>السعر (د.ع) *</Label>
                <Input type="number" min="0" value={formState.price} onChange={e => setFormState(s => ({ ...s, price: e.target.value }))} placeholder="0" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label>المدة (أيام) *</Label>
                <Input type="number" min="1" value={formState.subscription_duration} onChange={e => setFormState(s => ({ ...s, subscription_duration: e.target.value }))} placeholder="30" dir="ltr" />
              </div>
            </div>

            {/* حد المنتجات */}
            <div className="space-y-2">
              <Label>حد المنتجات *</Label>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <Checkbox
                  id="unlimited"
                  checked={formState.unlimited_products}
                  onCheckedChange={v => setFormState(s => ({ ...s, unlimited_products: !!v, product_limit: '' }))}
                />
                <label htmlFor="unlimited" className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <Infinity className="h-4 w-4 text-primary" /> منتجات غير محدودة
                </label>
              </div>
              {!formState.unlimited_products && (
                <Input type="number" min="1" value={formState.product_limit} onChange={e => setFormState(s => ({ ...s, product_limit: e.target.value }))} placeholder="مثال: 50" dir="ltr" />
              )}
            </div>

            {/* الظهور */}
            <div className="space-y-1.5">
              <Label>ظهور الباقة</Label>
              <Select value={formState.visibility} onValueChange={v => setFormState(s => ({ ...s, visibility: v as PackageVisibility }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">للعام — تظهر عند إنشاء متجر جديد</SelectItem>
                  <SelectItem value="renewal">للتجديد فقط — مخفية عن الجديد</SelectItem>
                  <SelectItem value="both">للعام والتجديد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الوصف */}
            <div className="space-y-1.5">
              <Label>الوصف <span className="text-muted-foreground text-xs">(اختياري)</span></Label>
              <Textarea value={formState.description} onChange={e => setFormState(s => ({ ...s, description: e.target.value }))} rows={2} placeholder="وصف مختصر..." />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>مميزات الباقة</Label>
                  <p className="text-xs text-muted-foreground">أضف مميزات تظهر في صفحة التسجيل العامة.</p>
                </div>
                <Button
                  type="button"
                  className="h-9 text-xs px-3"
                  onClick={() => {
                    const value = formState.newFeature.trim();
                    if (!value) return;
                    if (formState.features.includes(value)) return;
                    setFormState(s => ({ ...s, features: [...s.features, value], newFeature: '' }));
                  }}
                >أضف ميزة</Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={formState.newFeature}
                  onChange={e => setFormState(s => ({ ...s, newFeature: e.target.value }))}
                  placeholder="مثال: دعم فني 24/7"
                />
                <Button
                  type="button"
                  className="h-9 w-full sm:w-auto text-xs px-3"
                  onClick={() => {
                    const value = formState.newFeature.trim();
                    if (!value) return;
                    if (formState.features.includes(value)) return;
                    setFormState(s => ({ ...s, features: [...s.features, value], newFeature: '' }));
                  }}
                >أضف</Button>
              </div>
              {formState.features.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {formState.features.map((feature, idx) => (
                    <div key={feature} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                        <span>{feature}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormState(s => ({ ...s, features: s.features.filter((_, index) => index !== idx) }))}
                        className="text-xs text-rose-500 hover:text-rose-700"
                      >حذف</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* تفعيل */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                {formState.is_active
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <XCircle className="h-4 w-4 text-muted-foreground" />}
                <span>{formState.is_active ? 'الباقة مفعّلة' : 'الباقة موقوفة'}</span>
              </div>
              <Switch checked={formState.is_active} onCheckedChange={v => setFormState(s => ({ ...s, is_active: v }))} />
            </div>

            {packageError && (
              <Alert variant="destructive">
                <AlertDescription>{packageError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }} disabled={isSubmitting}>إلغاء</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '⏳ جاري الحفظ...' : editingPackage ? '✅ حفظ التغييرات' : '✅ إنشاء الباقة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════ تأكيد الحذف ════ */}
      <AlertDialog open={!!deletePackage} onOpenChange={v => !v && setDeletePackage(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الباقة؟</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            سيتم حذف باقة <strong>{deletePackage?.name}</strong> نهائياً. المتاجر التي تستخدمها لن تتأثر فورياً لكن لن تتجدد.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePkg} disabled={isSubmitting} className="bg-destructive text-destructive-foreground">
              {isSubmitting ? 'جاري الحذف...' : 'نعم، احذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
