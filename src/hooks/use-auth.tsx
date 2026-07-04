"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { useToast } from './use-toast';

// ─── كاش الجلسة ───────────────────────────────────────────────────
const USER_CACHE_KEY = 'markazi_auth_user_v2';
const USER_CACHE_TTL = 60 * 60 * 1000; // ساعة كاملة

function readUserCache(): { user: User; userRole: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const { user, userRole, ts } = JSON.parse(raw);
    if (!user || !userRole || !ts) return null;
    if (Date.now() - ts > USER_CACHE_TTL) {
      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    }
    return { user, userRole };
  } catch {
    return null;
  }
}

function writeUserCache(user: User, userRole: string) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ user, userRole, ts: Date.now() }));
  } catch {}
}

function clearUserCache() {
  try { localStorage.removeItem(USER_CACHE_KEY); } catch {}
}
// ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // ── استعادة فورية من الكاش — بدون spinner ──────────────────────
  const [user, setUser] = useState<User | null>(() => readUserCache()?.user ?? null);
  const [userRole, setUserRole] = useState<string | null>(() => readUserCache()?.userRole ?? null);
  // loading = false إذا عندنا كاش، true فقط إذا ما عندنا شي
  const [loading, setLoading] = useState<boolean>(() => readUserCache() === null);
  // ──────────────────────────────────────────────────────────────

  const redirectRef = useRef(false);
  const authInitializedRef = useRef(false);
  // نمنع إعادة fetch إذا الـ user_id نفسه
  const lastFetchedUserId = useRef<string | null>(readUserCache()?.user?.id ?? null);

  const handleRedirect = useCallback((role: string, appUser: User) => {
    const isAuthPage = pathname === '/login' || pathname === '/register';
    if (!isAuthPage || redirectRef.current) return;
    redirectRef.current = true;
    const redirectPath =
      role === 'admin' ? '/admin' :
      role === 'store' ? '/dashboard/store' :
      role === 'representative' ? '/dashboard/representative' : '/';
    toast({ title: 'مرحباً بك', description: 'تم تسجيل الدخول بنجاح.' });
    router.replace(redirectPath);
  }, [router, toast, pathname]);

  const getAuthIdentifiers = (sessionUser: any) => {
    if (!sessionUser) return { id: null, email: null };
    const id = sessionUser.id || sessionUser.user?.id || sessionUser.sub || sessionUser.user?.sub || null;
    const email = sessionUser.email || sessionUser.user?.email || null;
    return { id, email };
  };

  // ── fetch من DB — يُستدعى مرة واحدة فقط لكل user_id ──────────
  const fetchAndSetUser = useCallback(async (sessionUser: any | null, isLoginEvent = false) => {
    if (!sessionUser) {
      setUser(null);
      setUserRole(null);
      setLoading(false);
      clearUserCache();
      lastFetchedUserId.current = null;
      return false;
    }

    const { id: userId, email } = getAuthIdentifiers(sessionUser);

    // إذا fetch سبق لنفس الـ user_id، لا نكرر الطلبات — نكتفي بالكاش
    if (userId && userId === lastFetchedUserId.current && !isLoginEvent) {
      setLoading(false);
      return true;
    }

    // عند أول fetch أو login، نشغّل loading فقط إذا ما عندنا بيانات حالية
    if (!user) setLoading(true);

    const findStoreForAuthUser = async () => {
      if (!userId && !email) return null;
      const conditions = [
        userId ? `owner_id.eq.${userId}` : null,
        userId ? `"ownerId".eq.${userId}` : null,
        email ? `owner_email.eq.${email}` : null,
        email ? `"ownerEmail".eq.${email}` : null,
      ].filter(Boolean).join(',');
      if (!conditions) return null;
      const { data: storeRows, error: storeError } = await supabase
        .from('stores').select('id').or(conditions).limit(1);
      if (storeError) return null;
      return storeRows && storeRows.length > 0 ? storeRows[0] : null;
    };

    try {
      if (!userId && !email) throw new Error('No authenticated user identifier available.');

      let row: any | null = null;
      if (userId) {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).limit(1);
        if (error) throw new Error(`Database query failed: ${error.message}`);
        if (data && data.length > 0) row = data[0];
      }
      if (!row && email) {
        const { data: emailRows, error: emailError } = await supabase.from('users').select('*').eq('email', email).limit(1);
        if (emailError) throw new Error(`Database query failed: ${emailError.message}`);
        if (emailRows && emailRows.length > 0) row = emailRows[0];
      }

      const storeMatch = await findStoreForAuthUser();

      if (!row) {
        const isImplicitAdmin = email === 'admin@markazi.com';
        const newUser = {
          id: userId,
          name: sessionUser.user?.user_metadata?.full_name || sessionUser.user?.user_metadata?.name || 'مستخدم جديد',
          email,
          role: storeMatch ? 'store' : isImplicitAdmin ? 'admin' : 'customer',
          store_id: storeMatch ? storeMatch.id : null,
          storeId: storeMatch ? storeMatch.id : null,
          first_login: true,
          firstLogin: true,
        };
        try {
          const { error: insertErr } = await supabase.from('users').insert([newUser]);
          if (insertErr) throw insertErr;
          row = newUser as any;
        } catch {
          row = newUser as any;
        }
      } else {
        const shouldRecoverStore = storeMatch && row.store_id !== storeMatch.id;
        const shouldFixStoreRole = row.store_id && row.role !== 'store';
        const shouldSetStoreRoleForMatchedStore = !row.store_id && storeMatch;
        const updatePayload: any = {};
        if (shouldRecoverStore || shouldSetStoreRoleForMatchedStore) {
          updatePayload.store_id = storeMatch?.id;
          updatePayload.role = 'store';
        }
        if (shouldFixStoreRole) updatePayload.role = 'store';
        if (Object.keys(updatePayload).length > 0) {
          try {
            await supabase.from('users').update({
              ...updatePayload,
              storeId: updatePayload.store_id ?? updatePayload.storeId,
            }).eq('id', row.id);
            row = { ...row, ...updatePayload };
          } catch {
            row = { ...row, ...updatePayload };
          }
        }
      }

      const storeId = row.store_id || row.storeId || null;
      const role = row.role || (storeMatch ? 'store' : 'customer');
      const appUser: User = {
        id: String(row.id),
        name: row.name || sessionUser.user?.user_metadata?.full_name || 'مستخدم جديد',
        email: row.email || email,
        role,
        storeId,
        firstLogin: row.firstLogin || row.first_login || false,
        // حقول الشريك — تُقرأ فقط عند role === 'representative'
        paymentSystem: row.payment_system || row.paymentSystem || undefined,
        monthlySalary: row.monthly_salary ?? row.monthlySalary ?? undefined,
        requiredStoresCount: row.required_stores_count ?? row.requiredStoresCount ?? undefined,
        commissionPercent: row.commission_percent ?? row.commissionPercent ?? undefined,
        packageDiscountPercent: row.package_discount_percent ?? row.packageDiscountPercent ?? undefined,
        partnerCode: row.partner_code || row.partnerCode || undefined,
        monthlyActivations: row.monthly_activations ?? row.monthlyActivations ?? undefined,
        totalEarnings: row.total_earnings ?? row.totalEarnings ?? undefined,
      };

      setUser(prev => {
        if (
          prev?.id === appUser.id &&
          prev?.name === appUser.name &&
          prev?.email === appUser.email &&
          prev?.role === appUser.role &&
          prev?.storeId === appUser.storeId
        ) return prev;
        return appUser;
      });
      setUserRole(prev => prev === appUser.role ? prev : appUser.role);

      // ── حفظ في الكاش فوراً ──────────────────────────────────────
      writeUserCache(appUser, appUser.role);
      lastFetchedUserId.current = appUser.id;
      // ────────────────────────────────────────────────────────────

      if (isLoginEvent || pathname === '/login' || pathname === '/register') {
        handleRedirect(appUser.role, appUser);
      }
      return true;
    } catch (error: any) {
      console.error('Error fetching auth user:', error);
      // لا نمسح الكاش عند خطأ الشبكة — نحافظ على الجلسة
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleRedirect, user]);

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        clearUserCache();
        authInitializedRef.current = true;
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('Supabase getSession error:', error.message || error);

      if (data?.session) {
        // إذا عندنا كاش بنفس الـ user_id — نكتفي بتأكيد الجلسة بدون DB queries
        const cached = readUserCache();
        const sessionUserId = data.session.user?.id;
        if (cached && cached.user.id === sessionUserId) {
          // الجلسة سليمة والكاش موجود — لا spinner
          setLoading(false);
        } else {
          // أول مرة أو user مختلف — fetch من DB
          await fetchAndSetUser(data.session.user);
        }
      } else {
        // لا جلسة — امسح الكاش
        setUser(null);
        setUserRole(null);
        setLoading(false);
        clearUserCache();
        lastFetchedUserId.current = null;
      }
      authInitializedRef.current = true;
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      // تجاهل TOKEN_REFRESHED و USER_UPDATED — لا تعيد fetch من DB
      // هذه الأحداث تسبب الـ spinner المزعج بدون داعٍ
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        return;
      }

      if (!authInitializedRef.current && event === 'SIGNED_IN') return;

      if (session?.user) {
        fetchAndSetUser(session.user, event === 'SIGNED_IN');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        clearUserCache();
        lastFetchedUserId.current = null;
      }
    });

    initAuth();
    return () => listener?.subscription.unsubscribe();
  }, [fetchAndSetUser]);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'خطأ في إعداد النظام. الرجاء مراجعة إعدادات Supabase.' };
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { success: false, message: String(error.message || 'فشل تسجيل الدخول') };
      }
      let authUser = data?.user || data?.session?.user;
      if (!authUser) {
        const sessionResult = await supabase.auth.getSession();
        if (sessionResult.error) {
          setLoading(false);
          return { success: false, message: sessionResult.error.message || 'لم يتم العثور على الجلسة.' };
        }
        authUser = sessionResult.data?.session?.user;
      }
      if (!authUser) {
        setLoading(false);
        return { success: false, message: 'فشل الحصول على بيانات المستخدم.' };
      }
      // إجبار fetch جديد عند الـ login
      lastFetchedUserId.current = null;
      const userFetched = await fetchAndSetUser(authUser, true);
      if (!userFetched) {
        setLoading(false);
        return { success: false, message: 'فشل تحميل بيانات المستخدم بعد تسجيل الدخول.' };
      }
      return { success: true, message: 'تم تسجيل الدخول بنجاح.' };
    } catch (err) {
      setLoading(false);
      return { success: false, message: `خطأ: ${err instanceof Error ? err.message : 'فشل تسجيل الدخول'}` };
    }
  };

  const logout = async () => {
    try {
      clearUserCache();
      lastFetchedUserId.current = null;
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'خطأ في إعداد النظام. الرجاء مراجعة إعدادات Supabase.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) return { success: false, message: error.message || 'فشل تسجيل الدخول باستخدام Google.' };
      const authUser = data?.user || data?.session?.user;
      if (authUser) {
        lastFetchedUserId.current = null;
        const userFetched = await fetchAndSetUser(authUser, true);
        if (!userFetched) return { success: false, message: 'فشل تحميل بيانات المستخدم بعد تسجيل الدخول باستخدام Google.' };
      }
      return { success: true, message: 'تم تسجيل الدخول باستخدام Google' };
    } catch (err) {
      return { success: false, message: `خطأ: ${err instanceof Error ? err.message : 'فشل'}` };
    }
  };

  const registerUser = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({ email: userData.email, password: userData.password });
    if (error) throw new Error(error.message);
    if (data.user) {
      lastFetchedUserId.current = null;
      await fetchAndSetUser(data.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout, registerUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
