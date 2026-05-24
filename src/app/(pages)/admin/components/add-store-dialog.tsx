"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { StorePackage } from "@/lib/types";
import { createStoreOwner } from "@/services/supabase-admin";
import { supabase } from "@/services/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddStoreDialog({
  isOpen,
  onOpenChange,
  onStoreAdded,
  packages,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStoreAdded: () => void;
  packages: StorePackage[];
}) {
  const [marketTypeOptions, setMarketTypeOptions] = useState<string[]>([]);
  const [newMarketType, setNewMarketType] = useState('');
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    whatsappNumber: '',
    storeType: 'فعلي' as 'فعلي' | 'إلكتروني',
    marketType: '',
    packageName: packages?.find((pkg) => pkg.isActive)?.slug || 'basic',
    province: '',
    city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!formData.packageName && packages.length > 0) {
      const activePackage = packages.find((pkg) => pkg.isActive);
      if (activePackage) {
        setFormData((prev) => ({ ...prev, packageName: activePackage.slug }));
      }
    }
  }, [packages, formData.packageName]);

  useEffect(() => {
    async function loadMarketTypes() {
      const { data, error } = await supabase.from('stores').select('market_type');
      if (!error && data) {
        const persistedTypes = Array.from(
          new Set(
            data
              .map((row: any) => row.market_type || row.marketType)
              .filter((type: unknown): type is string => typeof type === 'string' && type.trim().length > 0)
          )
        );
        const persistedTypeStrings = persistedTypes as string[];
        setMarketTypeOptions(persistedTypeStrings);
        if (persistedTypeStrings.length > 0) {
          const firstMarketType = persistedTypeStrings[0] ?? "";
          setFormData((prev) => ({ ...prev, marketType: firstMarketType }));
        }
      }
      setLoadingTypes(false);
    }
    loadMarketTypes();
  }, []);

  const handleAddMarketType = () => {
    const trimmedType = newMarketType.trim();
    if (!trimmedType) return;

    setMarketTypeOptions((current) => Array.from(new Set([...current, trimmedType])));
    setFormData((prev) => ({ ...prev, marketType: trimmedType }));
    setNewMarketType('');
  };

  const handleSubmit = async () => {
    if (!formData.storeName || !formData.ownerName || !formData.ownerEmail || !formData.password) {
      toast({ title: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStoreOwner({
        ownerEmail: formData.ownerEmail,
        ownerName: formData.ownerName,
        ownerPassword: formData.password,
        storeName: formData.storeName,
        whatsappNumber: formData.whatsappNumber,
        marketType: formData.marketType,
        packageName: formData.packageName,
        storeType: formData.storeType,
      });

      if (!result.success) {
        throw new Error(result.error || 'فشل إنشاء المتجر.');
      }

      toast({ title: "تم إضافة المتجر بنجاح" });
      setFormData({
        storeName: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        whatsappNumber: '',
        storeType: 'فعلي',
        marketType: '',
        packageName: packages?.find((pkg) => pkg.isActive)?.slug || 'basic',
        province: '',
        city: '',
      });
      onOpenChange(false);
      onStoreAdded();
    } catch (error: any) {
      toast({ title: "فشل في إضافة المتجر", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة متجر جديد</DialogTitle>
          <DialogDescription>أدخل تفاصيل المتجر وصاحبه. سيتم إنشاء حساب جديد لصاحب المتجر.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">اسم المتجر *</Label>
            <Input
              id="store-name"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="مثال: متجر الأجهزة"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-name">اسم صاحب المتجر *</Label>
            <Input
              id="owner-name"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="مثال: محمد أحمد"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-email">البريد الإلكتروني *</Label>
            <Input
              id="owner-email"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              placeholder="owner@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الأولية *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">رقم الواتساب</Label>
            <Input
              id="whatsapp"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="07xxxxxxxxx"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="province">المحافظة</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="بغداد"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="الكرادة"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="market-type">نوع السوق / النشاط</Label>
            <Select
              value={formData.marketType}
              onValueChange={(value: string) => setFormData({ ...formData, marketType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع السوق" />
              </SelectTrigger>
              <SelectContent>
                {marketTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  id="new-market-type"
                  value={newMarketType}
                  onChange={(e) => setNewMarketType(e.target.value)}
                  placeholder="أضف نوعاً جديداً"
                />
                <Button type="button" onClick={handleAddMarketType} disabled={!newMarketType.trim()}>
                  إضافة
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {loadingTypes ? 'جارٍ تحميل الفئات...' : 'اختر من الفئات الحالية أو أضف فئة جديدة'}
              </div>
              <div className="flex flex-wrap gap-2">
                {marketTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      formData.marketType === type
                        ? 'border-primary bg-primary text-white'
                        : 'border-secondary bg-secondary/10 text-secondary'
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, marketType: type }))}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="package-name">الباقة الافتراضية</Label>
            <Select value={formData.packageName} onValueChange={(value: string) => setFormData({ ...formData, packageName: value })}>
              <SelectTrigger>
                <SelectValue placeholder="اختر باقة" />
              </SelectTrigger>
              <SelectContent>
                {packages.length > 0 ? (
                  packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.slug}>{pkg.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="basic">الباقة الأساسية</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المتجر'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
