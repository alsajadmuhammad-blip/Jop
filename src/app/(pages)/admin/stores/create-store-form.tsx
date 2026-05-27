"use client";

import { useState, useCallback } from "react";
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
import { Plus, Loader2 } from "lucide-react";

type FormData = {
  ownerName: string;
  storeName: string;
  storeType: "فعلي" | "إلكتروني" | "";
  marketType: string;
  phone: string;
  governorate: string;
  city: string;
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

export default function CreateStoreForm() {
  const [formData, setFormData] = useState<FormData>({
    ownerName: "",
    storeName: "",
    storeType: "",
    marketType: "",
    phone: "",
    governorate: "",
    city: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [marketTypes, setMarketTypes] = useState<string[]>(DEFAULT_MARKET_TYPES);
  const [newMarketType, setNewMarketType] = useState("");
  const [showAddMarketType, setShowAddMarketType] = useState(false);
  const { toast } = useToast();

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
    }

    if (!formData.marketType.trim()) {
      newErrors.marketType = "نوع السوق/المتجر مطلوب";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ownerName: formData.ownerName,
        storeName: formData.storeName,
        storeType: formData.storeType,
        marketType: formData.marketType,
        phone: formData.phone.replace(/\s/g, ""),
        ...(formData.storeType === "فعلي" && {
          governorate: formData.governorate,
          city: formData.city,
        }),
        email: formData.email,
        password: formData.password,
      };

      // جلب الـ Anon Key الخاص بمشروعك من بيئة عمل Next.js تلقائياً
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

      const response = await fetch(
        "https://tjfogjumpyygftwwbmxb.supabase.co/functions/v1/create-store",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // الهيدرز الأساسية لتخطي جدار حماية Supabase (خطأ 401)
            "Authorization": `Bearer ${supabaseAnonKey}`,
            "apikey": supabaseAnonKey,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "فشل إنشاء المتجر");
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء المتجر وحساب المالك بنجاح",
        variant: "default",
      });

      // إرجاع الفورم لحالته الأصلية بعد النجاح
      setFormData({
        ownerName: "",
        storeName: "",
        storeType: "",
        marketType: "",
        phone: "",
        governorate: "",
        city: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error("Error creating store:", err);
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء إنشاء المتجر",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
        <Input
          id="phone"
          type="tel"
          placeholder="966501234567 أو 0501234567"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className={errors.phone ? "border-destructive" : ""}
          disabled={loading}
          dir="ltr"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
        <p className="text-xs text-muted-foreground">
          هذا الرقم سيكون للتواصل والواتساب
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

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            جاري الإنشاء...
          </>
        ) : (
          "إنشاء المتجر والحساب"
        )}
      </Button>
    </form>
  );
}
