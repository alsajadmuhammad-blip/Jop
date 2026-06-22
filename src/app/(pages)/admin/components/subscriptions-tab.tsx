"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Edit, Trash2, Infinity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, StorePackage, PackageVisibility } from "@/lib/types";
import { createStorePackage, updateStorePackage, deleteStorePackage } from "@/services/supabase-db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

/* ─── ملصق الظهور ─── */
const VISIBILITY_LABELS: Record<PackageVisibility, string> = {
  public:  'للعام',
  renewal: 'للتجديد فقط',
  both:    'للعام والتجديد',
};
const VISIBILITY_COLORS: Record<PackageVisibility, string> = {
  public:  'bg-blue-50 text-blue-700 border-blue-200',
  renewal: 'bg-amber-50 text-amber-700 border-amber-200',
  both:    'bg-green-50 text-green-700 border-green-200',
};

const UNLIMITED = 999999;

export function SubscriptionsTab({
  stores,
  packages,
  onAssignPackage,
  onPackagesChanged,
}: {
  stores: Store[];
  packages: StorePackage[];
  onAssignPackage: (storeId: string, packageSlug: string) => Promise<void>;
  onPackagesChanged: () => Promise<void>;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<StorePackage | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    product_limit: '',
    unlimited_products: false,
    subscription_duration: '',
    is_active: false,
    visibility: 'public' as PackageVisibility,
  });
  const [deletePackage, setDeletePackage] = useState<StorePackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [selectedPackageByStore, setSelectedPackageByStore] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const selection: Record<string, string> = {};
    stores.forEach((store) => {
      selection[store.id] = store.packageName || packages.find((pkg) => pkg.isActive)?.slug || '';
    });
    setSelectedPackageByStore(selection);
  }, [stores, packages]);

  const resetForm = () => {
    setFormState({
      name: '',
      slug: '',
      description: '',
      price: '',
      product_limit: '',
      unlimited_products: false,
      subscription_duration: '',
      is_active: false,
      visibility: 'public',
    });
    setEditingPackage(null);
    setPackageError(null);
  };

  const openAddPackageDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditPackageDialog = (pkg: StorePackage) => {
    const isUnlimited = pkg.productLimit >= UNLIMITED;
    setEditingPackage(pkg);
    setFormState({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description || '',
      price: String(pkg.price),
      product_limit: isUnlimited ? '' : String(pkg.productLimit),
      unlimited_products: isUnlimited,
      subscription_duration: String(pkg.subscriptionDuration),
      is_active: pkg.isActive,
      visibility: pkg.visibility ?? 'public',
    });
    setPackageError(null);
    setIsDialogOpen(true);
  };

  const slugify = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/\-+/g, '-');

  const handleSubmitPackage = async (event: React.FormEvent) => {
    event.preventDefault();
    setPackageError(null);

    if (!formState.name.trim()) {
      setPackageError('الرجاء إدخال اسم الباقة.');
      return;
    }
    if (!formState.price || Number(formState.price) < 0) {
      setPackageError('الرجاء إدخال سعر صحيح.');
      return;
    }
    if (!formState.unlimited_products && (!formState.product_limit || Number(formState.product_limit) <= 0)) {
      setPackageError('الرجاء إدخال حد منتجات صحيح أو تفعيل المنتجات غير المحدودة.');
      return;
    }
    if (!formState.subscription_duration || Number(formState.subscription_duration) <= 0) {
      setPackageError('الرجاء إدخال مدة اشتراك صحيحة.');
      return;
    }

    const slug = formState.slug.trim() || slugify(formState.name);
    if (!slug) {
      setPackageError('الرجاء إدخال اسم مسار صالح.');
      return;
    }

    const productLimit = formState.unlimited_products ? UNLIMITED : Number(formState.product_limit);

    setIsSubmitting(true);
    try {
      if (editingPackage) {
        const updated = await updateStorePackage(editingPackage.id, {
          name: formState.name,
          slug,
          description: formState.description || undefined,
          price: Number(formState.price),
          productLimit,
          subscriptionDuration: Number(formState.subscription_duration),
          isActive: formState.is_active,
          visibility: formState.visibility,
          metadata: null,
        });
        if (updated === null) throw new Error('فشل تحديث الباقة.');
        toast({ title: '✅ تم تحديث الباقة بنجاح' });
      } else {
        const created = await createStorePackage({
          name: formState.name,
          slug,
          description: formState.description || undefined,
          price: Number(formState.price),
          productLimit,
          subscriptionDuration: Number(formState.subscription_duration),
          isActive: formState.is_active,
          visibility: formState.visibility,
          metadata: null,
        });
        if (created === null) throw new Error('فشل إنشاء الباقة.');
        toast({ title: '✅ تم إنشاء الباقة بنجاح' });
      }
      await onPackagesChanged();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      setPackageError(error.message || 'حدث خطأ أثناء حفظ الباقة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deletePackage) return;
    setIsSubmitting(true);
    try {
      const success = await deleteStorePackage(deletePackage.id);
      if (!success) throw new Error('فشل حذف الباقة.');
      toast({ title: '✅ تم حذف الباقة بنجاح' });
      setDeletePackage(null);
      await onPackagesChanged();
    } catch (error: any) {
      toast({ title: '❌ فشل حذف الباقة', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePackageActive = async (pkg: StorePackage, isActive: boolean) => {
    try {
      const updated = await updateStorePackage(pkg.id, { isActive });
      if (updated === null) throw new Error('فشل تغيير حالة الباقة.');
      toast({ title: isActive ? '✅ تم تفعيل الباقة' : '✅ تم إيقاف الباقة' });
      await onPackagesChanged();
    } catch (error: any) {
      toast({ title: '❌ فشل تغيير حالة الباقة', description: error.message, variant: 'destructive' });
    }
  };

  const handlePackageSelectionChange = (storeId: string, value: string) => {
    setSelectedPackageByStore((current) => ({ ...current, [storeId]: value }));
  };

  const handleAssign = async (storeId: string) => {
    const selectedSlug = selectedPackageByStore[storeId];
    if (!selectedSlug) {
      toast({ title: 'الرجاء اختيار باقة لتعيينها', variant: 'destructive' });
      return;
    }
    try {
      await onAssignPackage(storeId, selectedSlug);
    } catch (error: any) {
      toast({ title: 'فشل تعيين الباقة', description: error.message, variant: 'destructive' });
    }
  };

  /* ─── مساعد عرض حد المنتجات ─── */
  const fmtLimit = (limit: number) => limit >= UNLIMITED ? (
    <span className="flex items-center gap-1"><Infinity className="w-4 h-4" /> غير محدود</span>
  ) : limit;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>إدارة الباقات</CardTitle>
          <CardDescription>أنشئ، حرِّر، واحذف الباقات. حدد ظهورها للعام أو للتجديد فقط أو لكليهما.</CardDescription>
        </div>
        <Button onClick={openAddPackageDialog} variant="secondary">
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة باقة جديدة
        </Button>
      </CardHeader>

      <CardContent className="space-y-10">
        {/* ─── قائمة الباقات - موبايل ─── */}
        <div>
          <CardTitle className="mb-4">قائمة الباقات</CardTitle>

          <div className="space-y-4 sm:hidden">
            {packages.length > 0 ? packages.map((pkg) => (
              <div key={pkg.id} className="rounded-3xl border border-border/80 bg-muted/50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{pkg.slug}</p>
                  </div>
                  <Switch checked={pkg.isActive} onCheckedChange={(v) => handleTogglePackageActive(pkg, v)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={VISIBILITY_COLORS[pkg.visibility ?? 'public']}>
                    {VISIBILITY_LABELS[pkg.visibility ?? 'public']}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">السعر</p>
                    <p className="mt-1 font-semibold">{pkg.price === 0 ? 'مجانية' : `${pkg.price.toLocaleString()} د.ع`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">حد المنتجات</p>
                    <p className="mt-1 font-semibold">{fmtLimit(pkg.productLimit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المدة</p>
                    <p className="mt-1 font-semibold">{pkg.subscriptionDuration} يوم</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditPackageDialog(pkg)}>
                    <Edit className="h-4 w-4 ml-1" /> تعديل
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => setDeletePackage(pkg)}>
                    <Trash2 className="h-4 w-4 ml-1" /> حذف
                  </Button>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl border border-border/80 bg-muted/50 p-4 text-center text-muted-foreground">
                لا توجد باقات مسجلة بعد.
              </div>
            )}
          </div>

          {/* ─── جدول ديسكتوب ─── */}
          <div className="hidden sm:block overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>حد المنتجات</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>الظهور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length > 0 ? packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">{pkg.slug}</p>
                    </TableCell>
                    <TableCell>{pkg.price === 0 ? 'مجانية' : `${pkg.price.toLocaleString()} د.ع`}</TableCell>
                    <TableCell>{fmtLimit(pkg.productLimit)}</TableCell>
                    <TableCell>{pkg.subscriptionDuration} يوم</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${VISIBILITY_COLORS[pkg.visibility ?? 'public']}`}>
                        {VISIBILITY_LABELS[pkg.visibility ?? 'public']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={pkg.isActive} onCheckedChange={(v) => handleTogglePackageActive(pkg, v)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditPackageDialog(pkg)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletePackage(pkg)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      لا توجد باقات مسجلة بعد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ─── تعيين باقات للمتاجر ─── */}
        <div>
          <CardTitle className="mb-4">تعيين الباقات للمتاجر</CardTitle>

          <div className="space-y-4 sm:hidden">
            {stores.map((store) => {
              const currentPackage = packages.find((p) => p.slug === store.packageName);
              return (
                <div key={store.id} className="rounded-3xl border border-border/80 bg-muted/50 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{currentPackage?.name || store.packageName || 'غير معينة'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {store.activationDate && store.subscriptionDuration
                        ? new Date(new Date(store.activationDate).getTime() + store.subscriptionDuration * 86400000).toLocaleDateString('ar')
                        : 'غير محدد'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Select value={selectedPackageByStore[store.id] || ''} onValueChange={(v) => handlePackageSelectionChange(store.id, v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر باقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.slug}>
                            {pkg.name} — {VISIBILITY_LABELS[pkg.visibility ?? 'public']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => handleAssign(store.id)} disabled={!selectedPackageByStore[store.id]}>
                      تعيين
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المتجر</TableHead>
                  <TableHead>الباقة الحالية</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>تغيير الباقة</TableHead>
                  <TableHead>تنفيذ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.length > 0 ? stores.map((store) => {
                  const currentPackage = packages.find((p) => p.slug === store.packageName);
                  return (
                    <TableRow key={store.id}>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{currentPackage?.name || store.packageName || 'غير معينة'}</TableCell>
                      <TableCell>
                        {store.activationDate && store.subscriptionDuration
                          ? new Date(new Date(store.activationDate).getTime() + store.subscriptionDuration * 86400000).toLocaleDateString('ar')
                          : 'غير محدد'}
                      </TableCell>
                      <TableCell>
                        <Select value={selectedPackageByStore[store.id] || ''} onValueChange={(v) => handlePackageSelectionChange(store.id, v)}>
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="اختر باقة" />
                          </SelectTrigger>
                          <SelectContent>
                            {packages.map((pkg) => (
                              <SelectItem key={pkg.id} value={pkg.slug}>
                                {pkg.name} — {VISIBILITY_LABELS[pkg.visibility ?? 'public']}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="secondary" onClick={() => handleAssign(store.id)} disabled={!selectedPackageByStore[store.id]}>
                          تعيين
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      لا توجد متاجر مسجلة بعد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* ════════════════════════════════
          فورم الإضافة / التعديل
      ════════════════════════════════ */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="w-full max-w-full sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</DialogTitle>
            <DialogDescription>
              {editingPackage ? 'حدِّث تفاصيل الباقة واحفظ التغييرات.' : 'أضف باقة جديدة مع تحديد حدودها وطريقة ظهورها.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPackage} className="space-y-5">
            {/* الاسم والـ slug */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pkg-name">اسم الباقة</Label>
                <Input
                  id="pkg-name"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="مثال: الباقة الذهبية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-slug">المعرف (Slug)</Label>
                <Input
                  id="pkg-slug"
                  value={formState.slug}
                  onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                  placeholder="gold-package"
                  dir="ltr"
                />
              </div>
            </div>

            {/* السعر والمدة */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pkg-price">السعر (د.ع)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.price}
                  onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-duration">مدة الاشتراك (أيام)</Label>
                <Input
                  id="pkg-duration"
                  type="number"
                  min="1"
                  value={formState.subscription_duration}
                  onChange={(e) => setFormState({ ...formState, subscription_duration: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            {/* حد المنتجات */}
            <div className="space-y-3">
              <Label>حد المنتجات</Label>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <Checkbox
                  id="unlimited"
                  checked={formState.unlimited_products}
                  onCheckedChange={(checked) =>
                    setFormState({ ...formState, unlimited_products: Boolean(checked), product_limit: '' })
                  }
                />
                <label htmlFor="unlimited" className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                  <Infinity className="w-4 h-4 text-primary" />
                  منتجات غير محدودة
                </label>
              </div>
              {!formState.unlimited_products && (
                <Input
                  type="number"
                  min="1"
                  value={formState.product_limit}
                  onChange={(e) => setFormState({ ...formState, product_limit: e.target.value })}
                  placeholder="مثال: 50"
                />
              )}
            </div>

            {/* ظهور الباقة */}
            <div className="space-y-2">
              <Label htmlFor="pkg-visibility">ظهور الباقة</Label>
              <Select
                value={formState.visibility}
                onValueChange={(v) => setFormState({ ...formState, visibility: v as PackageVisibility })}
              >
                <SelectTrigger id="pkg-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex flex-col">
                      <span className="font-medium">للعام</span>
                      <span className="text-xs text-muted-foreground">تظهر عند إنشاء متجر جديد</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="renewal">
                    <div className="flex flex-col">
                      <span className="font-medium">للتجديد فقط</span>
                      <span className="text-xs text-muted-foreground">مخفية عن العام، تظهر فقط عند تجديد الاشتراك</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex flex-col">
                      <span className="font-medium">للعام والتجديد</span>
                      <span className="text-xs text-muted-foreground">تظهر في كلا الحالتين</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* الوصف */}
            <div className="space-y-2">
              <Label htmlFor="pkg-desc">الوصف (اختياري)</Label>
              <Textarea
                id="pkg-desc"
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                rows={2}
                placeholder="وصف مختصر للباقة..."
              />
            </div>

            {/* تفعيل */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
              <Switch
                checked={formState.is_active}
                onCheckedChange={(v) => setFormState({ ...formState, is_active: v })}
              />
              <span className="text-sm font-medium">
                {formState.is_active ? '✅ الباقة مفعّلة وستظهر حسب إعداد الظهور' : '❌ الباقة معطّلة ومخفية تماماً'}
              </span>
            </div>

            {packageError && (
              <Alert variant="destructive">
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{packageError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : editingPackage ? 'تحديث الباقة' : 'إضافة الباقة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── تأكيد الحذف ─── */}
      <AlertDialog open={Boolean(deletePackage)} onOpenChange={(open) => { if (!open) setDeletePackage(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الباقة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف باقة <strong>{deletePackage?.name}</strong> نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDeletePackage} disabled={isSubmitting}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
