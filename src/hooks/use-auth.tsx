"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import { useToast } from './use-toast';

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

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectRef = useRef(false);
  const authInitializedRef = useRef(false);

  const handleRedirect = useCallback((role: string, appUser: User) => {
    const isAuthPage = pathname === '/login' || pathname === '/register';
    if (!isAuthPage || redirectRef.current) return;

    redirectRef.current = true;
    const redirectPath = role === 'admin' ? '/admin' : role === 'store' ? '/dashboard/store' : role === 'representative' ? '/dashboard/representative' : '/';
    const toastTitle = role === 'admin' ? 'مرحباً أيها المشرف' : 'مرحباً بك';
    const toastDescription = role === 'admin' ? 'تم تسجيل دخولك كمشرف.' : 'تم تسجيل الدخول بنجاح.';
    toast({ title: toastTitle, description: toastDescription });
    router.replace(redirectPath);
  }, [router, toast, pathname]);

  const getAuthIdentifiers = (sessionUser: any) => {
    if (!sessionUser) return { id: null, email: null };
    const id = sessionUser.id || sessionUser.user?.id || sessionUser.sub || sessionUser.user?.sub || null;
    const email = sessionUser.email || sessionUser.user?.email || null;
    return { id, email };
  };

  const fetchAndSetUser = useCallback(async (sessionUser: any | null, isLoginEvent = false) => {
    if (!sessionUser) {
      setUser(null);
      setUserRole(null);
      setLoading(false);
      return false;
    }

    const findStoreForAuthUser = async () => {
      const { id: userId, email } = getAuthIdentifiers(sessionUser);
      if (!userId && !email) return null;

      const conditions = [
        userId ? `owner_id.eq.${userId}` : null,
        userId ? `"ownerId".eq.${userId}` : null,
        email ? `owner_email.eq.${email}` : null,
        email ? `"ownerEmail".eq.${email}` : null,
      ]
        .filter(Boolean)
        .join(',');

      if (!conditions) return null;

      const { data: storeRows, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .or(conditions)
        .limit(1);

      if (storeError) {
        console.warn('Store lookup failed for auth user:', storeError.message);
        return null;
      }

      return storeRows && storeRows.length > 0 ? storeRows[0] : null;
    };

    setLoading(true);
    try {
      const { id: userId, email } = getAuthIdentifiers(sessionUser);
      if (!userId && !email) {
        throw new Error('No authenticated user identifier available.');
      }

      let row: any | null = null;

      if (userId) {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).limit(1);
        if (error) throw new Error(`Database query failed: ${error.message}`);
        if (data && data.length > 0) row = data[0];
      }

      if (!row && email) {
        const { data: emailRows, error: emailError } = await supabase.from('users').select('*').eq('email', email).limit(1);
        if (emailError) throw new Error(`Database query failed: ${emailError.message}`);
        if (emailRows && emailRows.length > 0) {
          row = emailRows[0];
          console.warn('Found legacy user record by email fallback for auth user', email);
        }
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
        } catch (insertError) {
          console.warn('Failed to create user record in users table:', insertError);
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

        if (shouldFixStoreRole) {
          updatePayload.role = 'store';
        }

        if (Object.keys(updatePayload).length > 0) {
          try {
            await supabase.from('users').update({
              ...updatePayload,
              storeId: updatePayload.store_id ?? updatePayload.storeId,
            }).eq('id', row.id);
            row = { ...row, ...updatePayload };
            console.warn('Persisted recovered store linkage or corrected role for user', row.id, updatePayload);
          } catch (updateError) {
            console.warn('Failed to persist recovered store linkage or corrected role for user:', updateError);
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
      };

      setUser(prevUser => {
        if (prevUser?.id === appUser.id &&
            prevUser?.name === appUser.name &&
            prevUser?.email === appUser.email &&
            prevUser?.role === appUser.role &&
            prevUser?.storeId === appUser.storeId &&
            prevUser?.firstLogin === appUser.firstLogin) {
          return prevUser;
        }
        return appUser;
      });

      setUserRole(prevRole => prevRole === appUser.role ? prevRole : appUser.role);

      if (isLoginEvent || pathname === '/login' || pathname === '/register') {
        handleRedirect(appUser.role, appUser);
      }
      return true;
    } catch (error: any) {
      console.error('Error fetching auth user:', error);
      setUser(null);
      setUserRole(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleRedirect]);

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        console.error('Supabase is not configured. Check environment variables.');
        setUser(null);
        setUserRole(null);
        setLoading(false);
        authInitializedRef.current = true;
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase getSession error:', error.message || error);
      }

      if (data?.session) {
        await fetchAndSetUser(data.session.user);
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
      authInitializedRef.current = true;
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (!authInitializedRef.current && event === 'SIGNED_IN') {
        return;
      }

      const isLoginEvent = event === 'SIGNED_IN';
      if (session?.user) {
        fetchAndSetUser(session.user, isLoginEvent);
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
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
        const errorMessage = String(error.message || 'فشل تسجيل الدخول');
        if (errorMessage.includes('Invalid API key')) {
          setLoading(false);
          return {
            success: false,
            message: 'مفتاح Supabase العام غير صالح. تحقق من NEXT_PUBLIC_SUPABASE_ANON_KEY في .env.local.',
          };
        }

        setLoading(false);
        return { success: false, message: errorMessage };
      }

      let authUser = data?.user || data?.session?.user;
      if (!authUser) {
        const sessionResult = await supabase.auth.getSession();
        if (sessionResult.error) {
          setLoading(false);
          return { success: false, message: sessionResult.error.message || 'فشل تسجيل الدخول. لم يتم العثور على الجلسة.' };
        }
        authUser = sessionResult.data?.session?.user;
      }

      if (!authUser) {
        setLoading(false);
        return { success: false, message: 'فشل الحصول على بيانات المستخدم.' };
      }

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
      if (error) {
        return { success: false, message: error.message || 'فشل تسجيل الدخول باستخدام Google.' };
      }

      const authUser = data?.user || data?.session?.user;
      if (authUser) {
        const userFetched = await fetchAndSetUser(authUser, true);
        if (!userFetched) {
          return { success: false, message: 'فشل تحميل بيانات المستخدم بعد تسجيل الدخول باستخدام Google.' };
        }
      }

      return { success: true, message: 'تم تسجيل الدخول باستخدام Google' };
    } catch (err) {
      return { success: false, message: `خطأ: ${err instanceof Error ? err.message : 'فشل'}` };
    }
  };

  const registerUser = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error) throw new Error(error.message);
    if (data.user) await fetchAndSetUser(data.user);
  };

  const contextValue: AuthContextType = {
    user,
    userRole,
    loading,
    login,
    logout,
    registerUser,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
