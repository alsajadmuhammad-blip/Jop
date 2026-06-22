"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Package, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { renewSubscription, getStoreActiveSubscription } from "@/services/subscription-service";
import { fetchStorePackages } from "@/services/supabase-db";
import type { StorePackage } from "@/lib/types";

export default function RenewSubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user?.storeId) {
          throw new Error("لم يتم العثور على المتجر");
        }

        setStoreId(user.storeId);

        // Load current subscription
        const subscription = await getStoreActiveSubscription(user.storeId);
        setCurrentSubscription(subscription);

        // Load available packages — للتجديد: renewal أو both فقط
        const allPackages = await fetchStorePackages();
        const activePackages = allPackages.filter(
          (p) => p.isActive && (p.visibility === 'renewal' || p.visibility === 'both')
        );
        setPackages(activePackages);

        // Default to current package
        if (subscription?.packageId) {
          setSelectedPackageId(subscription.packageId);
        } else if (activePackages[0]) {
          setSelectedPackageId(activePackages[0].id);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "فشل تحميل البيانات";
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.storeId, toast]);

  const handleRenew = async () => {
    if (!storeId || !selectedPackageId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار باقة",
        variant: "destructive",
      });
      return;
    }

    setRenewing(true);
    try {
      const response = await renewSubscription(storeId, selectedPackageId);

      if (!response.success) {
        throw new Error(response.error || "فشل في البدء بعملية التجديد");
      }

      toast({
        title: "تم توجيهك لبوابة الدفع",
        description: "يرجى إكمال عملية الدفع",
      });

      // Redirect to payment
      if (response.paymentUrl) {
        setTimeout(() => {
          window.location.href = response.paymentUrl!;
        }, 2000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">جاري تحميل البيانات...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              خطأ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-800">لم يتم العثور على متجر مرتبط بحسابك.</p>
            <Button asChild className="w-full">
              <Link href="/dashboard">العودة للوحة التحكم</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">تجديد الاشتراك</h1>
          <p className="mt-2 text-gray-600">اختر الباقة المناسبة وأكمل عملية الدفع</p>
        </div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Check className="h-5 w-5" />
                الاشتراك الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">الباقة:</span> {currentSubscription.package?.name}
                </p>
                <p>
                  <span className="font-semibold">السعر:</span> {currentSubscription.package?.price} د.ع
                </p>
                <p>
                  <span className="font-semibold">ينتهي في:</span>{" "}
                  {new Date(currentSubscription.expiresAt).toLocaleDateString("ar-IQ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Package Selection */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">اختر الباقة الجديدة</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  selectedPackageId === pkg.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{pkg.description}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary">
                    {pkg.price === 0 ? "مجاني" : `${pkg.price} د.ع`}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-gray-700">
                  <li>
                    • <span className="font-medium">{pkg.productLimit}</span> منتج
                  </li>
                  <li>
                    • <span className="font-medium">{pkg.subscriptionDuration}</span> يوم اشتراك
                  </li>
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {selectedPackage && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                ملخص التجديد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">الباقة:</span>
                <span className="font-semibold">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">المبلغ:</span>
                <span className="font-semibold text-lg">
                  {selectedPackage.price === 0 ? "مجاني" : `${selectedPackage.price} د.ع`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">المدة:</span>
                <span className="font-semibold">{selectedPackage.subscriptionDuration} يوم</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleRenew}
            className="flex-1"
            size="lg"
            disabled={renewing || !selectedPackage}
          >
            {renewing ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              "تجديد الاشتراك والدفع"
            )}
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link href="/dashboard">العودة</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
