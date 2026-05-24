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
    price: 0,
    productLimit: 50,
    subscriptionDuration: 30,
    isActive: true,
    metadata: '',
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
      price: 0,
      productLimit: 50,
      subscriptionDuration: 30,
      isActive: true,
      metadata: '',
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
      price: pkg.price,
      productLimit: pkg.productLimit,
      subscriptionDuration: pkg.subscriptionDuration,
      isActive: pkg.isActive,
      metadata: pkg.metadata ? JSON.stringify(pkg.metadata, null, 2) : '',
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

    const metadataValue = formState.metadata.trim();
    let metadata: Record<string, any> | null = null;
    if (metadataValue) {
      try {
        metadata = JSON.parse(metadataValue);
      } catch (error: any) {
        setPackageError('تنسيق metadata غير صحيح. يجب أن يكون JSON صالح.');
        return;
      }
    }

    const slug = formState.slug.trim() || slugify(formState.name);
    if (!slug) {
      setPackageError('الرجاء إدخال اسم مسار صالح (slug) للباقه.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingPackage) {
        const updated = await updateStorePackage(editingPackage.id, {
          name: formState.name,
          slug,
          description: formState.description,
          price: Number(formState.price),
          productLimit: Number(formState.productLimit),
          subscriptionDuration: Number(formState.subscriptionDuration),
          isActive: formState.isActive,
          metadata,
        });

        if (!updated) {
          throw new Error('فشل تحديث الباقة.');
        }

        toast({ title: 'تم تحديث الباقة بنجاح' });
      } else {
        const created = await createStorePackage({
          name: formState.name,
          slug,
          description: formState.description,
          price: Number(formState.price),
          productLimit: Number(formState.productLimit),
          subscriptionDuration: Number(formState.subscriptionDuration),
          isActive: formState.isActive,
          metadata,
        });

        if (!created) {
          throw new Error('فشل إنشاء الباقة.');
        }

        toast({ title: 'تم إنشاء الباقة بنجاح' });
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
      toast({ title: 'تم حذف الباقة' });
      setDeletePackage(null);
      await onPackagesChanged();
    } catch (error: any) {
      console.error('Delete package error:', error);
      toast({ title: 'فشل حذف الباقة', description: error.message || String(error), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePackageActive = async (pkg: StorePackage, isActive: boolean) => {
    setIsSubmitting(true);
    try {
      const updated = await updateStorePackage(pkg.id, { isActive });
      if (!updated) throw new Error('فشل تغيير حالة الباقة.');
      toast({ title: isActive ? 'تم تفعيل الباقة' : 'تم إيقاف الباقة' });
      await onPackagesChanged();
    } catch (error: any) {
      console.error('Toggle package active error:', error);
      toast({ title: 'فشل تغيير حالة الباقة', description: error.message || String(error), variant: 'destructive' });
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
                <Input id="package-name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-slug">المعرف (Slug)</Label>
                <Input id="package-slug" value={formState.slug} onChange={(e) => setFormState({ ...formState, slug: e.target.value })} placeholder="example-package" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="package-price">السعر</Label>
                <Input id="package-price" type="number" min={0} value={formState.price} onChange={(e) => setFormState({ ...formState, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-limit">حد المنتجات</Label>
                <Input id="package-limit" type="number" min={1} value={formState.productLimit} onChange={(e) => setFormState({ ...formState, productLimit: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-duration">مدة الاشتراك (أيام)</Label>
                <Input id="package-duration" type="number" min={1} value={formState.subscriptionDuration} onChange={(e) => setFormState({ ...formState, subscriptionDuration: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-description">الوصف</Label>
              <Textarea id="package-description" value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-metadata">Metadata (JSON)</Label>
              <Textarea id="package-metadata" value={formState.metadata} onChange={(e) => setFormState({ ...formState, metadata: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-4">
              <Switch checked={formState.isActive} onCheckedChange={(value) => setFormState({ ...formState, isActive: value })} />
              <span>{formState.isActive ? 'الباقة مفعلة' : 'الباقة معطلة'}</span>
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
