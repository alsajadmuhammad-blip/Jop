"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, CheckCircle2, Package, Zap } from "lucide-react";
import CreateStoreForm from "@/app/(pages)/admin/stores/create-store-form";
import { fetchStorePackages } from "@/services/supabase-db";
import type { StorePackage } from "@/lib/types";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: "easeOut" },
};

function PackageCard({
  pkg,
  isSelected,
  isPopular,
  onSelect,
}: {
  pkg: StorePackage;
  isSelected: boolean;
  isPopular: boolean;
  onSelect: () => void;
}) {
  const features: string[] = pkg.metadata?.features ?? [];
  const isFree = pkg.price === 0;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="text-right w-full focus:outline-none"
    >
      <div
        className={`relative h-full rounded-2xl overflow-hidden transition-all duration-300 ${
          isSelected
            ? "shadow-xl shadow-primary/15 ring-2 ring-primary ring-offset-2"
            : "shadow-md hover:shadow-lg ring-1 ring-slate-200 hover:ring-primary/30"
        }`}
      >
        {/* شريط الرأس الملوّن */}
        <div
          className={`relative px-6 pt-6 pb-8 ${
            isSelected
              ? "bg-gradient-to-br from-primary to-primary/80"
              : isFree
              ? "bg-gradient-to-br from-slate-700 to-slate-800"
              : "bg-gradient-to-br from-slate-800 to-slate-900"
          }`}
        >
          {/* شارة الأكثر شيوعاً */}
          {isPopular && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
              ⭐ الأكثر شيوعاً
            </span>
          )}

          {/* أيقونة + اسم الباقة */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  isSelected ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <Package className="w-5 h-5 text-white" />
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">{pkg.name}</h3>
            </div>
            {isSelected && (
              <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* السعر */}
          <div>
            <p className="text-4xl font-extrabold text-white tracking-tight">
              {isFree ? "مجاني" : pkg.price.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {!isFree && (
                <span className="text-sm font-medium text-white/70">د.ع</span>
              )}
              {pkg.subscriptionDuration && (
                <span className="text-sm text-white/60">
                  {!isFree && "/ "}لمدة {pkg.subscriptionDuration} يوم
                </span>
              )}
            </div>
          </div>

          {/* منحنى سفلي */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-5 rounded-t-[24px] ${
              isSelected ? "bg-primary/5" : "bg-slate-50"
            }`}
          />
        </div>

        {/* جسم البطاقة */}
        <div
          className={`px-6 pt-4 pb-6 space-y-4 ${
            isSelected ? "bg-primary/5" : "bg-slate-50"
          }`}
        >
          {/* الوصف */}
          {pkg.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{pkg.description}</p>
          )}

          {/* عدد المنتجات */}
          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 ${
              isSelected ? "bg-primary/10" : "bg-white border border-slate-200"
            }`}
          >
            <span className="text-sm text-slate-600">عدد المنتجات</span>
            <span
              className={`text-sm font-bold ${
                isSelected ? "text-primary" : "text-slate-900"
              }`}
            >
              {pkg.productLimit === 999999 ? "غير محدود" : `${pkg.productLimit} منتج`}
            </span>
          </div>

          {/* المميزات */}
          {features.length > 0 && (
            <ul className="space-y-2.5 pt-1">
              {features.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isSelected ? "text-primary" : "text-slate-400"
                    }`}
                  />
                  {feature}
                </li>
              ))}
              {features.length > 4 && (
                <li className="text-xs font-semibold text-primary pr-6">
                  +{features.length - 4} مميزات إضافية
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function PackageSelectStep({
  packages,
  selectedSlug,
  onSelectSlug,
  onContinue,
}: {
  packages: StorePackage[];
  selectedSlug: string;
  onSelectSlug: (slug: string) => void;
  onContinue: () => void;
}) {
  const maxPaidPrice = Math.max(
    ...packages.filter((p) => p.price > 0).map((p) => p.price),
    0
  );
  const hasManyPaid = packages.filter((p) => p.price > 0).length > 1;

  return (
    <motion.div {...fadeUp} className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary mb-4">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">ابدأ متجرك الآن</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">اختر الباقة المناسبة</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          حدد الباقة التي تناسب احتياجات متجرك، يمكنك تغييرها لاحقاً
        </p>
      </div>

      <div className="mb-8">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للتسجيل
        </Link>
      </div>

      {packages.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">لا توجد باقات متاحة حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isSelected={selectedSlug === pkg.slug}
                isPopular={hasManyPaid && pkg.price > 0 && pkg.price === maxPaidPrice}
                onSelect={() => onSelectSlug(pkg.slug)}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onContinue}
              size="lg"
              className="px-10"
              disabled={!selectedSlug}
            >
              متابعة البيانات
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function FormStep({
  selectedPackage,
  onBack,
}: {
  selectedPackage: StorePackage | null;
  onBack: () => void;
}) {
  return (
    <motion.div {...fadeUp}>
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-900 transition-colors"
            aria-label="العودة لاختيار الباقة"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إكمال البيانات</h1>
            {selectedPackage && (
              <p className="text-sm text-slate-500">
                الباقة: <span className="font-semibold text-slate-700">{selectedPackage.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-card p-6 md:p-8 shadow-lg">
            <CreateStoreForm
              mode="public"
              showPackageSelector={false}
              defaultPackageSlug={selectedPackage?.slug}
            />
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900 leading-relaxed">
              <span className="font-semibold">ملاحظة:</span> إذا اخترت باقة مدفوعة، ستنتقل لبوابة
              الدفع الآمنة لإكمال عملية الاشتراك.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CreateStorePage() {
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [currentStep, setCurrentStep] = useState<"select" | "form">("select");

  useEffect(() => {
    let mounted = true;
    fetchStorePackages().then((rows) => {
      if (!mounted) return;
      const active = rows.filter((pkg) => pkg.isActive);
      setPackages(active);
      if (active[0]) setSelectedSlug(active[0].slug);
    });
    return () => { mounted = false; };
  }, []);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.slug === selectedSlug) ?? packages[0] ?? null,
    [packages, selectedSlug]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <AnimatePresence mode="wait">
        {currentStep === "select" ? (
          <div key="select" className="container mx-auto px-4 py-8 md:py-12">
            <PackageSelectStep
              packages={packages}
              selectedSlug={selectedSlug}
              onSelectSlug={setSelectedSlug}
              onContinue={() => selectedPackage && setCurrentStep("form")}
            />
          </div>
        ) : (
          <div key="form">
            <FormStep
              selectedPackage={selectedPackage}
              onBack={() => setCurrentStep("select")}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
