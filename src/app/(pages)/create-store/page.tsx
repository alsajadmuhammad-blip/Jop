"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight, Check, Zap, Star, Infinity, Tag,
  User, Store, MapPin, Phone, Lock, Mail,
  Eye, EyeOff, Loader2, AlertCircle, CreditCard, Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { fetchStorePackages } from "@/services/supabase-db";
import { validatePartnerCode } from "@/services/supabase-admin";
import { registerStoreAndInitiatePayment } from "@/services/subscription-service";
import { supabase } from "@/services/supabase";
import type { StorePackage } from "@/lib/types";

// ─── ثوابت ────────────────────────────────────────────────────────

const IRAQI_GOVERNORATES = [
  "بغداد","البصرة","نينوى","الأنبار","بابل","كربلاء","النجف",
  "القادسية","ذي قار","واسط","صلاح الدين","ديالى","كركوك",
  "المثنى","ميسان","دهوك","أربيل","السليمانية",
];

const DEFAULT_MARKET_TYPES = ["مضافة"];

const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
};

// ─── أنواع البيانات ───────────────────────────────────────────────

type PartnerInfo = { id: string; name: string; discountPercent: number };

type WizardData = {
  packageSlug: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  storeName: string;
  storeType: "فعلي" | "إلكتروني" | "";
  governorate: string;
  city: string;
  marketType: string;
  phone: string;
};

type Step = "package" | "owner" | "store";

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "package", label: "الباقة",  icon: Zap   },
  { key: "owner",   label: "بيانات المالك", icon: User  },
  { key: "store",   label: "بيانات المتجر", icon: Store },
];

// ─── مؤشر الخطوات ────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {STEPS.map((step, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const Icon    = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                ${done   ? "bg-primary text-white shadow-md shadow-primary/30" : ""}
                ${active ? "bg-primary text-white shadow-lg shadow-primary/40 scale-110 ring-4 ring-primary/20" : ""}
                ${!done && !active ? "bg-slate-100 text-slate-400" : ""}
              `}>
                {done ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${active ? "text-primary" : done ? "text-slate-500" : "text-slate-300"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-14 sm:w-20 mb-5 mx-1 rounded-full transition-all duration-500 ${i < idx ? "bg-primary" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── بطاقة الباقة ────────────────────────────────────────────────

function PackageCard({ pkg, isSelected, isPopular, index, onSelect, discountPercent = 0 }: {
  pkg: StorePackage; isSelected: boolean; isPopular: boolean;
  index: number; onSelect: () => void; discountPercent?: number;
}) {
  const features: string[] = pkg.metadata?.features ?? [];
  const isFree = pkg.price === 0;
  const discountedPrice = discountPercent > 0 && pkg.price > 0
    ? Math.round(pkg.price * (1 - discountPercent / 100)) : null;

  return (
    <div}}}
      className="relative"
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-[11px] font-bold text-white shadow-lg shadow-amber-500/30">
            <Star className="w-3 h-3 fill-white" /> الأكثر شيوعاً
          </span>
        </div>
      )}
      <button onClick={onSelect} className="w-full text-right focus:outline-none group">
        <div }}}
          className={`relative h-full rounded-3xl overflow-hidden transition-all duration-300 ${
            isSelected ? "shadow-2xl shadow-primary/20" : "shadow-md hover:shadow-xl"
          }`}
        >
          <div className={`absolute inset-0 rounded-3xl transition-all duration-300 pointer-events-none z-10 ${
            isSelected ? "ring-2 ring-primary" : "ring-1 ring-slate-200/80 group-hover:ring-slate-300"
          }`} />
          <div className={`h-1.5 w-full ${
            isSelected ? "bg-gradient-to-r from-primary via-primary/90 to-primary/70"
            : isPopular ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-transparent"
          }`} />
          <div className="bg-white px-5 pt-5 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-bold ${isSelected ? "text-primary" : "text-slate-900"}`}>{pkg.name}</h3>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                isSelected ? "bg-primary border-primary scale-110" : "border-slate-300 group-hover:border-primary/50"
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </div>
            </div>
            <div className="mb-5">
              {isFree ? (
                <span className={`text-4xl font-black ${isSelected ? "text-primary" : "text-slate-900"}`}>مجاني</span>
              ) : discountedPrice !== null ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-slate-400 line-through">{pkg.price.toLocaleString()} د.ع</span>
                  <div className="flex items-end gap-1.5">
                    <span className={`text-4xl font-black leading-none ${isSelected ? "text-primary" : "text-emerald-600"}`}>{discountedPrice.toLocaleString()}</span>
                    <span className="text-slate-500 text-sm mb-1">د.ع</span>
                    <span className="rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 mb-1.5 self-end">-{discountPercent}%</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-1.5">
                  <span className={`text-4xl font-black leading-none ${isSelected ? "text-primary" : "text-slate-900"}`}>{pkg.price.toLocaleString()}</span>
                  <span className="text-slate-500 text-sm mb-1">د.ع</span>
                </div>
              )}
              {pkg.subscriptionDuration && <p className="text-xs text-slate-400 mt-1">لمدة {pkg.subscriptionDuration} يوم</p>}
            </div>
            <div className={`h-px mb-4 ${isSelected ? "bg-primary/15" : "bg-slate-100"}`} />
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-slate-500">عدد المنتجات</span>
              {pkg.productLimit === 999999
                ? <span className={`font-bold flex items-center gap-1 ${isSelected ? "text-primary" : "text-slate-800"}`}><Infinity className="w-4 h-4" />غير محدود</span>
                : <span className={`font-bold ${isSelected ? "text-primary" : "text-slate-800"}`}>{pkg.productLimit} منتج</span>
              }
            </div>
            {features.length > 0 && (
              <ul className="space-y-2.5 flex-1">
                {features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${isSelected ? "bg-primary/10" : "bg-slate-100"}`}>
                      <Check className={`w-2.5 h-2.5 stroke-[3] ${isSelected ? "text-primary" : "text-slate-500"}`} />
                    </span>
                    <span className="text-xs text-slate-600 leading-snug">{f}</span>
                  </li>
                ))}
                {features.length > 3 && <li className="text-xs text-slate-400">+{features.length - 3} مميزات أخرى</li>}
              </ul>
            )}
            <div className={`mt-5 w-full rounded-xl py-2 text-center text-sm font-semibold transition-all duration-200 ${
              isSelected ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
            }`}>
              {isSelected ? "✓ تم الاختيار" : "اختيار"}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── الخطوة ١: اختيار الباقة ────────────────────────────────────

function PackageStep({
  packages, selectedSlug, onSelect, onNext,
  partnerCode, onPartnerCodeChange,
  partnerInfo, partnerValidating, partnerError,
  onValidatePartner, onClearPartner,
}: {
  packages: StorePackage[]; selectedSlug: string;
  onSelect: (s: string) => void; onNext: () => void;
  partnerCode: string; onPartnerCodeChange: (v: string) => void;
  partnerInfo: PartnerInfo | null; partnerValidating: boolean;
  partnerError: string; onValidatePartner: () => void; onClearPartner: () => void;
}) {
  const maxPaidPrice = Math.max(...packages.filter(p => p.price > 0).map(p => p.price), 0);
  const hasManyPaid  = packages.filter(p => p.price > 0).length > 1;
  const discount     = partnerInfo?.discountPercent ?? 0;

  return (
    <div {...fadeSlide} className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900">اختر الباقة المناسبة</h2>
        <p className="text-slate-500">حدد الباقة التي تناسب احتياجات متجرك</p>
      </div>

      {/* كود الدعوة */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          كود الدعوة
          <span className="text-slate-400 font-normal text-xs">(اختياري)</span>
        </p>
        {partnerInfo ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-emerald-800">✅ كود {partnerCode} — {partnerInfo.name}</p>
              {partnerInfo.discountPercent > 0 && (
                <p className="text-xs text-emerald-600 mt-0.5">خصم {partnerInfo.discountPercent}% على سعر الباقة 🎉</p>
              )}
            </div>
            <button onClick={onClearPartner} className="text-xs text-red-500 hover:underline font-semibold">إزالة</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text" value={partnerCode}
              onChange={e => onPartnerCodeChange(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && onValidatePartner()}
              placeholder="مثال: AHMED2024" maxLength={20} dir="ltr"
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
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">لا توجد باقات متاحة حالياً</div>
      ) : (
        <>
          {discount > 0 && (
            <p className="text-center text-sm font-bold text-emerald-600">🎉 يتم تطبيق خصم {discount}% على الأسعار بفضل كود الدعوة</p>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {packages.map((pkg, i) => (
              <PackageCard
                key={pkg.id} pkg={pkg} index={i}
                isSelected={selectedSlug === pkg.slug}
                isPopular={hasManyPaid && pkg.price > 0 && pkg.price === maxPaidPrice}
                onSelect={() => onSelect(pkg.slug)}
                discountPercent={discount}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <Button onClick={onNext} size="lg" disabled={!selectedSlug}
              className="px-12 h-12 text-base font-semibold rounded-2xl shadow-lg shadow-primary/25">
              التالي — بيانات المالك
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── مكوّن حقل مدخل مع label ─────────────────────────────────────

function Field({
  label, children, error, hint,
}: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── الخطوة ٢: بيانات المالك ────────────────────────────────────

function OwnerStep({
  data, onChange, onNext, onBack,
}: {
  data: Pick<WizardData, 'ownerName' | 'email' | 'password' | 'confirmPassword'>;
  onChange: (k: keyof WizardData, v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const [showPass, setShowPass]    = useState(false);
  const [showPass2, setShowPass2]  = useState(false);
  const [errors, setErrors]        = useState<Partial<Record<keyof typeof data, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!data.ownerName.trim())               e.ownerName       = "الاسم مطلوب";
    if (!data.email.trim())                   e.email           = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "بريد إلكتروني غير صحيح";
    if (!data.password)                       e.password        = "كلمة المرور مطلوبة";
    else if (data.password.length < 6)        e.password        = "٦ أحرف على الأقل";
    if (data.password !== data.confirmPassword) e.confirmPassword = "كلمتا المرور غير متطابقتين";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) onNext(); };

  return (
    <div {...fadeSlide} className="space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-900">بيانات المالك</h2>
        <p className="text-slate-500 text-sm">ستستخدم هذه البيانات لتسجيل الدخول لاحقاً</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* الاسم */}
        <Field label="اسم صاحب المتجر *" error={errors.ownerName}>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="مثال: محمد علي"
              value={data.ownerName}
              onChange={e => { onChange('ownerName', e.target.value); setErrors(p => ({...p, ownerName: ''})); }}
              className={`pr-10 ${errors.ownerName ? 'border-destructive' : ''}`}
            />
          </div>
        </Field>

        {/* البريد */}
        <Field label="البريد الإلكتروني *" error={errors.email}>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="email" placeholder="store@example.com"
              value={data.email}
              onChange={e => { onChange('email', e.target.value); setErrors(p => ({...p, email: ''})); }}
              className={`pr-10 ${errors.email ? 'border-destructive' : ''}`}
            />
          </div>
        </Field>

        {/* كلمة المرور */}
        <Field label="كلمة المرور *" error={errors.password} hint="٦ أحرف على الأقل">
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type={showPass ? 'text' : 'password'}
              placeholder="أدخل كلمة مرور قوية"
              value={data.password}
              onChange={e => { onChange('password', e.target.value); setErrors(p => ({...p, password: ''})); }}
              className={`pr-10 pl-10 ${errors.password ? 'border-destructive' : ''}`}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {/* تأكيد كلمة المرور */}
        <Field label="تأكيد كلمة المرور *" error={errors.confirmPassword}>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type={showPass2 ? 'text' : 'password'}
              placeholder="أعد كلمة المرور"
              value={data.confirmPassword}
              onChange={e => { onChange('confirmPassword', e.target.value); setErrors(p => ({...p, confirmPassword: ''})); }}
              className={`pr-10 pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
            />
            <button type="button" onClick={() => setShowPass2(v => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-11 rounded-xl">
          <ArrowRight className="w-4 h-4 ml-1" /> رجوع
        </Button>
        <Button onClick={next} className="flex-1 h-11 rounded-xl shadow-md shadow-primary/25">
          التالي — بيانات المتجر
          <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
        </Button>
      </div>
    </div>
  );
}

// ─── الخطوة ٣: بيانات المتجر + إرسال ───────────────────────────

function StoreStep({
  data, onChange, onBack, selectedPackage, onSubmit, submitting, submitMode, setSubmitMode,
}: {
  data: Pick<WizardData, 'storeName' | 'storeType' | 'governorate' | 'city' | 'marketType' | 'phone'>;
  onChange: (k: keyof WizardData, v: string) => void;
  onBack: () => void;
  selectedPackage: StorePackage | null;
  onSubmit: (mode: 'zaincash' | 'contact') => void;
  submitting: boolean; submitMode: 'zaincash' | 'contact' | null;
  setSubmitMode: (m: 'zaincash' | 'contact') => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof typeof data, string>>>({});
  const [showAddMarket, setShowAddMarket] = useState(false);
  const [newMarket, setNewMarket] = useState('');
  const [marketTypes, setMarketTypes] = useState<string[]>(DEFAULT_MARKET_TYPES);

  const validate = () => {
    const e: typeof errors = {};
    if (!data.storeName.trim())  e.storeName  = "اسم المتجر مطلوب";
    if (!data.storeType)         e.storeType  = "نوع المتجر مطلوب";
    if (data.storeType === 'فعلي' && !data.governorate) e.governorate = "المحافظة مطلوبة";
    if (!data.marketType)        e.marketType = "فئة السوق مطلوبة";
    if (!data.phone.trim())      e.phone      = "رقم الهاتف مطلوب";
    else if (!/^\d+$/.test(data.phone)) e.phone = "أرقام فقط";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (mode: 'zaincash' | 'contact') => {
    if (!validate()) return;
    setSubmitMode(mode);
    onSubmit(mode);
  };

  const addMarket = () => {
    if (!newMarket.trim()) return;
    const v = newMarket.trim();
    if (!marketTypes.includes(v)) setMarketTypes(prev => [...prev, v].sort());
    onChange('marketType', v);
    setNewMarket('');
    setShowAddMarket(false);
  };

  const isPaid = (selectedPackage?.price ?? 0) > 0;

  return (
    <div {...fadeSlide} className="space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-900">بيانات المتجر</h2>
        <p className="text-slate-500 text-sm">الخطوة الأخيرة — أكمل تفاصيل متجرك</p>
      </div>

      {/* ملخص الباقة */}
      {selectedPackage && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">الباقة المختارة</p>
            <p className="font-bold text-slate-900">{selectedPackage.name}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-primary shadow-sm border border-primary/10">
            {selectedPackage.price === 0 ? 'مجانية' : `${selectedPackage.price.toLocaleString()} د.ع`}
          </span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* اسم المتجر */}
        <Field label="اسم المتجر *" error={errors.storeName}>
          <div className="relative">
            <Store className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="مثال: متجر النور"
              value={data.storeName}
              onChange={e => { onChange('storeName', e.target.value); setErrors(p => ({...p, storeName: ''})); }}
              className={`pr-10 ${errors.storeName ? 'border-destructive' : ''}`}
            />
          </div>
        </Field>

        {/* نوع المتجر */}
        <Field label="نوع المتجر *" error={errors.storeType}>
          <Select value={data.storeType} onValueChange={v => { onChange('storeType', v); onChange('governorate', ''); onChange('city', ''); setErrors(p => ({...p, storeType: ''})); }}>
            <SelectTrigger className={errors.storeType ? 'border-destructive' : ''}>
              <SelectValue placeholder="فعلي أم إلكتروني؟" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="فعلي">🏪 فعلي — متجر حقيقي</SelectItem>
              <SelectItem value="إلكتروني">💻 إلكتروني — أونلاين فقط</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {/* المحافظة والمدينة (للفعلي فقط) */}
        {data.storeType === 'فعلي' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="المحافظة *" error={errors.governorate}>
              <Select value={data.governorate} onValueChange={v => { onChange('governorate', v); setErrors(p => ({...p, governorate: ''})); }}>
                <SelectTrigger className={errors.governorate ? 'border-destructive' : ''}>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  {IRAQI_GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="المنطقة / الحي">
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="مثال: الكرادة"
                  value={data.city}
                  onChange={e => onChange('city', e.target.value)}
                  className="pr-10"
                />
              </div>
            </Field>
          </div>
        )}

        {/* فئة السوق */}
        <Field label="فئة المتجر *" error={errors.marketType}>
          <div className="flex gap-2">
            <Select value={data.marketType} onValueChange={v => { onChange('marketType', v); setErrors(p => ({...p, marketType: ''})); }}>
              <SelectTrigger className={`flex-1 ${errors.marketType ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="هواتف، ملابس، إلخ..." />
              </SelectTrigger>
              <SelectContent>
                {marketTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={showAddMarket} onOpenChange={setShowAddMarket}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إضافة فئة جديدة</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input placeholder="مثال: منتجات عضوية" value={newMarket} onChange={e => setNewMarket(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMarket()} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddMarket(false)}>إلغاء</Button>
                    <Button onClick={addMarket}>إضافة</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Field>

        {/* رقم الهاتف */}
        <Field label="رقم الهاتف (واتساب) *" error={errors.phone}
          hint={data.phone ? `سيُحفظ كـ: +964${data.phone}` : undefined}>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-semibold">🇮🇶 +964</span>
            <Input
              type="tel" placeholder="7XXXXXXXXX" dir="ltr"
              value={data.phone}
              onChange={e => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.startsWith('0')) v = v.slice(1);
                onChange('phone', v);
                setErrors(p => ({...p, phone: ''}));
              }}
              className={`pr-20 pl-4 text-left ${errors.phone ? 'border-destructive' : ''}`}
            />
          </div>
        </Field>
      </div>

      {/* أزرار التنقل والإرسال */}
      <div className="space-y-3">
        {isPaid ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* تواصل مع الإدارة */}
              <button
                type="button" disabled={submitting}
                onClick={() => submit('contact')}
                className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-5 text-center transition-all hover:border-slate-400 hover:shadow-md disabled:opacity-50 focus:outline-none"
              >
                {submitting && submitMode === 'contact'
                  ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  : <Phone className="h-5 w-5 text-slate-500 group-hover:text-slate-700" />
                }
                <div>
                  <p className="text-sm font-bold text-slate-800">إنشاء والتواصل مع الإدارة</p>
                  <p className="text-xs text-slate-400 mt-0.5">يتواصل فريقنا معك لإتمام الدفع</p>
                </div>
              </button>
              {/* زين كاش */}
              <button
                type="button" disabled={submitting}
                onClick={() => submit('zaincash')}
                className="relative group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary px-4 py-5 text-center transition-all hover:bg-primary/90 hover:shadow-lg shadow-primary/25 disabled:opacity-50 focus:outline-none"
              >
                <span className="absolute -top-2.5 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">تفعيل فوري</span>
                {submitting && submitMode === 'zaincash'
                  ? <Loader2 className="h-5 w-5 animate-spin text-white" />
                  : <CreditCard className="h-5 w-5 text-white" />
                }
                <div>
                  <p className="text-sm font-bold text-white">إنشاء ودفع زين كاش</p>
                  <p className="text-xs text-white/70 mt-0.5">تفعيل فوري بعد إتمام الدفع</p>
                </div>
              </button>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-800">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
              <p><strong>زين كاش:</strong> دفع فوري وتفعيل آني. &nbsp;<strong>تواصل مع الإدارة:</strong> ينشأ المتجر معلقاً ويتواصل معك فريقنا.</p>
            </div>
          </>
        ) : (
          <Button disabled={submitting} onClick={() => submit('zaincash')} size="lg"
            className="w-full h-12 text-base rounded-xl shadow-md shadow-primary/25">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري إنشاء المتجر...</> : "إنشاء المتجر الآن 🚀"}
          </Button>
        )}

        <Button variant="outline" onClick={onBack} className="w-full h-11 rounded-xl" disabled={submitting}>
          <ArrowRight className="w-4 h-4 ml-1" /> رجوع
        </Button>
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────

export default function CreateStorePage() {
  const { login } = useAuth();
  const { toast } = useToast();

  // ── الباقات ──
  const [packages, setPackages] = useState<StorePackage[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchStorePackages().then(rows => {
      if (!mounted) return;
      const active = rows.filter(p => p.isActive && (p.visibility === 'public' || p.visibility === 'both'));
      setPackages(active);
      if (active[0]) setData(d => ({ ...d, packageSlug: active[0].slug }));
    });
    return () => { mounted = false; };
  }, []);

  // ── بيانات الشريك ──
  const [partnerCode, setPartnerCode]       = useState('');
  const [partnerInfo, setPartnerInfo]       = useState<PartnerInfo | null>(null);
  const [partnerValidating, setPartnerValidating] = useState(false);
  const [partnerError, setPartnerError]     = useState('');

  const handleValidatePartner = async () => {
    const code = partnerCode.trim().toUpperCase();
    if (!code) return;
    setPartnerValidating(true); setPartnerError('');
    try {
      const info = await validatePartnerCode(code);
      if (!info) { setPartnerError('الكود غير صحيح أو غير موجود'); setPartnerInfo(null); }
      else { setPartnerInfo({ id: info.id, name: info.name, discountPercent: info.packageDiscountPercent }); }
    } catch { setPartnerError('حدث خطأ أثناء التحقق، حاول مرة أخرى'); }
    finally { setPartnerValidating(false); }
  };

  // ── بيانات الـ Wizard ──
  const [step, setStep] = useState<Step>('package');
  const [data, setData] = useState<WizardData>({
    packageSlug: '', ownerName: '', email: '', password: '',
    confirmPassword: '', storeName: '', storeType: '',
    governorate: '', city: '', marketType: '', phone: '',
  });
  const [submitting, setSubmitting]   = useState(false);
  const [submitMode, setSubmitMode]   = useState<'zaincash' | 'contact' | null>(null);

  const onChange = useCallback((k: keyof WizardData, v: string) =>
    setData(d => ({ ...d, [k]: v })), []);

  const selectedPackage = useMemo(
    () => packages.find(p => p.slug === data.packageSlug) ?? packages[0] ?? null,
    [packages, data.packageSlug],
  );

  // ── الإرسال النهائي ──
  const handleSubmit = async (mode: 'zaincash' | 'contact') => {
    if (!selectedPackage) return;
    setSubmitting(true); setSubmitMode(mode);
    try {
      const payload = {
        ownerName:  data.ownerName,
        storeName:  data.storeName,
        storeType:  data.storeType,
        marketType: data.marketType,
        ...(data.storeType === 'فعلي' && data.governorate && {
          location: [data.governorate, data.city].filter(Boolean).join(' - '),
        }),
        whatsappNumber: `+964${data.phone}`,
        ownerEmail: data.email,
        password:   data.password,
        packageId:  selectedPackage.id,
        skipPayment: mode === 'contact',
        // إرسال كود الشريك بكلا الصيغتين (snake_case و camelCase)
        // لضمان توافق الـ edge function بغض النظر عن التسمية المستخدمة
        ...(partnerInfo && partnerCode && {
          partner_code: partnerCode,
          partnerCode: partnerCode,
        }),
        ...(partnerInfo?.id && {
          registered_by_agent_id: partnerInfo.id,
          registeredByAgentId: partnerInfo.id,
        }),
      };

      const result = await registerStoreAndInitiatePayment(payload);
      if (!result.success) throw new Error(result.error || 'فشل إنشاء المتجر');

      // ── تسجيل الدخول تلقائياً ──
      try {
        await login(data.email, data.password);
      } catch {
        // لو فشل الـ auto-login ما يوقف العملية
      }

      // ── ربط المتجر بالشريك مباشرة (بعد الدخول) كـ fallback ──
      // يعمل بعد login لأن RLS يتطلب مستخدم مصادق
      if (result.storeId && partnerInfo?.id) {
        try {
          const { error: linkErr } = await supabase
            .from('stores')
            .update({
              registered_by_agent_id: partnerInfo.id,
              registeredByAgentId: partnerInfo.id,
            })
            .eq('id', result.storeId);
          if (linkErr) {
            console.warn('partner link fallback failed:', linkErr.message);
          }
        } catch {
          // لا نوقف العملية
        }
      }

      toast({
        title: mode === 'contact' ? 'تم إنشاء المتجر ✅' : result.message,
        description: mode === 'contact'
          ? 'سيتواصل معك فريقنا قريباً لتفعيل المتجر.'
          : result.paymentUrl ? 'يتم توجيهك لبوابة الدفع...' : 'تم إنشاء المتجر بنجاح!',
      });

      setTimeout(() => {
        if (result.paymentUrl && mode !== 'contact') {
          window.location.href = result.paymentUrl;
        } else {
          window.location.href = `/subscription/payment-success?transaction_id=${result.transactionId || 'pending'}&is_free=true${mode === 'contact' ? '&contact_admin=true' : ''}`;
        }
      }, 1500);

    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message || 'حدث خطأ، حاول مرة أخرى', variant: 'destructive' });
      setSubmitting(false); setSubmitMode(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white" dir="rtl">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">

        {/* رابط العودة */}
        <Link href="/register"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-8">
          <ArrowRight className="w-4 h-4" /> العودة للتسجيل
        </Link>

        {/* مؤشر الخطوات */}
        <StepIndicator current={step} />

        {/* محتوى الخطوة */}
        
          {step === 'package' && (
            <div key="package">
              <PackageStep
                packages={packages}
                selectedSlug={data.packageSlug}
                onSelect={slug => onChange('packageSlug', slug)}
                onNext={() => setStep('owner')}
                partnerCode={partnerCode}
                onPartnerCodeChange={v => { setPartnerCode(v); setPartnerError(''); }}
                partnerInfo={partnerInfo}
                partnerValidating={partnerValidating}
                partnerError={partnerError}
                onValidatePartner={handleValidatePartner}
                onClearPartner={() => { setPartnerInfo(null); setPartnerCode(''); setPartnerError(''); }}
              />
            </div>
          )}
          {step === 'owner' && (
            <div key="owner">
              <OwnerStep
                data={{ ownerName: data.ownerName, email: data.email, password: data.password, confirmPassword: data.confirmPassword }}
                onChange={onChange}
                onNext={() => setStep('store')}
                onBack={() => setStep('package')}
              />
            </div>
          )}
          {step === 'store' && (
            <div key="store">
              <StoreStep
                data={{ storeName: data.storeName, storeType: data.storeType, governorate: data.governorate, city: data.city, marketType: data.marketType, phone: data.phone }}
                onChange={onChange}
                onBack={() => setStep('owner')}
                selectedPackage={selectedPackage}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitMode={submitMode}
                setSubmitMode={setSubmitMode}
              />
            </div>
          )}
        
      </div>
    </div>
  );
}
