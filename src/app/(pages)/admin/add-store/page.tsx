"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createStoreOwner } from "@/services/supabase-admin";
import { fetchStorePackages } from "@/services/supabase-db";
import { supabase } from "@/services/supabase";
import type { StorePackage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, ArrowLeft } from "lucide-react";

export default function AdminAddStorePage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [marketTypeOptions, setMarketTypeOptions] = useState<string[]>([]);
  const [newMarketType, setNewMarketType] = useState("");
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    password: "",
    whatsappNumber: "",
    marketType: "",
    packageName: "basic",
    storeType: "فعلي",
    location: "",
    latitude: "",
    longitude: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState("");
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    if (loading) return;
    setAuthResolved(true);
    if (!user || userRole !== "admin") {
      router.replace("/login");
    }
  }, [loading, user, userRole, router]);

  useEffect(() => {
    async function loadPackagesAndTypes() {
      try {
        const packagesData = await fetchStorePackages();
        setPackages(packagesData || []);
        setForm((current) => ({
          ...current,
          packageName: packagesData?.find((pkg: StorePackage) => pkg.isActive)?.slug || current.packageName,
        }));

        // جلب أنواع الأسواق الموجودة (distinct values)
        const { data, error } = await supabase
          .from("stores")
          .select("market_type")
          .not("market_type", "is", null);
        
        if (!error && data && data.length > 0) {
          const uniqueTypesRaw = Array.from(
            new Set(
              data
                .map((row: any) => row.market_type)
                .filter((type: any): type is string => typeof type === "string" && type.trim().length > 0)
            )
          ) as string[];
          setMarketTypeOptions(uniqueTypesRaw);
          if (uniqueTypesRaw.length > 0 && !form.marketType) {
            setForm((current) => ({ ...current, marketType: uniqueTypesRaw[0] || "" }));
          }
        }
      } catch (err) {
        console.error("Failed to load packages or market types", err);
      } finally {
        setLoadingTypes(false);
      }
    }

    loadPackagesAndTypes();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };


  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // التحقق من الحقول الأساسية
      if (!form.name?.trim()) {
        throw new Error("اسم المتجر مطلوب");
      }
      if (!form.ownerName?.trim()) {
        throw new Error("اسم صاحب المتجر مطلوب");
      }
      if (!form.ownerEmail?.trim()) {
        throw new Error("البريد الإلكتروني مطلوب");
      }
      if (!form.password?.trim()) {
        throw new Error("كلمة المرور مطلوبة");
      }
      if (!form.whatsappNumber?.trim()) {
        throw new Error("رقم الواتساب مطلوب");
      }

      // التحقق من صيغة البريد الإلكتروني
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.ownerEmail)) {
        throw new Error("صيغة البريد الإلكتروني غير صحيحة");
      }

      // التحقق من أن كلمة المرور أطول من 6 أحرف
      if (form.password.length < 6) {
        throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      }

      console.log("إرسال البيانات:", {
        ownerEmail: form.ownerEmail,
        ownerName: form.ownerName,
        ownerPassword: form.password,
        storeName: form.name,
        whatsappNumber: form.whatsappNumber,
        marketType: form.marketType,
        packageName: form.packageName,
        storeType: form.storeType,
      });

      const result = await createStoreOwner({
        ownerEmail: form.ownerEmail,
        ownerName: form.ownerName,
        ownerPassword: form.password,
        storeName: form.name,
        whatsappNumber: form.whatsappNumber,
        marketType: form.marketType,
        packageName: form.packageName,
        storeType: form.storeType,
        location: form.location,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });

      console.log("النتيجة:", result);

      if (!result?.success) {
        throw new Error(result?.error || "فشل إنشاء المتجر.");
      }

      // النجاح
      setForm({
        name: "",
        ownerName: "",
        ownerEmail: "",
        password: "",
        whatsappNumber: "",
        marketType: "",
        packageName: "basic",
        storeType: "فعلي",
        location: "",
        latitude: "",
        longitude: "",
      });

      router.push("/admin");
    } catch (err: any) {
      console.error("خطأ:", err);
      setError(err?.message || "حدث خطأ أثناء إنشاء المتجر.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !authResolved) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-muted px-6 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> جاري التحقق من صلاحيات المشرف...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4" /> العودة إلى لوحة المشرف
          </Link>
          <h1 className="mt-3 text-3xl font-bold">إضافة متجر جديد</h1>
          <p className="mt-2 text-sm text-muted-foreground">استخدم هذه الصفحة لإضافة متجر جديد مباشرة من حساب المشرف.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المتجر</CardTitle>
          <CardDescription>املأ بيانات المتجر وصاحب الحساب لإنشاء المتجر بسرعة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* اسم المتجر */}
              <div>
                <Label htmlFor="name">اسم المتجر *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  placeholder="مثال: متجر الأدوية الحديثة"
                  required 
                  className="bg-background/50" 
                />
              </div>

              {/* اسم صاحب المتجر */}
              <div>
                <Label htmlFor="ownerName">اسم صاحب المتجر *</Label>
                <Input 
                  id="ownerName" 
                  name="ownerName" 
                  value={form.ownerName} 
                  onChange={handleChange} 
                  placeholder="مثال: أحمد محمد"
                  required 
                  className="bg-background/50" 
                />
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <Label htmlFor="ownerEmail">البريد الإلكتروني *</Label>
                <Input 
                  id="ownerEmail" 
                  name="ownerEmail" 
                  type="email" 
                  value={form.ownerEmail} 
                  onChange={handleChange} 
                  placeholder="example@email.com"
                  required 
                  className="bg-background/50" 
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <Label htmlFor="password">كلمة المرور (6 أحرف على الأقل) *</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  placeholder="••••••••"
                  required 
                  className="bg-background/50" 
                />
              </div>

              {/* رقم الواتساب */}
              <div>
                <Label htmlFor="whatsappNumber">رقم الواتساب *</Label>
                <Input 
                  id="whatsappNumber" 
                  name="whatsappNumber" 
                  value={form.whatsappNumber} 
                  onChange={handleChange} 
                  placeholder="966501234567"
                  required 
                  className="bg-background/50" 
                />
              </div>

            {/* نوع المتجر */}
              <div>
                <Label htmlFor="storeType">نوع المتجر *</Label>
                <Select name="storeType" value={form.storeType} onValueChange={(v) => setForm((f) => ({ ...f, storeType: v }))}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="فعلي">فعلي (محل فعلي)</SelectItem>
                    <SelectItem value="إلكتروني">إلكتروني (متجر أونلاين)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* نوع السوق / النشاط */}
            <div>
              <Label htmlFor="marketType">نوع السوق / النشاط</Label>
              <Select
              name="marketType"
              value={form.marketType || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, marketType: v }))}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="اختر نوع السوق" />
              </SelectTrigger>
              <SelectContent>
                {marketTypeOptions.length > 0 ? (
                  marketTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>لا توجد خيارات</SelectItem>
                )}
              </SelectContent>
            </Select>
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="newMarketType"
                    value={newMarketType}
                    onChange={(e) => setNewMarketType(e.target.value)}
                    placeholder="أضف نوعاً جديداً"
                    className="bg-background/50"
                  />
                  <Button type="button" onClick={() => {
                    const trimmedType = newMarketType.trim();
                    if (!trimmedType) return;
                    setMarketTypeOptions((current) => Array.from(new Set([...current, trimmedType])));
                    setForm((f) => ({ ...f, marketType: trimmedType }));
                    setNewMarketType("");
                  }} disabled={!newMarketType.trim()}>
                    إضافة
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {loadingTypes ? "جارٍ تحميل الفئات..." : "اختر من الفئات الحالية أو أضف فئة جديدة"}
                </div>
                {marketTypeOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {marketTypeOptions.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-sm transition ${form.marketType === type ? 'border-primary bg-primary text-white' : 'border-secondary bg-secondary/10 text-secondary'}`}
                        onClick={() => setForm((f) => ({ ...f, marketType: type }))}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* حقول الموقع الجغرافي */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <Label htmlFor="location">الموقع / المحافظة والمدينة</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={form.location} 
                  onChange={handleChange} 
                  placeholder="مثال: بغداد - الكرادة"
                  className="bg-background/50" 
                />
              </div>

              <div>
                <Label htmlFor="latitude">خط العرض (Latitude)</Label>
                <Input 
                  id="latitude" 
                  name="latitude" 
                  type="number" 
                  step="0.0001"
                  value={form.latitude} 
                  onChange={handleChange} 
                  placeholder="33.3128"
                  className="bg-background/50" 
                />
              </div>

              <div>
                <Label htmlFor="longitude">خط الطول (Longitude)</Label>
                <Input 
                  id="longitude" 
                  name="longitude" 
                  type="number" 
                  step="0.0001"
                  value={form.longitude} 
                  onChange={handleChange} 
                  placeholder="44.3615"
                  className="bg-background/50" 
                />
              </div>
            </div>

            {/* الباقة */}
            <div>
              <Label htmlFor="packageName">الباقة *</Label>
              <Select name="packageName" value={form.packageName} onValueChange={(v) => setForm((f) => ({ ...f, packageName: v }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="اختر الباقة" />
                </SelectTrigger>
                <SelectContent>
                  {packages.length > 0 ? (
                    packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.slug}>
                        {pkg.name} {pkg.price ? `(${pkg.price} ر.س)` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="basic">الباقة الأساسية</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* زر الإرسال */}
            <Button type="submit" className="w-full !mt-6" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <UploadCloud className="ml-2 h-4 w-4" />
              {submitting ? "جاري إنشاء المتجر..." : "إنشاء المتجر"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
