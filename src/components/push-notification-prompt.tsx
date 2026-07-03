'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function PushNotificationPrompt() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe, registerPeriodicSync } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // أظهر البانر بعد 5 ثوان إذا لم يُمنح الإذن بعد ولم يُرفض
  useEffect(() => {
    if (!isSupported) return;
    if (permission === 'granted' || permission === 'denied') return;

    const key = 'push-prompt-dismissed';
    const savedTs = localStorage.getItem(key);
    // لا تُعد العرض لـ 3 أيام بعد الإغلاق
    if (savedTs && Date.now() - Number(savedTs) < 3 * 86400000) return;

    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  // سجّل Periodic Sync بمجرد منح الإذن
  useEffect(() => {
    if (permission === 'granted' && isSubscribed) {
      registerPeriodicSync();
    }
  }, [permission, isSubscribed, registerPeriodicSync]);

  const handleAllow = async () => {
    await subscribe();
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', String(Date.now()));
    setDismissed(true);
    setVisible(false);
  };

  if (!isSupported || dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-24 right-3 left-3 md:left-auto md:right-6 md:w-96 z-[60]
                 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                 rounded-2xl shadow-2xl overflow-hidden
                 animate-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label="تفعيل الإشعارات"
    >
      {/* شريط علوي */}
      <div className="bg-gradient-to-l from-blue-700 to-blue-500 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-white" />
          <span className="text-white text-xs font-semibold">إشعارات مركزي</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* المحتوى */}
      <div className="p-4">
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          ابقَ على اطلاع دائم
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          فعّل الإشعارات لتصلك تنبيهات الطلبات الجديدة، حالة التوصيل، والعروض الحصرية فور صدورها.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleAllow}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                       text-white text-sm font-semibold py-2.5 rounded-xl
                       flex items-center justify-center gap-2 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {isLoading ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                       text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50
                       dark:hover:bg-slate-800 transition-colors"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== زر إدارة الإشعارات في الإعدادات =====
export function NotificationToggleButton() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || permission === 'denied'}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
        ${isSubscribed
          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed`}
      title={permission === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : ''}
    >
      {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      {isLoading
        ? 'جاري...'
        : permission === 'denied'
        ? 'الإشعارات محظورة'
        : isSubscribed
        ? 'الإشعارات مفعّلة'
        : 'تفعيل الإشعارات'}
    </button>
  );
}
