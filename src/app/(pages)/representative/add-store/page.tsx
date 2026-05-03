"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud } from "lucide-react";
import { supabase } from "@/services/supabase";
import { createStoreOwner } from "@/services/supabase-functions";

export default function AddStoreByRepresentative() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    password: "",
    whatsappNumber: "",
    marketType: "phones",
    packageName: "basic",
    paymentProof: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user || userRole !== "representative") {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    if (name === "paymentProof") {
      setForm((f) => ({ ...f, paymentProof: files?.[0] || null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!form.name || !form.ownerName || !form.ownerEmail || !form.password || !form.whatsappNumber) {
        throw new Error("الرجاء ملء جميع الحقول الأساسية.");
      }

      let paymentUrl: string | null = null;
      if (form.paymentProof) {
        const file = form.paymentProof;
        const filePath = `rep/${user?.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, file);
        if (uploadError) {
          throw uploadError;
        }
        paymentUrl = uploadData.path;
      }

      const result = await createStoreOwner({
        ownerEmail: form.ownerEmail,
        ownerName: form.ownerName,
        ownerPassword: form.password,
        storeName: form.name,
        whatsappNumber: form.whatsappNumber,
        marketType: form.marketType,
        packageName: form.packageName,
        storeType: 'إلكتروني',
        registeredByAgentId: user?.id,
        paymentProofUrl: paymentUrl,
      });

      if (!result.success) {
        throw new Error(result.error || "فشل إنشاء المتجر.");
      }

      router.push("/representative");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "فشل إنشاء المتجر.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>إضافة متجر جديد</CardTitle>
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
              <Select name="marketType" value={form.marketType} onValueChange={v => setForm(f => ({ ...f, marketType: v }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="اختر نوع السوق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phones">محلات هواتف</SelectItem>
                  <SelectItem value="spare-parts">مراكز قطع غيار</SelectItem>
                  <SelectItem value="clothes">ملابس</SelectItem>
                  <SelectItem value="accessories">اكسسوارات</SelectItem>
                  <SelectItem value="perfumes">عطور</SelectItem>
                  <SelectItem value="shoes">أحذية</SelectItem>
                  <SelectItem value="grocery">مواد غذائية</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="packageName">الباقة</Label>
              <Select name="packageName" value={form.packageName} onValueChange={v => setForm(f => ({ ...f, packageName: v }))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="اختر الباقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">الباقة الأساسية</SelectItem>
                  <SelectItem value="plus">باقة بلس</SelectItem>
                  <SelectItem value="premium">باقة بريميوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentProof">إرفاق صورة إثبات الدفع</Label>
              <Input id="paymentProof" name="paymentProof" type="file" accept="image/*" onChange={handleChange} required className="bg-background/50" />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full !mt-4" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <UploadCloud className="ml-2 h-4 w-4" />
              {submitting ? "جاري الإضافة..." : "إضافة المتجر"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
