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
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
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

        const { data, error } = await supabase.from("stores").select("market_type");
        if (!error && data) {
          const persistedTypes = Array.from(
            new Set(
              data
                .map((row: any) => row.market_type || row.marketType)
                .filter((type: unknown): type is string => typeof type === "string" && type.trim().length > 0)
            )
          );
          const persistedTypeStrings = persistedTypes as string[];
          setMarketTypeOptions(persistedTypeStrings);
          if (persistedTypeStrings.length > 0) {
            const firstMarketType = persistedTypeStrings[0] ?? "";
            setForm((current) => ({ ...current, marketType: firstMarketType }));
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
      if (!form.name || !form.ownerName || !form.ownerEmail || !form.password || !form.whatsappNumber) {
        throw new Error("الرجاء ملء جميع الحقول الأساسية.");
      }

      const result = await createStoreOwner({
        ownerEmail: form.ownerEmail,
        ownerName: form.ownerName,
        ownerPassword: form.password,
        storeName: form.name,
        whatsappNumber: form.whatsappNumber,
        marketType: form.marketType,
        packageName: form.packageName,
        storeType: form.storeType,
      });

      if (!result.success) {
        throw new Error(result.error || "فشل إنشاء المتجر.");
      }

      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "فشل إنشاء المتجر.");
    } finally {
      setSubmitting(false);
    }
  };

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
            <div>
              <Label htmlFor="name">اسم المتجر</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <Label htmlFor="ownerName">اسم صاحب المتجر</Label>
              <Input id="ownerName" name="ownerName" value={form.ownerName} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <Label htmlFor="ownerEmail">البريد الإلكتروني لصاحب المتجر</Label>
              <Input id="ownerEmail" name="ownerEmail" type="email" value={form.ownerEmail} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور الأولية</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">رقم الواتساب</Label>
              <Input id="whatsappNumber" name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} required className="bg-background/50" />
            </div>
            <div>
              <Label htmlFor="marketType">نوع السوق / النشاط</Label>
              <Select name="marketType" value={form.marketType} onValueChange={(v) => setForm((f) => ({ ...f, marketType: v }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="اختر نوع السوق" />
                </SelectTrigger>
                <SelectContent>
                  {marketTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
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
              </div>
            </div>
            <div>
              <Label htmlFor="packageName">الباقة</Label>
              <Select name="packageName" value={form.packageName} onValueChange={(v) => setForm((f) => ({ ...f, packageName: v }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="اختر الباقة" />
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
            <div>
              <Label htmlFor="storeType">نوع المتجر</Label>
              <Select name="storeType" value={form.storeType} onValueChange={(v) => setForm((f) => ({ ...f, storeType: v }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="فعلي">فعلي</SelectItem>
                  <SelectItem value="إلكتروني">إلكتروني</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full !mt-4" size="lg" disabled={submitting}>
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
