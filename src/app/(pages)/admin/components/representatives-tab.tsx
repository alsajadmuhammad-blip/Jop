"use client";

import React, { useState } from "react";
import { Users, UserPlus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, User } from "@/lib/types";
import { createRepresentative } from "@/services/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const RepresentativeDialog = React.memo(function RepresentativeDialog({
  isOpen,
  onOpenChange,
  onRepresentativeAdded,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRepresentativeAdded?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    paymentSystem: 'salary' as 'salary' | 'commission',
    monthlySalary: '',
    requiredStoresCount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      paymentSystem: 'salary',
      monthlySalary: '',
      requiredStoresCount: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "الرجاء ملء: الاسم والبريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    if (formData.paymentSystem === 'salary') {
      if (!formData.monthlySalary || !formData.requiredStoresCount) {
        toast({
          title: "خطأ في التحقق",
          description: "الرجاء إدخال الراتب الشهري وعدد المتاجر المطلوبة",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await createRepresentative({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        paymentSystem: formData.paymentSystem,
        monthlySalary: formData.paymentSystem === 'salary' ? Number(formData.monthlySalary) : undefined,
        requiredStoresCount: formData.paymentSystem === 'salary' ? Number(formData.requiredStoresCount) : undefined,
      });

      if (result.success) {
        toast({
          title: "✅ تم بنجاح",
          description: "تم إنشاء حساب المندوب بنجاح",
          variant: "default",
        });
        resetForm();
        onOpenChange(false);
        onRepresentativeAdded?.();
      } else {
        throw new Error(result.error || "فشل إنشاء المندوب بسبب خطأ غير معروف");
      }
    } catch (error: any) {
      console.error('❌ خطأ في إنشاء المندوب:', error);
      toast({
        title: "❌ فشل تسجيل المندوب",
        description: error?.message || "حدث خطأ في الاتصال. تحقق من الاتصال بالإنترنت وحاول مجددا",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة مندوب تسويق جديد</DialogTitle>
          <DialogDescription>أدخل تفاصيل المندوب لإنشاء حساب خاص به</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المندوب الكامل *</Label>
            <Input
              id="name"
              type="text"
              placeholder="مثال: علي حسن"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input
              id="email"
              type="email"
              placeholder="rep@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentSystem">نظام الدفع *</Label>
            <Select
              value={formData.paymentSystem}
              onValueChange={(value) => handleInputChange('paymentSystem', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="paymentSystem">
                <SelectValue placeholder="اختر نظام الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">نظام الراتب الشهري</SelectItem>
                <SelectItem value="commission">نظام العمولات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.paymentSystem === 'salary' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="monthlySalary">الراتب الشهري (د.ع) *</Label>
                <Input
                  id="monthlySalary"
                  type="number"
                  placeholder="500"
                  value={formData.monthlySalary}
                  onChange={(e) => handleInputChange('monthlySalary', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiredStoresCount">عدد المتاجر المطلوبة *</Label>
                <Input
                  id="requiredStoresCount"
                  type="number"
                  placeholder="10"
                  value={formData.requiredStoresCount}
                  onChange={(e) => handleInputChange('requiredStoresCount', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {formData.paymentSystem === 'commission' && (
            <Alert className="bg-primary/10 border-primary/20">
              <AlertTitle>نظام العمولات</AlertTitle>
              <AlertDescription>سيتم حساب العمولة تلقائياً وفقاً لسياسات المنصة</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '⏳ جاري الإنشاء...' : '✅ إنشاء حساب'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

RepresentativeDialog.displayName = 'RepresentativeDialog';

const EditRepresentativeDialog = React.memo(function EditRepresentativeDialog({
  isOpen,
  onOpenChange,
  representative,
  onRepresentativeUpdated,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  representative: User | null;
  onRepresentativeUpdated?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: representative?.name || '',
    paymentSystem: (representative?.paymentSystem || 'salary') as 'salary' | 'commission',
    monthlySalary: representative?.monthlySalary?.toString() || '',
    requiredStoresCount: representative?.requiredStoresCount?.toString() || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (representative) {
      setFormData({
        name: representative.name || '',
        paymentSystem: (representative.paymentSystem || 'salary') as 'salary' | 'commission',
        monthlySalary: representative.monthlySalary?.toString() || '',
        requiredStoresCount: representative.requiredStoresCount?.toString() || '',
      });
    }
  }, [representative]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!representative?.id) return;

    if (!formData.name.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "الرجاء إدخال اسم المندوب",
        variant: "destructive",
      });
      return;
    }

    if (formData.paymentSystem === 'salary') {
      if (!formData.monthlySalary || !formData.requiredStoresCount) {
        toast({
          title: "خطأ في التحقق",
          description: "الرجاء إدخال الراتب الشهري وعدد المتاجر المطلوبة",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Call parent handler to update
      onRepresentativeUpdated?.();
      toast({
        title: "✅ تم بنجاح",
        description: "تم تحديث بيانات المندوب بنجاح",
        variant: "default",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating representative:', error);
      toast({
        title: "❌ فشل التحديث",
        description: error?.message || "حدث خطأ في تحديث بيانات المندوب",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المندوب</DialogTitle>
          <DialogDescription>قم بتعديل معلومات المندوب</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">اسم المندوب الكامل *</Label>
            <Input
              id="edit-name"
              type="text"
              placeholder="مثال: علي حسن"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-paymentSystem">نظام الدفع *</Label>
            <Select
              value={formData.paymentSystem}
              onValueChange={(value) => handleInputChange('paymentSystem', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-paymentSystem">
                <SelectValue placeholder="اختر نظام الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">نظام الراتب الشهري</SelectItem>
                <SelectItem value="commission">نظام العمولات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.paymentSystem === 'salary' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-monthlySalary">الراتب الشهري (د.ع) *</Label>
                <Input
                  id="edit-monthlySalary"
                  type="number"
                  placeholder="500"
                  value={formData.monthlySalary}
                  onChange={(e) => handleInputChange('monthlySalary', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-requiredStoresCount">عدد المتاجر المطلوبة *</Label>
                <Input
                  id="edit-requiredStoresCount"
                  type="number"
                  placeholder="10"
                  value={formData.requiredStoresCount}
                  onChange={(e) => handleInputChange('requiredStoresCount', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {formData.paymentSystem === 'commission' && (
            <Alert className="bg-primary/10 border-primary/20">
              <AlertTitle>نظام العمولات</AlertTitle>
              <AlertDescription>سيتم حساب العمولة تلقائياً وفقاً لسياسات المنصة</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '⏳ جاري التحديث...' : '✅ حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditRepresentativeDialog.displayName = 'EditRepresentativeDialog';

export function RepresentativesTab({
  representatives,
  stores,
  onRepresentativeAdded,
  onRepresentativeDeleted,
  onRepresentativeUpdated,
}: {
  representatives: User[];
  stores: Store[];
  onRepresentativeAdded?: () => void;
  onRepresentativeDeleted?: (repId: string) => void;
  onRepresentativeUpdated?: (repId: string, updates: Partial<User>) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRepresentative, setEditingRepresentative] = useState<User | null>(null);
  const { toast } = useToast();

  const getStoreCountForRep = (repId: string) => stores.filter((store) => store.registeredByAgentId === repId).length;

  const handleAddClick = () => {
    setIsDialogOpen(true);
  };

  const handleRepresentativeAdded = () => {
    setIsDialogOpen(false);
    onRepresentativeAdded?.();
  };

  const handleEditClick = (rep: User) => {
    setEditingRepresentative(rep);
    setIsEditDialogOpen(true);
  };

  const handleRepresentativeUpdated = () => {
    setIsEditDialogOpen(false);
    setEditingRepresentative(null);
    onRepresentativeUpdated?.(editingRepresentative?.id || '', {});
  };

  const handleDeleteClick = async (repId: string, repName: string) => {
    const storeCount = stores.filter((store) => store.registeredByAgentId === repId).length;
    if (storeCount > 0) {
      toast({
        title: "❌ لا يمكن الحذف",
        description: `هذا المندوب لديه ${storeCount} متجر(متاجر). يجب نقل المتاجر إلى مندوب آخر أولاً.`,
        variant: "destructive",
      });
      return;
    }

    onRepresentativeDeleted?.(repId);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            إدارة المندوبين ({representatives.length})
          </CardTitle>
          <CardDescription>إضافة وتتبع أداء ومستحقات مندوبي التسويق</CardDescription>
        </div>
        <Button onClick={handleAddClick} className="gap-2">
          <UserPlus className="w-4 h-4" />
          إضافة مندوب
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {representatives.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">لا يوجد مندوبون مسجلون حتى الآن</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 sm:hidden">
              {representatives.map((rep) => {
                const storeCount = getStoreCountForRep(rep.id);
                const paymentSystemLabel = rep.paymentSystem === 'salary' ? '💰 راتب' : '📊 عمولة';

                return (
                  <div key={rep.id} className="rounded-3xl border border-border/80 bg-muted/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{rep.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground truncate">{rep.email}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-1 text-xs font-semibold uppercase tracking-wide">
                        {paymentSystemLabel}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">الراتب الشهري</p>
                        <p className="mt-1 font-semibold">{rep.paymentSystem === 'salary' ? `${(rep.monthlySalary || 0).toLocaleString()} د.ع` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">المتاجر المطلوبة</p>
                        <p className="mt-1 font-semibold">{rep.paymentSystem === 'salary' ? (rep.requiredStoresCount || 0) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">المتاجر المسجلة</p>
                        <p className="mt-1 font-semibold">{storeCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">إجمالي المستحقات</p>
                        <p className="mt-1 font-semibold text-green-600">{(rep.totalEarnings || 0).toLocaleString()} د.ع</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(rep)} className="flex-1">
                        <Edit className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex-1">
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogDescription>سيتم حذف حساب {rep.name} نهائياً.</AlertDialogDescription>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(rep.id, rep.name || '')} className="bg-destructive text-destructive-foreground">
                              نعم، حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">اسم المندوب</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">البريد الإلكتروني</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">نظام الدفع</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">الراتب الشهري</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">المتاجر المطلوبة</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">المتاجر المسجلة</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">إجمالي المستحقات</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {representatives.map((rep) => {
                    const storeCount = getStoreCountForRep(rep.id);
                    const paymentSystemLabel = rep.paymentSystem === 'salary' ? '💰 راتب' : '📊 عمولة';

                    return (
                      <tr key={rep.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{rep.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{rep.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border border-border px-2 py-1 text-xs font-semibold uppercase tracking-wide">
                            {paymentSystemLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {rep.paymentSystem === 'salary' ? `${(rep.monthlySalary || 0).toLocaleString()} د.ع` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {rep.paymentSystem === 'salary' ? (rep.requiredStoresCount || 0) : '-'}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          <span className="inline-flex items-center rounded-full border border-border px-2 py-1 text-xs font-semibold">{storeCount}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-600">{(rep.totalEarnings || 0).toLocaleString()} د.ع</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditClick(rep)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogDescription>سيتم حذف حساب {rep.name} نهائياً.</AlertDialogDescription>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteClick(rep.id, rep.name || '')} className="bg-destructive text-destructive-foreground">
                                    نعم، حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>

      <RepresentativeDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} onRepresentativeAdded={handleRepresentativeAdded} />
      <EditRepresentativeDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} representative={editingRepresentative} onRepresentativeUpdated={handleRepresentativeUpdated} />
    </Card>
  );
}
