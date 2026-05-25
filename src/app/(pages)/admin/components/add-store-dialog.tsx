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
    location: '',
    latitude: '',
    longitude: '',
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
      const { data, error } = await supabase
        .from('stores')
        .select('market_type')
        .not('market_type', 'is', null);
      
      if (!error && data && data.length > 0) {
        const uniqueTypes = Array.from(
          new Set<string>(
            data
              .map((row: any) => row.market_type)
              .filter((type: any): type is string => typeof type === 'string' && type.trim().length > 0)
          )
        );
        setMarketTypeOptions(uniqueTypes);
        if (uniqueTypes.length > 0) {
          const firstMarketType = uniqueTypes[0] ?? "";
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
    // التحقق من الحقول المطلوبة
    if (!formData.storeName?.trim()) {
      toast({ title: "اسم المتجر مطلوب", variant: "destructive" });
      return;
    }
    if (!formData.ownerName?.trim()) {
      toast({ title: "اسم صاحب المتجر مطلوب", variant: "destructive" });
      return;
    }
    if (!formData.ownerEmail?.trim()) {
      toast({ title: "البريد الإلكتروني مطلوب", variant: "destructive" });
      return;
    }
    if (!formData.password?.trim()) {
      toast({ title: "كلمة المرور مطلوبة", variant: "destructive" });
      return;
    }
    if (!formData.whatsappNumber?.trim()) {
      toast({ title: "رقم الواتساب مطلوب", variant: "destructive" });
      return;
    }

    // التحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.ownerEmail)) {
      toast({ title: "صيغة البريد الإلكتروني غير صحيحة", variant: "destructive" });
      return;
    }

    // التحقق من أن كلمة المرور أطول من 6 أحرف
    if (formData.password.length < 6) {
      toast({ title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
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
        location: formData.location,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });

      if (!result?.success) {
        throw new Error(result?.error || 'فشل إنشاء المتجر.');
      }

      toast({ 
        title: "تم إضافة المتجر بنجاح",
        description: `تم إنشاء متجر ${formData.storeName} بنجاح`
      });

      // إعادة تعيين الفورم
      setFormData({
        storeName: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        whatsappNumber: '',
        storeType: 'فعلي',
        marketType: '',
        packageName: packages?.find((pkg) => pkg.isActive)?.slug || 'basic',
        location: '',
        latitude: '',
        longitude: '',
      });

      onOpenChange(false);
      onStoreAdded();
    } catch (error: any) {
      console.error("Error creating store:", error);
      toast({ 
        title: "فشل في إضافة المتجر", 
        description: error?.message || "حدث خطأ غير متوقع", 
        variant: "destructive" 
      });
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
            <Label htmlFor="password">كلمة المرور الأولية (6 أحرف على الأقل) *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">رقم الواتساب *</Label>
            <Input
              id="whatsapp"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="966501234567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-type">نوع المتجر *</Label>
            <Select 
              value={formData.storeType} 
              onValueChange={(value: string) => setFormData({ ...formData, storeType: value as 'فعلي' | 'إلكتروني' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المتجر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="فعلي">فعلي (محل فعلي)</SelectItem>
                <SelectItem value="إلكتروني">إلكتروني (متجر أونلاين)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">الموقع / المحافظة والمدينة</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="مثال: بغداد - الكرادة"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">خط العرض (Latitude)</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="33.3128"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">خط الطول (Longitude)</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="44.3615"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="market-type">نوع السوق / النشاط</Label>
            <Select
              value={formData.marketType || undefined}
              onValueChange={(value: string) => setFormData({ ...formData, marketType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع السوق" />
              </SelectTrigger>
              <SelectContent>
                {marketTypeOptions.length > 0 ? (
                  marketTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>لا توجد خيارات</SelectItem>
                )}
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
