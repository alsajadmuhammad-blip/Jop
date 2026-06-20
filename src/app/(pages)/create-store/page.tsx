"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Zap } from "lucide-react";
import CreateStoreForm from "@/app/(pages)/admin/stores/create-store-form";
import { fetchStorePackages } from "@/services/supabase-db";
import type { StorePackage } from "@/lib/types";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: "easeOut" },
};

function PopularBadge({ highlighted }: { highlighted: boolean }) {
  return (
    <div
      className={`px-4 py-2 border-b text-xs font-bold ${
        highlighted
          ? "bg-gradient-to-r from-primary/20 to-transparent border-primary/30 text-primary"
          : "bg-gradient-to-r from-amber-50 to-transparent border-amber-200 text-amber-700"
      }`}
    >
      ⭐ الأكثر شيوعاً
    </div>
  );
}

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

  return (
    <button
      onClick={onSelect}
      className={`text-right w-full transition-all duration-300 ${
        isSelected ? "ring-2 ring-primary ring-offset-2 rounded-xl" : "hover:scale-[1.02]"
      }`}
    >
      <Card
        className={`h-full overflow-hidden border-2 transition-colors ${
          isSelected
            ? "bg-primary/8 border-primary shadow-lg"
            : "bg-white border-slate-200 hover:border-primary/50"
        }`}
      >
        {isPopular && <PopularBadge highlighted={isSelected} />}

        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
              {pkg.description && (
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{pkg.description}</p>
              )}
            </div>
            {isSelected && (
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </span>
            )}
          </div>

          <div className="pb-5 border-b border-slate-200">
            <p className="text-3xl font-bold text-slate-900">
              {pkg.price === 0 ? "مجاني" : `${pkg.price.toLocaleString()} د.ع`}
            </p>
            {pkg.subscriptionDuration && (
              <p className="text-sm text-slate-500 mt-1">لمدة {pkg.subscriptionDuration} يوم</p>
            )}
          </div>

          <div className="flex items-center justify-between pb-5 border-b border-slate-200">
            <span className="text-slate-600 text-sm">عدد المنتجات</span>
            <span className="font-bold text-slate-900">
              {pkg.productLimit === 999999 ? "غير محدود" : `${pkg.productLimit} منتج`}
            </span>
          </div>

          {features.length > 0 && (
            <ul className="space-y-2">
              {features.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  {feature}
                </li>
              ))}
              {features.length > 4 && (
                <li className="text-xs text-primary font-semibold">
                  +{features.length - 4} مميزات إضافية
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </button>
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
