"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, AlertCircle, Phone, CreditCard } from "lucide-react";
import { fetchStorePackages } from "@/services/supabase-db";
import { createStoreOwner } from "@/services/supabase-admin";
import { registerStoreAndInitiatePayment } from "@/services/subscription-service";
import type { StorePackage } from "@/lib/types";

type FormData = {
  ownerName: string;
  storeName: string;
  storeType: "فعلي" | "إلكتروني" | "";
  marketType: string;
  phone: string;
  governorate: string;
  city: string;
  packageSlug: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = {
  ownerName?: string;
  storeName?: string;
  storeType?: string;
  marketType?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  packageSlug?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const DEFAULT_MARKET_TYPES = [
  "هواتف ذكية",
  "ملابس",
  "أجهزة كهربائية",
  "أثاث",
  "كتب",
  "قطع غيار",
  "مستحضرات عناية",
  "أدوات رياضية",
];

export default function CreateStoreForm({
  defaultPackageSlug,
  mode = "admin",
  showPackageSelector = true,
  partnerCode,
  partnerUserId,
}: {
  defaultPackageSlug?: string;
  mode?: "admin" | "public";
  showPackageSelector?: boolean;
  partnerCode?: string;
  partnerUserId?: string;
}) {
  const [formData, setFormData] = useState<FormData>({
    ownerName: "",
    storeName: "",
    storeType: "",
    marketType: "",
    phone: "",
    governorate: "",
    city: "",
    packageSlug: defaultPackageSlug || "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [marketTypes, setMarketTypes] = useState<string[]>(DEFAULT_MARKET_TYPES);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [newMarketType, setNewMarketType] = useState("");
  const [showAddMarketType, setShowAddMarketType] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'completed'>('form');
  const [pendingStoreData, setPendingStoreData] = useState<any>(null);
  const [submitMode, setSubmitMode] = useState<'contact' | 'zaincash' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (mode !== "public") return;

    let mounted = true;

    async function loadPackages() {
      const rows = await fetchStorePackages();
      if (mounted) {
        const activePackages = rows.filter((pkg) => pkg.isActive);
        setPackages(activePackages);
        
        // Use defaultPackageSlug if provided, otherwise use first active package
        const slugToUse = defaultPackageSlug || (activePackages[0]?.slug || "");
        setFormData((current) => ({ 
          ...current, 
          packageSlug: slugToUse || current.packageSlug 
        }));
      }
    }

    loadPackages();

    return () => {
      mounted = false;
    };
  }, [mode]);

  const validateForm = useCallback(() => {
    const newErrors: Errors = {};

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "اسم صاحب المتجر مطلوب";
    }

    if (!formData.storeName.trim()) {
      newErrors.storeName = "اسم المتجر مطلوب";
    }

    if (!formData.storeType) {
      newErrors.storeType = "نوع المتجر (فعلي/إلكتروني) مطلوب";
    }

    if (formData.storeType === "فعلي") {
      if (!formData.governorate.trim()) {
        newErrors.governorate = "المحافظة مطلوبة";
      }
      if (!formData.city.trim()) {
        newErrors.city = "المدينة مطلوبة";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = "الرقم يجب أن يحتوي على أرقام فقط";
    }

    if (!formData.marketType.trim()) {
      newErrors.marketType = "نوع السوق/المتجر مطلوب";
    }

    if (!formData.packageSlug.trim()) {
      newErrors.packageSlug = "اختر باقة الاشتراك المطلوبة";
    }

    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!formData.password.trim()) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 6) {
      newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمات المرور غير متطابقة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent, mode_override?: 'contact' | 'zaincash') => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const currentSubmitMode = mode_override ?? submitMode ?? 'zaincash';
    setLoading(true);
    try {
      const selectedPackage = packages.find(pkg => pkg.slug === formData.packageSlug);
      
      if (!selectedPackage) {
        throw new Error('الرجاء اختيار باقة صحيحة');
      }

      if (mode === "public") {
        const skipPayment = currentSubmitMode === 'contact';

        const registerPayload = {
          ownerName: formData.ownerName,
          storeName: formData.storeName,
          storeType: formData.storeType,
          marketType: formData.marketType,
          // المحافظة + المدينة → location (للمتاجر الفعلية فقط)
          ...(formData.storeType === "فعلي" && formData.governorate && {
            location: [formData.governorate, formData.city].filter(Boolean).join(" - "),
          }),
          whatsappNumber: `+964${formData.phone}`,
          ownerEmail: formData.email,
          password: formData.password,
          packageId: selectedPackage.id,
          skipPayment,
          ...(partnerCode && { partner_code: partnerCode }),
          ...(partnerUserId && { registered_by_agent_id: partnerUserId }),
        };

        const result = await registerStoreAndInitiatePayment(registerPayload);

        if (!result.success) {
          throw new Error(result.error || 'فشل إنشاء المتجر');
        }

        setPendingStoreData({
          storeId: result.storeId,
          ownerId: result.ownerId,
          transactionId: result.transactionId,
          packageId: selectedPackage.id,
        });

        if (skipPayment) {
          // Contact admin path: store created as pending, show instructions
          toast({
            title: "تم إنشاء المتجر بنجاح ✅",
            description: "سيتواصل معك فريق الإدارة قريباً لتفعيل المتجر.",
          });
          setPaymentStep("completed");
          setTimeout(() => {
            window.location.href = `/subscription/payment-success?transaction_id=${result.transactionId || 'pending'}&is_free=true&contact_admin=true`;
          }, 2000);
          return;
        }

        toast({
          title: result.message,
          description: result.amount ? 'تم توجيهك لبوابة الدفع' : 'تم إنشاء المتجر بنجاح',
          variant: "default",
        });

        if (result.paymentUrl) {
          setTimeout(() => {
            window.location.href = result.paymentUrl!;
          }, 2000);
        } else {
          setPaymentStep("completed");
          setTimeout(() => {
            window.location.href = `/subscription/payment-success?transaction_id=${result.transactionId || 'free'}&is_free=true`;
          }, 2000);
        }
      } else if (mode === "admin") {
        // Admin mode: create store directly using API
        const response = await fetch("/api/admin/create-store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerName: formData.ownerName,
            storeName: formData.storeName,
            storeType: formData.storeType,
            marketType: formData.marketType,
            phone: `+964${formData.phone}`,
            ...(formData.storeType === "فعلي" && {
              governorate: formData.governorate,
              city: formData.city,
            }),
            email: formData.email,
            password: formData.password,
            packageSlug: formData.packageSlug,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || result.message || "فشل إنشاء المتجر");
        }

        toast({
          title: "تم بنجاح",
          description: "تم إنشاء المتجر وحساب المالك بنجاح",
          variant: "default",
        });

        setPaymentStep("completed");
        resetForm();
      } else {
        throw new Error("Invalid mode or package not selected");
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء المعالجة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ownerName: "",
      storeName: "",
      storeType: "",
      marketType: "",
      phone: "",
      governorate: "",
      city: "",
      packageSlug: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleAddMarketType = async () => {
    if (!newMarketType.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال نوع متجر",
        variant: "destructive",
      });
      return;
    }

    const upperNewType = newMarketType.trim();

    if (marketTypes.includes(upperNewType)) {
      toast({
        title: "خطأ",
        description: "هذا النوع موجود بالفعل",
        variant: "destructive",
      });
      return;
    }

    setMarketTypes([...marketTypes, upperNewType].sort());
    setFormData({ ...formData, marketType: upperNewType });
    setNewMarketType("");
    setShowAddMarketType(false);
    toast({
      title: "تم",
      description: "تم إضافة نوع متجر جديد",
      variant: "default",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-lg border p-6">
      {/* Owner Name */}
      <div className="space-y-2">
        <Label htmlFor="ownerName">اسم صاحب المتجر *</Label>
        <Input
          id="ownerName"
          placeholder="أدخل اسم المالك الكامل"
          value={formData.ownerName}
          onChange={(e) =>
            setFormData({ ...formData, ownerName: e.target.value })
          }
          className={errors.ownerName ? "border-destructive" : ""}
          disabled={loading}
        />
        {errors.ownerName && (
          <p className="text-sm text-destructive">{errors.ownerName}</p>
        )}
      </div>

      {/* Store Name */}
      <div className="space-y-2">
        <Label htmlFor="storeName">اسم المتجر *</Label>
        <Input
          id="storeName"
          placeholder="أدخل اسم المتجر"
          value={formData.storeName}
          onChange={(e) =>
            setFormData({ ...formData, storeName: e.target.value })
          }
          className={errors.storeName ? "border-destructive" : ""}
          disabled={loading}
        />
        {errors.storeName && (
          <p className="text-sm text-destructive">{errors.storeName}</p>
        )}
      </div>

      {/* Store Type */}
      <div className="space-y-2">
        <Label htmlFor="storeType">نوع المتجر *</Label>
        <Select
          value={formData.storeType}
          onValueChange={(value) =>
            setFormData({ 
              ...formData, 
              storeType: value as "فعلي" | "إلكتروني",
              governorate: "",
              city: "",
            })
          }
          disabled={loading}
        >
          <SelectTrigger
            className={errors.storeType ? "border-destructive" : ""}
          >
            <SelectValue placeholder="اختر نوع المتجر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="فعلي">فعلي (مقر فعلي)</SelectItem>
            <SelectItem value="إلكتروني">إلكتروني (أونلاين فقط)</SelectItem>
          </SelectContent>
        </Select>
        {errors.storeType && (
          <p className="text-sm text-destructive">{errors.storeType}</p>
        )}
      </div>

      {/* Governorate and City */}
      {formData.storeType === "فعلي" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="governorate">المحافظة *</Label>
            <Input
              id="governorate"
              placeholder="مثال: الرياض"
              value={formData.governorate}
              onChange={(e) =>
                setFormData({ ...formData, governorate: e.target.value })
              }
              className={errors.governorate ? "border-destructive" : ""}
              disabled={loading}
            />
            {errors.governorate && (
              <p className="text-sm text-destructive">{errors.governorate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">المدينة *</Label>
            <Input
              id="city"
              placeholder="مثال: حي النرجس"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className={errors.city ? "border-destructive" : ""}
              disabled={loading}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>
        </div>
      )}

      {mode === "public" && (() => {
        const selectedPackage = packages.find((pkg) => pkg.slug === formData.packageSlug);
        return selectedPackage ? (
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 text-sm text-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">الباقة المختارة</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPackage.name}</h3>
                <p className="text-sm text-slate-600">{selectedPackage.description || 'لا يوجد وصف إضافي لهذه الباقة.'}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">{selectedPackage.price === 0 ? 'مجانية' : `${selectedPackage.price.toLocaleString()} د.ع`}</span>
            </div>
          </div>
        ) : null;
      })()}

      {showPackageSelector && mode === "public" && (
        <div className="space-y-2">
          <Label htmlFor="packageSlug">الباقة المطلوبة *</Label>
        <Select
          value={formData.packageSlug}
          onValueChange={(value) => setFormData({ ...formData, packageSlug: value })}
          disabled={loading || packages.length === 0}
        >
          <SelectTrigger className={errors.packageSlug ? "border-destructive" : ""}>
            <SelectValue placeholder={packages.length ? "اختر الباقة" : "لا توجد باقات متاحة حالياً"} />
          </SelectTrigger>
          <SelectContent>
            {packages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.slug}>
                {pkg.name} — {pkg.price === 0 ? "مجانية" : `${pkg.price.toLocaleString()} د.ع`} / {pkg.subscriptionDuration} يوم
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          {errors.packageSlug && <p className="text-sm text-destructive">{errors.packageSlug}</p>}
          <p className="text-xs text-muted-foreground">سيتم ربط هذا الاشتراك مباشرة مع متجر صاحب الحساب عند إنشاء المتجر.</p>
        </div>
      )}

      {/* Market Type */}
      <div className="space-y-2">
        <Label htmlFor="marketType">فئة/نوع السوق (الخدمة) *</Label>
        <div className="flex gap-2">
          <Select
            value={formData.marketType}
            onValueChange={(value) =>
              setFormData({ ...formData, marketType: value })
            }
            disabled={loading}
          >
            <SelectTrigger
              className={errors.marketType ? "border-destructive" : ""}
            >
              <SelectValue placeholder="اختر فئة السوق (هواتف، ملابس، إلخ)" />
            </SelectTrigger>
            <SelectContent>
              {marketTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showAddMarketType} onOpenChange={setShowAddMarketType}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة نوع متجر جديد</DialogTitle>
                <DialogDescription>
                  أدخل نوع متجر جديد لم يكن موجوداً من قبل
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="مثال: هواتف ذكية"
                  value={newMarketType}
                  onChange={(e) => setNewMarketType(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddMarketType(false)}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={handleAddMarketType}>إضافة</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {errors.marketType && (
          <p className="text-sm text-destructive">{errors.marketType}</p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone">رقم الهاتف (الواتساب والتواصل) *</Label>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-medium">🇮🇶 +964</span>
          <Input
            id="phone"
            type="tel"
            placeholder="7XXXXXXXXX"
            value={formData.phone}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              // Remove leading 0 if user types it
              if (value.startsWith('0')) {
                value = value.substring(1);
              }
              setFormData({ ...formData, phone: value })
            }}
            className={`pl-20 text-left ${errors.phone ? "border-destructive" : ""}`}
            disabled={loading}
            dir="ltr"
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
        <p className="text-xs text-muted-foreground">
          سيتم حفظه كـ: +964{formData.phone || 'XXXXXXXXX'}
        </p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني *</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@store.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? "border-destructive" : ""}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور الأولية *</Label>
        <Input
          id="password"
          type="password"
          placeholder="أدخل كلمة مرور قوية"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className={errors.password ? "border-destructive" : ""}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">
          سيُطلب من المالك تغيير كلمة المرور عند فتح حسابه أول مرة
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="أعد إدخال كلمة المرور"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className={errors.confirmPassword ? "border-destructive" : ""}
          disabled={loading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Buttons */}
      {mode === "public" && (() => {
        const selectedPkg = packages.find(p => p.slug === formData.packageSlug);
        const isPaid = (selectedPkg?.price ?? 0) > 0;

        if (isPaid) {
          return (
            <div className="space-y-3">
              {/* Two-button layout for paid packages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button 1: Contact admin (no payment) */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    setSubmitMode('contact');
                    handleSubmit(e as any, 'contact');
                  }}
                  className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-5 text-center transition-all duration-200 hover:border-slate-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {loading && submitMode === 'contact' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  ) : (
                    <Phone className="h-5 w-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-800">إنشاء وتواصل مع الإدارة</p>
                    <p className="text-xs text-slate-400 mt-0.5">ينشئ المتجر ويتواصل فريقنا معك للتفعيل</p>
                  </div>
                </button>

                {/* Button 2: ZainCash payment (immediate activation) */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    setSubmitMode('zaincash');
                    handleSubmit(e as any, 'zaincash');
                  }}
                  className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary px-4 py-5 text-center shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {loading && submitMode === 'zaincash' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-white" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-white">إنشاء ودفع زين كاش</p>
                    <p className="text-xs text-white/70 mt-0.5">تفعيل فوري بعد إتمام الدفع</p>
                  </div>
                  <span className="absolute -top-2.5 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    تفعيل فوري
                  </span>
                </button>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-800">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                <p>
                  <span className="font-semibold">زين كاش:</span> ستنتقل لبوابة الدفع الآمنة وعند الدفع يتفعّل متجرك فوراً. &nbsp;
                  <span className="font-semibold">تواصل مع الإدارة:</span> ينشأ المتجر معلقاً وسيتواصل معك فريقنا لتسوية الدفع يدوياً.
                </p>
              </div>
            </div>
          );
        }

        // Free package: single button
        return (
          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? (
              <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري إنشاء المتجر...</>
            ) : (
              "إنشاء المتجر والحساب"
            )}
          </Button>
        );
      })()}

      {mode === "admin" && (
        <Button type="submit" className="w-full" disabled={loading} size="lg">
          {loading ? (
            <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري إنشاء المتجر...</>
          ) : (
            "إنشاء المتجر والحساب"
          )}
        </Button>
      )}
    </form>
  );
}
