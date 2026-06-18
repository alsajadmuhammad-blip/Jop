"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Home } from "lucide-react";
import { verifySubscriptionPayment } from "@/services/subscription-service";
import { useToast } from "@/hooks/use-toast";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    async function verifyPayment() {
      try {
        const transactionId = searchParams.get("transactionId");
        const zaincashId = searchParams.get("zaincashId");

        if (!transactionId && !zaincashId) {
          throw new Error("معرف المعاملة غير موجود");
        }

        const result = await verifySubscriptionPayment(
          transactionId || "",
          zaincashId || undefined
        );

        if (result.success && result.status === "completed") {
          setVerified(true);
          setTransactionDetails({
            transactionId: result.transactionId,
            paidAt: result.paidAt,
          });

          toast({
            title: "تم الدفع بنجاح!",
            description: "تم تفعيل اشتراكك بنجاح",
            variant: "default",
          });
        } else {
          setError("لم يتمكن من التحقق من الدفع. يرجى الاتصال بالدعم.");
          toast({
            title: "خطأ في التحقق",
            description: "لم يتمكن من التحقق من حالة الدفع",
            variant: "destructive",
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء التحقق";
        setError(errorMessage);
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    }

    verifyPayment();
  }, [searchParams, toast]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>جاري التحقق من الدفع</CardTitle>
            <CardDescription>يرجى الانتظار قليلاً...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="w-full max-w-md border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="mt-4 text-2xl text-green-900">تم الدفع بنجاح! ✓</CardTitle>
            <CardDescription className="mt-2 text-green-700">
              تم تفعيل اشتراكك بنجاح. يمكنك الآن البدء في استخدام متجرك.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              <p className="font-semibold">معلومات المعاملة</p>
              <p className="mt-2 text-xs text-green-700">
                <span className="font-medium">رقم المعاملة:</span>{" "}
                {transactionDetails?.transactionId?.substring(0, 12)}...
              </p>
              {transactionDetails?.paidAt && (
                <p className="mt-1 text-xs text-green-700">
                  <span className="font-medium">وقت الدفع:</span>{" "}
                  {new Date(transactionDetails.paidAt).toLocaleString('ar-IQ')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard">الذهاب إلى لوحة التحكم</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">الرجوع للصفحة الرئيسية</Link>
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>سيتم إرسال رسالة تأكيد على بريدك الإلكتروني في غضون دقائق</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-900">خطأ في التحقق</CardTitle>
          <CardDescription className="mt-2 text-red-700">{error}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">ماذا يمكنك أن تفعل؟</p>
            <ul className="mt-2 space-y-1 text-xs text-red-700">
              <li>• جرب تحديث الصفحة</li>
              <li>• تحقق من اتصالك بالإنترنت</li>
              <li>• اتصل بفريق الدعم إذا استمرت المشكلة</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              size="lg"
              variant="outline"
            >
              تحديث الصفحة
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/create-store">العودة لإنشاء المتجر</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                <Home className="ml-2 h-4 w-4" />
                الصفحة الرئيسية
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md border-blue-200 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>جاري تحميل الصفحة</CardTitle>
          <CardDescription>يرجى الانتظار...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
