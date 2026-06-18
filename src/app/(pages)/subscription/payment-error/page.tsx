"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RotateCcw, Home, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const errorCode = searchParams.get("code") || "UNKNOWN";
  const errorMessage = searchParams.get("message") || "حدث خطأ أثناء معالجة الدفع";

  useEffect(() => {
    toast({
      title: "فشل الدفع",
      description: errorMessage,
      variant: "destructive",
    });
  }, [errorMessage, toast]);

  const getErrorDetails = (code: string) => {
    const errors: Record<string, { title: string; description: string; advice: string[] }> = {
      CANCELLED: {
        title: "تم إلغاء العملية",
        description: "قمت بإلغاء عملية الدفع",
        advice: [
          "يمكنك إعادة محاولة الدفع متى شئت",
          "تأكد من أن لديك رصيد كافي",
          "استخدم رقم هاتف صحيح",
        ],
      },
      INSUFFICIENT_BALANCE: {
        title: "رصيد غير كافي",
        description: "الرصيد في محفظتك غير كافي لإكمال المعاملة",
        advice: [
          "تأكد من وجود رصيد كافي في محفظتك",
          "قم بتعبئة رصيد المحفظة أولاً",
          "ثم حاول مرة أخرى",
        ],
      },
      INVALID_PHONE: {
        title: "رقم الهاتف غير صحيح",
        description: "رقم الهاتف المدخل غير صحيح أو غير مدعوم",
        advice: [
          "تأكد من صحة رقم الهاتف",
          "يجب أن يكون بصيغة دولية (964...)",
          "استخدم رقم تابع لشركة Zain",
        ],
      },
      NETWORK_ERROR: {
        title: "خطأ في الاتصال",
        description: "فشل الاتصال مع خادم الدفع",
        advice: [
          "تحقق من اتصالك بالإنترنت",
          "حاول مرة أخرى في دقائق معدودة",
          "جرب من جهاز أو شبكة مختلفة",
        ],
      },
      TIMEOUT: {
        title: "انتهاء المهلة الزمنية",
        description: "استغرقت العملية وقتاً طويلاً جداً",
        advice: [
          "تحقق من أن اتصالك بالإنترنت مستقر",
          "حاول مرة أخرى برفق",
          "قد تحتاج العملية بضع دقائق",
        ],
      },
      UNKNOWN: {
        title: "خطأ غير معروف",
        description: errorMessage,
        advice: [
          "جرب مرة أخرى في دقائق معدودة",
          "إذا استمرت المشكلة، اتصل بفريق الدعم",
          "احتفظ برقم المعاملة للمراجعة",
        ],
      },
    };

    return errors[code] || errors.UNKNOWN;
  };

  const errorDetails = getErrorDetails(errorCode);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="mt-4 text-2xl text-red-900">{errorDetails.title}</CardTitle>
          <CardDescription className="mt-2 text-red-700">
            {errorDetails.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Code Info */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-900">رمز الخطأ</p>
            <p className="mt-1 font-mono text-sm text-red-700">{errorCode}</p>
          </div>

          {/* Advice Section */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center text-sm font-semibold text-amber-900">
              <HelpCircle className="ml-2 h-4 w-4" />
              ماذا يمكنك أن تفعل؟
            </p>
            <ul className="mt-3 space-y-2">
              {errorDetails.advice.map((item, idx) => (
                <li key={idx} className="text-xs text-amber-800">
                  <span className="font-semibold">{idx + 1}.</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/create-store">
                <RotateCcw className="ml-2 h-4 w-4" />
                حاول مرة أخرى
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="ml-2 h-4 w-4" />
                الصفحة الرئيسية
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/contact">اتصل بفريق الدعم</Link>
            </Button>
          </div>

          {/* Support Info */}
          <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-600">
            <p className="font-semibold text-gray-900">الدعم الفني</p>
            <p className="mt-1">إذا استمرت المشكلة، يرجى التواصل معنا</p>
            <p className="mt-2 text-gray-500">البريد: support@example.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <Card className="w-full max-w-md border-red-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>جاري التحميل...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <PaymentErrorContent />
    </Suspense>
  );
}
