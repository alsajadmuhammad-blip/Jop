"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Zap, Star, Infinity, Tag } from "lucide-react";
import CreateStoreForm from "@/app/(pages)/admin/stores/create-store-form";
import { fetchStorePackages } from "@/services/supabase-db";
import { validatePartnerCode } from "@/services/supabase-admin";
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
  discountPercent = 0,
}: {
  pkg: StorePackage;
  isSelected: boolean;
  isPopular: boolean;
  index: number;
  onSelect: () => void;
  discountPercent?: number;
}) {
  const features: string[] = pkg.metadata?.features ?? [];
  const isFree = pkg.price === 0;
  const discountedPrice = discountPercent > 0 && pkg.price > 0
    ? Math.round(pkg.price * (1 - discountPercent / 100))
    : null;

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
                  <span className={`text-5xl font-black tracking-tight transition-colors duration-200 ${isSelected ? "text-primary" : "text-slate-900"}`}>
                    مجاني
                  </span>
                ) : discountedPrice !== null ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base text-slate-400 line-through font-medium">{pkg.price.toLocaleString()} د.ع</span>
                    <div className="flex items-end gap-1.5">
                      <span className={`text-5xl font-black tracking-tight leading-none ${isSelected ? "text-primary" : "text-emerald-600"}`}>
                        {discountedPrice.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-base font-medium mb-1.5">د.ع</span>
                      <span className="rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 mb-2 self-end">-{discountPercent}%</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className={`text-5xl font-black tracking-tight leading-none transition-colors duration-200 ${isSelected ? "text-primary" : "text-slate-900"}`}>
                      {pkg.price.toLocaleString()}
                    </span>
                    <span className="text-slate-500 text-base font-medium mb-1.5">د.ع</span>
                  </>
                )}
              </div>
              {pkg.subscriptionDuration && (
                <p className="text-sm text-slate-400">لمدة {pkg.subscriptionDuration} يوم</p>
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

// ── معلومات الشريك بعد التحقق ────────────────────────────
type PartnerInfo = { id: string; name: string; discountPercent: number };

function PackageSelectStep({
  packages,
  selectedSlug,
  onSelectSlug,
  onContinue,
  partnerCode,
  onPartnerCodeChange,
  partnerInfo,
  partnerValidating,
  partnerError,
  onValidatePartner,
  onClearPartner,
}: {
  packages: StorePackage[];
  selectedSlug: string;
  onSelectSlug: (slug: string) => void;
  onContinue: () => void;
  partnerCode: string;
  onPartnerCodeChange: (v: string) => void;
  partnerInfo: PartnerInfo | null;
  partnerValidating: boolean;
  partnerError: string;
  onValidatePartner: () => void;
  onClearPartner: () => void;
}) {
  const maxPaidPrice = Math.max(...packages.filter((p) => p.price > 0).map((p) => p.price), 0);
  const hasManyPaid = packages.filter((p) => p.price > 0).length > 1;
  const discount = partnerInfo?.discountPercent ?? 0;

  return (
    <motion.div {...fadeUp} className="max-w-5xl mx-auto">
      {/* الترويسة */}
      <div className="text-center mb-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-5">
          <Zap className="w-3.5 h-3.5 fill-primary" />
          <span className="text-sm font-semibold">ابدأ متجرك الآن</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">اختر الباقة المناسبة</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">حدد الباقة التي تناسب احتياجات متجرك</p>
      </div>

      {/* رابط العودة */}
      <div className="mb-8">
        <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للتسجيل
        </Link>
      </div>

      {/* ── كود الشريك ───────────────────────────────── */}
      <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" /> كود الشريك
          <span className="text-slate-400 font-normal">(اختياري — إذا أعطاك أحد الشركاء كوداً)</span>
        </p>

        {partnerInfo ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-emerald-800">
                ✅ كود {partnerCode} — {partnerInfo.name}
              </p>
              {partnerInfo.discountPercent > 0 && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  خصم {partnerInfo.discountPercent}% على سعر الباقة مُفعَّل 🎉
                </p>
              )}
            </div>
            <button onClick={onClearPartner} className="text-xs text-red-500 hover:underline font-semibold">إزالة</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={partnerCode}
              onChange={(e) => onPartnerCodeChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') onValidatePartner(); }}
              placeholder="مثال: AHMED2024"
              maxLength={20}
              dir="ltr"
              className="flex-1 h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-mono uppercase tracking-widest outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <button
              onClick={onValidatePartner}
              disabled={partnerValidating || !partnerCode.trim()}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {partnerValidating ? '…' : 'تحقق'}
            </button>
          </div>
        )}
        {partnerError && <p className="text-xs text-destructive font-semibold mt-1.5">{partnerError}</p>}
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
          {discount > 0 && (
            <p className="text-center text-sm font-bold text-emerald-600 mb-4">
              🎉 يتم تطبيق خصم {discount}% على الأسعار بفضل كود الشريك
            </p>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 mb-12 items-start">
            {packages.map((pkg, i) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                index={i}
                isSelected={selectedSlug === pkg.slug}
                isPopular={hasManyPaid && pkg.price > 0 && pkg.price === maxPaidPrice}
                onSelect={() => onSelectSlug(pkg.slug)}
                discountPercent={discount}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button onClick={onContinue} size="lg"
              className="px-12 h-12 text-base font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
              disabled={!selectedSlug}>
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
  partnerCode,
  partnerUserId,
}: {
  selectedPackage: StorePackage | null;
  onBack: () => void;
  partnerCode?: string;
  partnerUserId?: string;
}) {
  return (
    <motion.div {...fadeUp}>
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-900 transition-colors" aria-label="العودة لاختيار الباقة">
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
          {partnerCode && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm">
              <span className="text-emerald-600">🤝</span>
              <span className="font-semibold text-emerald-800">الكود المطبق: {partnerCode}</span>
            </div>
          )}
          <div className="rounded-3xl border border-slate-200 bg-card p-6 md:p-8 shadow-lg">
            <CreateStoreForm
              mode="public"
              showPackageSelector={false}
              defaultPackageSlug={selectedPackage?.slug}
              partnerCode={partnerCode}
              partnerUserId={partnerUserId}
            />
          </div>
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-800 leading-relaxed">
              <span className="font-semibold">ملاحظة:</span> إذا اخترت باقة مدفوعة، ستنتقل لبوابة الدفع الآمنة لإكمال عملية الاشتراك.
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
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [partnerValidating, setPartnerValidating] = useState(false);
  const [partnerError, setPartnerError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchStorePackages().then((rows) => {
      if (!mounted) return;
      const active = rows.filter((pkg) => pkg.isActive && (pkg.visibility === 'public' || pkg.visibility === 'both'));
      setPackages(active);
      if (active[0]) setSelectedSlug(active[0].slug);
    });
    return () => { mounted = false; };
  }, []);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.slug === selectedSlug) ?? packages[0] ?? null,
    [packages, selectedSlug]
  );

  const handleValidatePartner = async () => {
    const code = partnerCode.trim().toUpperCase();
    if (!code) return;
    setPartnerValidating(true);
    setPartnerError("");
    try {
      const info = await validatePartnerCode(code);
      if (!info) {
        setPartnerError("الكود غير صحيح أو غير موجود");
        setPartnerInfo(null);
      } else {
        setPartnerInfo({ id: info.id, name: info.name, discountPercent: info.packageDiscountPercent });
        setPartnerError("");
      }
    } catch {
      setPartnerError("حدث خطأ أثناء التحقق، حاول مرة أخرى");
    } finally {
      setPartnerValidating(false);
    }
  };

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
              partnerCode={partnerCode}
              onPartnerCodeChange={(v) => { setPartnerCode(v); setPartnerError(""); }}
              partnerInfo={partnerInfo}
              partnerValidating={partnerValidating}
              partnerError={partnerError}
              onValidatePartner={handleValidatePartner}
              onClearPartner={() => { setPartnerInfo(null); setPartnerCode(""); setPartnerError(""); }}
            />
          </div>
        ) : (
          <div key="form">
            <FormStep
              selectedPackage={selectedPackage}
              onBack={() => setCurrentStep("select")}
              partnerCode={partnerInfo ? partnerCode : undefined}
              partnerUserId={partnerInfo?.id}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
