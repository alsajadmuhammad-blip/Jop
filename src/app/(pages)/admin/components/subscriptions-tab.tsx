"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, StorePackage } from "@/lib/types";
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
    subscription_duration: '',
    is_active: false,
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
      subscription_duration: '',
      is_active: false,
    });
    setEditingPackage(null);
    setPackageError(null);
  };

  const openAddPackageDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditPackageDialog = (pkg: StorePackage) => {
    setEditingPackage(pkg);
    setFormState({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description || '',
      price: String(pkg.price),
      product_limit: String(pkg.productLimit),
      subscription_duration: String(pkg.subscriptionDuration),
      is_active: pkg.isActive,
    });
    setPackageError(null);
    setIsDialogOpen(true);
  };

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-+/g, '-');

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

    if (!formState.product_limit || Number(formState.product_limit) <= 0) {
      setPackageError('الرجاء إدخال حد منتجات صحيح.');
      return;
    }

    if (!formState.subscription_duration || Number(formState.subscription_duration) <= 0) {
      setPackageError('الرجاء إدخال مدة اشتراك صحيحة.');
      return;
    }

    const slug = formState.slug.trim() || slugify(formState.name);
    if (!slug) {
      setPackageError('الرجاء إدخال اسم مسار صالح (slug).');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingPackage) {
        const updated = await updateStorePackage(editingPackage.id, {
          name: formState.name,
          slug,
          description: formState.description || undefined,
          price: Number(formState.price),
          productLimit: Number(formState.product_limit),
          subscriptionDuration: Number(formState.subscription_duration),
          isActive: formState.is_active,
          metadata: null,
        });

        if (updated === null) {
          throw new Error('فشل تحديث الباقة.');
        }

        toast({ title: '✅ تم تحديث الباقة بنجاح' });
      } else {
        const created = await createStorePackage({
          name: formState.name,
          slug,
          description: formState.description || undefined,
          price: Number(formState.price),
          productLimit: Number(formState.product_limit),
          subscriptionDuration: Number(formState.subscription_duration),
          isActive: formState.is_active,
          metadata: null,
        });

        if (created === null) {
          throw new Error('فشل إنشاء الباقة.');
        }

        toast({ title: '✅ تم إنشاء الباقة بنجاح' });
      }

      await onPackagesChanged();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Package error:', error);
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
      if (!success) {
        throw new Error('فشل حذف الباقة.');
      }
      toast({ title: '✅ تم حذف الباقة بنجاح' });
      setDeletePackage(null);
      await onPackagesChanged();
    } catch (error: any) {
      console.error('Delete package error:', error);
      toast({ title: '❌ فشل حذف الباقة', description: error.message || String(error), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePackageActive = async (pkg: StorePackage, isActive: boolean) => {
    setIsSubmitting(true);
    try {
      const updated = await updateStorePackage(pkg.id, { isActive });
      if (updated === null) throw new Error('فشل تغيير حالة الباقة.');
      toast({ title: isActive ? '✅ تم تفعيل الباقة' : '✅ تم إيقاف الباقة' });
      await onPackagesChanged();
    } catch (error: any) {
      console.error('Toggle package active error:', error);
      toast({ title: '❌ فشل تغيير حالة الباقة', description: error.message || String(error), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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
      toast({ title: 'تم تعيين الباقة للمتجر' });
    } catch (error: any) {
      console.error('Assign package error:', error);
      toast({ title: 'فشل تعيين الباقة', description: error.message || String(error), variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>إدارة الباقات</CardTitle>
          <CardDescription>أنشئ، حرِّر، احذف، وفعل الباقات. ثم عيِّنها للمتاجر مباشرة.</CardDescription>
        </div>
        <Button onClick={openAddPackageDialog} variant="secondary">
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة باقة جديدة
        </Button>
      </CardHeader>

      <CardContent className="space-y-10">
        <div>
          <CardTitle className="mb-4">قائمة الباقات</CardTitle>

          <div className="space-y-4 sm:hidden">
            {packages.length > 0 ? packages.map((pkg) => (
              <div key={pkg.id} className="rounded-3xl border border-border/80 bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{pkg.slug}</p>
                  </div>
                  <Switch checked={pkg.isActive} onCheckedChange={(value) => handleTogglePackageActive(pkg, value)} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">السعر</p>
                    <p className="mt-1 font-semibold">{pkg.price === 0 ? 'مجانية' : `${pkg.price.toLocaleString()} د.ع`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">حد المنتجات</p>
                    <p className="mt-1 font-semibold">{pkg.productLimit === 999999 ? 'غير محدود' : pkg.productLimit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المدة</p>
                    <p className="mt-1 font-semibold">{pkg.subscriptionDuration} يوم</p>
                  </div>
                </div>
                {Array.isArray(pkg.metadata?.features) && pkg.metadata.features.length > 0 && (
                  <ul className="mt-4 space-y-1 text-xs text-slate-700">
                    {pkg.metadata.features.map((feature: string) => (
                      <li key={feature} className="rounded-full bg-white px-3 py-1">• {feature}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="flex-1 min-w-[120px]" onClick={() => openEditPackageDialog(pkg)}>
                    <Edit className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 min-w-[120px]" onClick={() => setDeletePackage(pkg)}>
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl border border-border/80 bg-muted/50 p-4 text-center text-muted-foreground">
                لا توجد باقات مسجلة بعد.
              </div>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>المعرف</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>حد المنتجات</TableHead>
                  <TableHead>مدة الاشتراك</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length > 0 ? packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>{pkg.name}</TableCell>
                    <TableCell>{pkg.slug}</TableCell>
                    <TableCell>{pkg.price === 0 ? 'مجانية' : `${pkg.price.toLocaleString()} د.ع`}</TableCell>
                    <TableCell>{pkg.productLimit === 999999 ? 'غير محدود' : pkg.productLimit}</TableCell>
                    <TableCell>{pkg.subscriptionDuration} يوم</TableCell>
                    <TableCell>
                      <Switch checked={pkg.isActive} onCheckedChange={(value) => handleTogglePackageActive(pkg, value)} />
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

        <div>
          <CardTitle className="mb-4">متاجر الباقات الحالية</CardTitle>

          <div className="space-y-4 sm:hidden">
            {stores.length > 0 ? stores.map((store) => {
              const currentPackage = packages.find((pkg) => pkg.slug === store.packageName) || packages.find((pkg) => pkg.isActive);
              return (
                <div key={store.id} className="rounded-3xl border border-border/80 bg-muted/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{store.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{currentPackage?.name || store.packageName || 'غير معينة'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {store.activationDate && store.subscriptionDuration ? new Date(new Date(store.activationDate).getTime() + store.subscriptionDuration * 24 * 60 * 60 * 1000).toLocaleDateString() : 'غير محدد'}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Select value={selectedPackageByStore[store.id] || ''} onValueChange={(value) => handlePackageSelectionChange(store.id, value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر باقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.slug}>{pkg.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => handleAssign(store.id)} disabled={!selectedPackageByStore[store.id]}>
                      تعيين
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-3xl border border-border/80 bg-muted/50 p-4 text-center text-muted-foreground">
                لا توجد متاجر مسجلة بعد.
              </div>
            )}
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
                  const currentPackage = packages.find((pkg) => pkg.slug === store.packageName) || packages.find((pkg) => pkg.isActive);
                  return (
                    <TableRow key={store.id}>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{currentPackage?.name || store.packageName || 'غير معينة'}</TableCell>
                      <TableCell>{store.activationDate && store.subscriptionDuration ? new Date(new Date(store.activationDate).getTime() + store.subscriptionDuration * 24 * 60 * 60 * 1000).toLocaleDateString() : 'غير محدد'}</TableCell>
                      <TableCell>
                        <Select value={selectedPackageByStore[store.id] || ''} onValueChange={(value) => handlePackageSelectionChange(store.id, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر باقة" />
                          </SelectTrigger>
                          <SelectContent>
                            {packages.map((pkg) => (
                              <SelectItem key={pkg.id} value={pkg.slug}>{pkg.name}</SelectItem>
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="w-full max-w-full sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</DialogTitle>
            <DialogDescription>
              {editingPackage ? 'حدّث تفاصيل الباقة واحفظ التغييرات.' : 'أضف باقة جديدة مع السعة والسعر ومدة الاشتراك.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPackage} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="package-name">اسم الباقة</Label>
                <Input id="package-name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} placeholder="مثال: الباقة الأساسية" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-slug">المعرف (Slug)</Label>
                <Input id="package-slug" value={formState.slug} onChange={(e) => setFormState({ ...formState, slug: e.target.value })} placeholder="basic-package" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="package-price">السعر (د.ع)</Label>
                <Input id="package-price" type="number" step="0.01" value={formState.price} onChange={(e) => setFormState({ ...formState, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-limit">حد المنتجات</Label>
                <Input id="package-limit" type="number" min="1" value={formState.product_limit} onChange={(e) => setFormState({ ...formState, product_limit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-duration">مدة الاشتراك (أيام)</Label>
                <Input id="package-duration" type="number" min="1" value={formState.subscription_duration} onChange={(e) => setFormState({ ...formState, subscription_duration: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-description">الوصف (اختياري)</Label>
              <Textarea id="package-description" value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} rows={2} placeholder="أدخل وصف الباقة..." />
            </div>
            <div className="flex items-center gap-4">
              <Switch checked={formState.is_active} onCheckedChange={(value) => setFormState({ ...formState, is_active: value })} />
              <span>{formState.is_active ? 'الباقة مفعلة ✅' : 'الباقة معطلة ❌'}</span>
            </div>
            {packageError ? (
              <Alert variant="destructive">
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{packageError}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : editingPackage ? 'تحديث الباقة' : 'إضافة الباقة'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletePackage)} onOpenChange={(open) => { if (!open) setDeletePackage(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الباقة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد أنك تريد حذف هذه الباقة نهائياً؟ لن يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDeletePackage}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
