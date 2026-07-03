'use client';

import { useState, useEffect, useCallback } from 'react';

// مفتاح VAPID العام — يُضاف في .env.local
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface PushState {
  permission: PermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  subscription: PushSubscription | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    subscription: null,
  });

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  // تحقق من الحالة الحالية عند التحميل
  useEffect(() => {
    if (!isSupported) {
      setState((s) => ({ ...s, permission: 'unsupported' }));
      return;
    }

    setState((s) => ({
      ...s,
      permission: Notification.permission as PermissionState,
    }));

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState((s) => ({
        ...s,
        isSubscribed: !!sub,
        subscription: sub,
        permission: Notification.permission as PermissionState,
      }));
    });
  }, [isSupported]);

  // اشتراك في الإشعارات
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) return null;

    setState((s) => ({ ...s, isLoading: true }));

    try {
      // طلب الإذن
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission: permission as PermissionState }));

      if (permission !== 'granted') {
        setState((s) => ({ ...s, isLoading: false }));
        return null;
      }

      // تحقق من وجود مفتاح VAPID قبل أي عملية
      if (!VAPID_PUBLIC_KEY) {
        console.warn('مركزي: مفتاح VAPID غير مضبوط. أضف NEXT_PUBLIC_VAPID_PUBLIC_KEY في .env.local');
        setState((s) => ({ ...s, isLoading: false }));
        return null;
      }

      const reg = await navigator.serviceWorker.ready;

      // إلغاء الاشتراك القديم إن وُجد
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) await existingSub.unsubscribe();

      // الاشتراك الجديد
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      // حفظ الاشتراك — إذا فشل نلغي الاشتراك ونُبلّغ بالخطأ
      const saved = await saveSubscription(sub);
      if (!saved) {
        await sub.unsubscribe();
        setState((s) => ({ ...s, isLoading: false }));
        return null;
      }

      setState((s) => ({ ...s, isSubscribed: true, subscription: sub, isLoading: false }));
      return sub;
    } catch (err) {
      console.error('خطأ في الاشتراك بالإشعارات:', err);
      setState((s) => ({ ...s, isLoading: false }));
      return null;
    }
  }, [isSupported]);

  // إلغاء الاشتراك
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setState((s) => ({ ...s, isLoading: true }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removeSubscription(sub);
        await sub.unsubscribe();
      }
      setState((s) => ({ ...s, isSubscribed: false, subscription: null, isLoading: false }));
      return true;
    } catch (err) {
      console.error('خطأ في إلغاء الاشتراك:', err);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, [isSupported]);

  // تسجيل Periodic Sync إن كان متاحاً
  const registerPeriodicSync = useCallback(async () => {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('periodicSync' in reg) {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
        if (status.state === 'granted') {
          await (reg as any).periodicSync.register('check-notifications', { minInterval: 24 * 60 * 60 * 1000 });
          await (reg as any).periodicSync.register('refresh-stores', { minInterval: 60 * 60 * 1000 });
        }
      }
    } catch { /* المتصفح لا يدعمه */ }
  }, [isSupported]);

  return {
    ...state,
    isSupported,
    subscribe,
    unsubscribe,
    registerPeriodicSync,
  };
}

// ===== جلب بيانات الجلسة الحالية =====
async function getSessionInfo(): Promise<{ userId: string | null; accessToken: string | null }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(supabaseUrl, supabaseKey);
    const { data } = await client.auth.getSession();
    return {
      userId: data?.session?.user?.id ?? null,
      accessToken: data?.session?.access_token ?? null,
    };
  } catch {
    return { userId: null, accessToken: null };
  }
}

// ===== حفظ الاشتراك في Supabase =====
async function saveSubscription(sub: PushSubscription): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return true;

    // نجيب user_id والـ access_token من session الحالية
    const { userId, accessToken } = await getSessionInfo();

    // إذا المستخدم مسجّل دخول → نستخدم access_token الخاص به (RLS يتحقق منه)
    // إذا زائر → نستخدم anon_key (بدون user_id)
    const authHeader = accessToken
      ? `Bearer ${accessToken}`
      : `Bearer ${supabaseKey}`;

    const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: authHeader,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        subscription_json: JSON.stringify(sub.toJSON()),
        user_agent: navigator.userAgent,
        // user_id فقط إذا كان مسجّلاً — يُوثَّق عبر access_token في Supabase RLS
        ...(userId ? { user_id: userId } : {}),
      }),
    });
    if (!res.ok) {
      console.error('فشل حفظ اشتراك الإشعارات:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('خطأ في حفظ اشتراك الإشعارات:', err);
    return false;
  }
}

async function removeSubscription(sub: PushSubscription): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return true;

    // نستخدم access_token عند الحذف أيضاً
    const { accessToken } = await getSessionInfo();
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${supabaseKey}`;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
          Authorization: authHeader,
        },
      }
    );
    if (!res.ok) {
      console.error('فشل حذف اشتراك الإشعارات:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('خطأ في حذف اشتراك الإشعارات:', err);
    return false;
  }
}
