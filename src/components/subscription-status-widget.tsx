import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';

interface SubscriptionStatusWidgetProps {
  storeId?: string;
}

export function SubscriptionStatusWidget({ storeId }: SubscriptionStatusWidgetProps) {
  const { subscription, daysLeft, isLoading, error, isExpired, isExpiringSoon } =
    useSubscriptionStatus(storeId);

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">حالة الاشتراك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-blue-200" />
            <div className="h-3 w-32 rounded bg-blue-100" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-900">
            <AlertCircle className="h-5 w-5" />
            لا يوجد اشتراك نشط
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-800">
            لا يوجد اشتراك نشط لمتجرك. يرجى تفعيل الاشتراك لمتابعة العمل.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/subscription">تفعيل الاشتراك</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card className="border-red-300 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-900">
            <AlertTriangle className="h-5 w-5" />
            انتهى الاشتراك
          </CardTitle>
          <CardDescription className="text-red-700">
            تم انتهاء صلاحية اشتراكك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-600">
              انتهى اشتراكك في:{' '}
              <span className="font-semibold">
                {new Date(subscription.expiresAt || '').toLocaleDateString('ar-IQ')}
              </span>
            </p>
          </div>
          <Button asChild className="w-full bg-red-600 hover:bg-red-700">
            <Link href="/dashboard/subscription/renew">تجديد الاشتراك الآن</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${isExpiringSoon ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-green-900">
          <CheckCircle2 className="h-5 w-5" />
          الاشتراك نشط
        </CardTitle>
        <CardDescription className={isExpiringSoon ? 'text-amber-700' : 'text-green-700'}>
          {isExpiringSoon ? 'الاشتراك سينتهي قريباً' : 'اشتراكك سارٍ ونشط'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg bg-white p-3">
          <p className="text-xs text-gray-600">
            انتهاء الاشتراك:{' '}
            <span className="font-semibold">
              {new Date(subscription.expiresAt || '').toLocaleDateString('ar-IQ')}
            </span>
          </p>
          {daysLeft !== null && (
            <p className={`flex items-center gap-1 text-sm font-semibold ${isExpiringSoon ? 'text-amber-900' : 'text-green-900'}`}>
              <Clock className="h-4 w-4" />
              {daysLeft === 0 ? 'ينتهي اليوم' : daysLeft === 1 ? 'ينتهي غداً' : `${daysLeft} أيام متبقية`}
            </p>
          )}
        </div>

        {isExpiringSoon && (
          <Button asChild className="w-full">
            <Link href="/dashboard/subscription/renew">تجديد الاشتراك</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
