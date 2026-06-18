"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateStoreForm from "@/app/(pages)/admin/stores/create-store-form";
import { fetchStorePackages } from "@/services/supabase-db";
import type { StorePackage } from "@/lib/types";

export default function CreateStorePage() {
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPackages() {
      const rows = await fetchStorePackages();
      if (!mounted) return;
      const active = rows.filter((pkg) => pkg.isActive);
      setPackages(active);
      if (!selectedSlug && active[0]) {
        setSelectedSlug(active[0].slug);
      }
    }

    loadPackages();
    return () => { mounted = false; };
  }, [selectedSlug]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.slug === selectedSlug) || packages[0] || null,
    [packages, selectedSlug]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-background p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">إنشاء متجر جديد</p>
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">ابدأ متجرك الآن بطريقة منظمة وسلسة</h1>
                <p className="text-sm text-muted-foreground md:text-base">اختر الباقة المناسبة، ثم أكمل بيانات المتجر في نفس الصفحة. هذا المسار مخصص لفتح متجر جديد من المستخدم العام.</p>
              </div>
              <Link href="/register">
                <Button variant="outline">العودة للتسجيل</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
            <section className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-800">1) اختر الباقة</p>
                <p className="text-sm text-muted-foreground">هذه الباقات تظهر للمستخدم عند إنشاء المتجر وتُستخدم لاحقًا في نظام الاشتراك.</p>
              </div>

              {packages.length === 0 ? (
                <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">لا توجد باقات متاحة حالياً، ستظهر هنا عند تفعيلها من لوحة المشرف.</CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage?.slug === pkg.slug;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedSlug(pkg.slug)}
                        className={`rounded-3xl border p-5 text-right transition-all ${isSelected ? 'border-primary bg-primary/8 shadow-sm' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold text-slate-900">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{pkg.slug}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">{pkg.price === 0 ? 'مجانية' : `${pkg.price.toLocaleString()} د.ع`}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{pkg.description || 'لا يوجد وصف إضافي لهذه الباقة.'}</p>
                        <ul className="mt-4 space-y-2 text-sm text-slate-700">
                          {(pkg.metadata?.features || []).map((feature: string) => (
                            <li key={feature} className="rounded-full bg-white px-3 py-1">• {feature}</li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-white px-2.5 py-1">{pkg.productLimit === 999999 ? 'غير محدود' : pkg.productLimit} منتج</span>
                          <span className="rounded-full bg-white px-2.5 py-1">{pkg.subscriptionDuration} يوم اشتراك</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800">2) أكمل بيانات المتجر</p>
                <p className="text-sm text-muted-foreground">بمجرد اختيار الباقة، سيظهر التحديد في النموذج تلقائيًا دون تكرار الاختيار.</p>
              </div>
              <CreateStoreForm mode="public" showPackageSelector={false} defaultPackageSlug={selectedPackage?.slug} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
