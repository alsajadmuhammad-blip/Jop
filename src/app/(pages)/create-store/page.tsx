"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Zap, Star, Infinity } from "lucide-react";
import CreateStoreForm from "@/app/(pages)/admin/stores/create-store-form";
import { fetchStorePackages } from "@/services/supabase-db";
import type { StorePackage } from "@/lib/types";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

function PackageCard({
  pkg,
  isSelected,
  isPopular,
  index,
  onSelect,
}: {
  pkg: StorePackage;
  isSelected: boolean;
  isPopular: boolean;
  index: number;
  onSelect: () => void;
}) {
  const features: string[] = pkg.metadata?.features ?? [];
  const isFree = pkg.price === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative"
    >
      {/* شارة الأكثر شيوعاً فوق البطاقة */}
      {isPopular && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg shadow-amber-500/30">
            <Star className="w-3 h-3 fill-white" />
            الأكثر شيوعاً
          </span>
        </div>
      )}

      <button
        onClick={onSelect}
        className="w-full text-right focus:outline-none group"
      >
        <motion.div
          whileHover={{ y: -6, transition: { duration: 0.25 } }}
          whileTap={{ scale: 0.985 }}
          className={`relative h-full rounded-3xl overflow-hidden transition-all duration-300 ${
            isSelected
              ? "shadow-2xl shadow-primary/20"
              : "shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
          }`}
        >
          {/* حدود البطاقة */}
          <div
            className={`absolute inset-0 rounded-3xl transition-all duration-300 pointer-events-none z-10 ${
              isSelected
                ? "ring-2 ring-primary ring-offset-0"
                : "ring-1 ring-slate-200/80 group-hover:ring-slate-300"
            }`}
          />

          {/* شريط لوني علوي للبطاقة الشائعة أو المحددة */}
          <div
            className={`h-1.5 w-full transition-all duration-300 ${
              isSelected
                ? "bg-gradient-to-r from-primary via-primary/90 to-primary/70"
                : isPopular
                ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300"
                : "bg-transparent"
            }`}
          />

          {/* المحتوى الرئيسي */}
          <div className="bg-white px-6 pt-6 pb-7 flex flex-col h-full">

            {/* اسم الباقة */}
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold transition-colors duration-200 ${
                isSelected ? "text-primary" : "text-slate-900"
              }`}>
                {pkg.name}
              </h3>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                isSelected
                  ? "bg-primary border-primary scale-110"
                  : "border-slate-300 group-hover:border-primary/50"
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </div>
            </div>

            {/* السعر — العنصر الأبرز */}
            <div className="mb-6">
              <div className="flex items-end gap-2 mb-1">
                {isFree ? (
                  <span className={`text-5xl font-black tracking-tight transition-colors duration-200 ${
                    isSelected ? "text-primary" : "text-slate-900"
                  }`}>
                    مجاني
                  </span>
                ) : (
                  <>
                    <span className={`text-5xl font-black tracking-tight leading-none transition-colors duration-200 ${
                      isSelected ? "text-primary" : "text-slate-900"
                    }`}>
                      {pkg.price.toLocaleString()}
                    </span>
                    <span className="text-slate-500 text-base font-medium mb-1.5">د.ع</span>
                  </>
                )}
              </div>
              {pkg.subscriptionDuration && (
                <p className="text-sm text-slate-400">
                  لمدة {pkg.subscriptionDuration} يوم
                </p>
              )}
            </div>

            {/* الوصف */}
            {pkg.description && (
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                {pkg.description}
              </p>
            )}

            {/* فاصل */}
            <div className={`h-px mb-5 transition-colors duration-200 ${
              isSelected ? "bg-primary/15" : "bg-slate-100"
            }`} />

            {/* عدد المنتجات */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-slate-500">عدد المنتجات</span>
              <div className="flex items-center gap-1.5">
                {pkg.productLimit === 999999 ? (
                  <>
                    <Infinity className={`w-4 h-4 ${isSelected ? "text-primary" : "text-slate-700"}`} />
                    <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-slate-800"}`}>
                      غير محدود
                    </span>
                  </>
                ) : (
                  <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-slate-800"}`}>
                    {pkg.productLimit} منتج
                  </span>
                )}
              </div>
            </div>

            {/* المميزات */}
            {features.length > 0 && (
              <ul className="space-y-3 flex-1">
                {features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-colors duration-200 ${
                      isSelected
                        ? "bg-primary/10"
                        : "bg-slate-100"
                    }`}>
                      <Check className={`w-3 h-3 stroke-[2.5] ${
                        isSelected ? "text-primary" : "text-slate-500"
                      }`} />
                    </span>
                    <span className="text-sm text-slate-600 leading-snug">{feature}</span>
                  </li>
                ))}
                {features.length > 4 && (
                  <li className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">+{features.length - 4} مميزات أخرى</span>
                  </li>
                )}
              </ul>
            )}

            {/* مؤشر الاختيار السفلي */}
            <div className={`mt-6 w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
              isSelected
                ? "bg-primary text-white"
                : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
            }`}>
              {isSelected ? "✓ تم الاختيار" : "اختيار هذه الباقة"}
            </div>
          </div>
        </motion.div>
      </button>
    </motion.div>
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
      {/* الترويسة */}
      <div className="text-center mb-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-5"
        >
          <Zap className="w-3.5 h-3.5 fill-primary" />
          <span className="text-sm font-semibold">ابدأ متجرك الآن</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          اختر الباقة المناسبة
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          حدد الباقة التي تناسب احتياجات متجرك، يمكنك تغييرها في أي وقت
        </p>
      </div>

      {/* رابط العودة */}
      <div className="mb-10">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للتسجيل
        </Link>
      </div>

      {/* الباقات */}
      {packages.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-20 text-center">
            <p className="text-slate-400 text-sm">لا توجد باقات متاحة حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 mb-12 items-start">
            {packages.map((pkg, i) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                index={i}
                isSelected={selectedSlug === pkg.slug}
                isPopular={hasManyPaid && pkg.price > 0 && pkg.price === maxPaidPrice}
                onSelect={() => onSelectSlug(pkg.slug)}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={onContinue}
              size="lg"
              className="px-12 h-12 text-base font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
              disabled={!selectedSlug}
            >
              متابعة البيانات
            </Button>
            <p className="text-xs text-slate-400">يمكنك تغيير الباقة لاحقاً من لوحة التحكم</p>
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
            className="text-slate-400 hover:text-slate-900 transition-colors"
            aria-label="العودة لاختيار الباقة"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إكمال البيانات</h1>
            {selectedPackage && (
              <p className="text-sm text-slate-400">
                الباقة: <span className="font-semibold text-slate-600">{selectedPackage.name}</span>
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

          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-800 leading-relaxed">
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white">
      <AnimatePresence mode="wait">
        {currentStep === "select" ? (
          <div key="select" className="container mx-auto px-4 py-10 md:py-16">
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
