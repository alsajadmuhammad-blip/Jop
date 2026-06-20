"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Zap } from "lucide-react";
import CreateStoreForm from "@/app/(pages)/admin/stores/create-store-form";
import { fetchStorePackages } from "@/services/supabase-db";
import type { StorePackage } from "@/lib/types";

export default function CreateStorePage() {
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [currentStep, setCurrentStep] = useState<"select" | "form">("select");

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

  const handleSelectPackage = () => {
    if (selectedPackage) {
      setCurrentStep("form");
    }
  };

  const handleBackToSelect = () => {
    setCurrentStep("select");
  };

  // Step 1: Select Package
  if (currentStep === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary mb-4">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">ابدأ متجرك الآن</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">اختر الباقة المناسبة</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">حدد الباقة التي تناسب احتياجات متجرك، يمكنك تغييرها لاحقاً</p>
            </div>

            {/* Back Link */}
            <div className="mb-8">
              <Link href="/register" className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium">
                <ArrowRight className="w-4 h-4" />
                العودة للتسجيل
              </Link>
            </div>

            {/* Packages Grid */}
            {packages.length === 0 ? (
              <Card className="border-dashed border-slate-300">
                <CardContent className="py-16 text-center">
                  <p className="text-slate-600">لا توجد باقات متاحة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {packages.map((pkg) => {
                    const isSelected = selectedSlug === pkg.slug;
                    const features = pkg.metadata?.features || [];
                    const isPopular = pkg.price > 0 && packages.filter((p) => p.price > 0).length > 1 && pkg.price === Math.max(...packages.filter((p) => p.price > 0).map((p) => p.price));

                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedSlug(pkg.slug)}
                        className={`text-right transition-all duration-300 group ${isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:scale-105"}`}
                      >
                        <Card
                          className={`h-full overflow-hidden border-2 transition-all ${
                            isSelected
                              ? "bg-primary/8 border-primary shadow-lg"
                              : "bg-white border-slate-200 hover:border-primary/50"
                          }`}
                        >
                          {isPopular && !isSelected && (
                            <div className="bg-gradient-to-r from-amber-50 to-transparent px-4 py-2 border-b border-amber-200">
                              <p className="text-xs font-bold text-amber-700">⭐ الأكثر شيوعاً</p>
                            </div>
                          )}
                          {isPopular && isSelected && (
                            <div className="bg-gradient-to-r from-primary/20 to-transparent px-4 py-2 border-b border-primary/30">
                              <p className="text-xs font-bold text-primary">⭐ الأكثر شيوعاً</p>
                            </div>
                          )}

                          <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">{pkg.slug}</p>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Price */}
                            <div className="mb-6 pb-6 border-b border-slate-200">
                              <div className="text-3xl font-bold text-slate-900">
                                {pkg.price === 0 ? "مجاني" : `${pkg.price.toLocaleString()} د.ع`}
                              </div>
                              {pkg.subscriptionDuration && (
                                <p className="text-sm text-slate-600 mt-1">لمدة {pkg.subscriptionDuration} يوم</p>
                              )}
                            </div>

                            {/* Description */}
                            {pkg.description && (
                              <p className="text-slate-700 text-sm mb-6 leading-relaxed">{pkg.description}</p>
                            )}

                            {/* Quotas */}
                            <div className="space-y-2 mb-6 pb-6 border-b border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 text-sm">عدد المنتجات</span>
                                <span className="font-bold text-slate-900">
                                  {pkg.productLimit === 999999 ? "غير محدود" : `${pkg.productLimit} منتج`}
                                </span>
                              </div>
                            </div>

                            {/* Features */}
                            {features.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-700 uppercase">المميزات</p>
                                <ul className="space-y-2">
                                  {features.slice(0, 4).map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                  {features.length > 4 && (
                                    <li className="text-xs text-primary font-semibold">
                                      +{features.length - 4} مميزات إضافية
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </button>
                    );
                  })}
                </div>

                {/* Action Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSelectPackage}
                    size="lg"
                    className="px-8"
                    disabled={!selectedPackage}
                  >
                    متابعة البيانات
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Fill Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBackToSelect}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">إكمال البيانات</h1>
            <p className="text-sm text-slate-600">الباقة: <span className="font-semibold">{selectedPackage?.name}</span></p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-card p-6 md:p-8 shadow-lg">
            <CreateStoreForm mode="public" showPackageSelector={false} defaultPackageSlug={selectedPackage?.slug} />
          </div>

          {/* Info */}
          <div className="mt-8 p-6 rounded-2xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900 leading-relaxed">
              <span className="font-semibold">ملاحظة:</span> إذا اخترت باقة مدفوعة، ستنتقل لبوابة الدفع الآمنة لإكمال عملية الاشتراك.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
