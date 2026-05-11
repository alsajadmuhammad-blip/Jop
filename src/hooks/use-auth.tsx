"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  const handleRedirect = useCallback((role: string, appUser: User) => {
    const isAuthPage = pathname === '/login' || pathname === '/register';
    if (isAuthPage) {
      const redirectPath = role === 'admin' ? '/admin' : role === 'store' ? '/dashboard/store' : role === 'representative' ? '/dashboard/representative' : '/';
      const toastTitle = role === 'admin' ? 'مرحباً أيها المشرف' : 'مرحباً بك';
      const toastDescription = role === 'admin' ? 'تم تسجيل دخولك كمشرف.' : 'تم تسجيل الدخول بنجاح.';
      toast({ title: toastTitle, description: toastDescription });
      router.push(redirectPath);
    }
  }, [router, toast, pathname]);

  const fetchAndSetUser = useCallback(async (sessionUser: any | null, isLoginEvent = false) => {
    if (!sessionUser) {
      setUser(null);
      setUserRole(null);
      setLoading(false);
      return false;
    }

    setLoading(true);
    try {
      const userId = sessionUser.id || sessionUser.user?.id || sessionUser.sub || sessionUser.user?.sub;
      const email = sessionUser.email || sessionUser.user?.email;
      if (!userId && !email) {
        throw new Error('No authenticated user identifier available.');
      }

      let row: any | null = null;
      let userRows: any[] | null = null;

      if (userId) {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).limit(1);
        if (error) throw new Error(`Database query failed: ${error.message}`);
        userRows = data || null;

        if (userRows && userRows.length > 0) {
          row = userRows[0];
        }
      }

      if (!row && email) {
        const { data: emailRows, error: emailError } = await supabase.from('users').select('*').eq('email', email).limit(1);
        if (emailError) throw new Error(`Database query failed: ${emailError.message}`);
        if (emailRows && emailRows.length > 0) {
          row = emailRows[0];
          console.warn('Found legacy user record by email fallback for auth user', email);
        }
      }

      if (!row && userId) {
        const storeQuery = await supabase
          .from('stores')
          .select('id')
          .or(`owner_id.eq.${userId},owner_email.eq.${email}`)
          .limit(1);
        if (!storeQuery.error && storeQuery.data && storeQuery.data.length > 0) {
          const fallbackStoreId = storeQuery.data[0].id;
          row = { id: userId, email, role: 'store', store_id: fallbackStoreId };
          console.warn('Fallback assigned storeId from store record for auth user', userId, fallbackStoreId);
        }
      }

      let appUser: User;
      if (!row) {
        // If there is no users row, check whether this auth user owns a store by email or owner_id
        let storeMatch: any[] | null = null;
        if (userId || email) {
          const conditions = [
            userId ? `owner_id.eq.${userId}` : null,
            email ? `owner_email.eq.${email}` : null,
          ].filter(Boolean).join(',');

          if (conditions.length > 0) {
            const { data: storeRows, error: storeError } = await supabase
              .from('stores')
              .select('id')
              .or(conditions)
              .limit(1);

            if (!storeError) {
              storeMatch = storeRows || null;
            }
          }
        }

        const isImplicitAdmin = email === 'admin@markazi.com';
        const newUser = {
          id: userId,
          name: sessionUser.user?.user_metadata?.full_name || sessionUser.user?.user_metadata?.name || 'مستخدم جديد',
          email,
          role: storeMatch && storeMatch.length > 0 ? 'store' : isImplicitAdmin ? 'admin' : 'customer',
          store_id: storeMatch && storeMatch.length > 0 ? storeMatch[0].id : null,
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
        // If user row exists but store linkage is missing, try to recover it from the stores table.
        if ((!row.store_id || !row.role || row.role === 'customer') && (userId || email)) {
          const conditions = [
            userId ? `owner_id.eq.${userId}` : null,
            email ? `owner_email.eq.${email}` : null,
          ].filter(Boolean).join(',');

          if (conditions.length > 0) {
            const { data: storeRows, error: storeError } = await supabase
              .from('stores')
              .select('id')
              .or(conditions)
              .limit(1);

            if (!storeError && storeRows && storeRows.length > 0) {
              const storeId = storeRows[0].id;
              try {
                const updatePayload: any = { store_id: storeId, role: 'store' };
                await supabase.from('users').update(updatePayload).eq('id', row.id);
                row = { ...row, ...updatePayload };
                console.warn('Recovered missing store linkage for user', row.id, storeId);
              } catch (updateError) {
                console.warn('Failed to persist recovered store linkage for user:', updateError);
              }
            }
          }
        }
      }

      appUser = {
        id: String(row.id),
        name: row.name || sessionUser.user?.user_metadata?.full_name || 'مستخدم جديد',
        email: row.email || email,
        role: row.role || 'customer',
        storeId: row.store_id || row.storeId || null,
        firstLogin: row.firstLogin || row.first_login || false,
      };

      setUser(appUser);
      setUserRole(appUser.role);

      if (isLoginEvent) handleRedirect(appUser.role, appUser);
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
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      const isLoginEvent = event === 'SIGNED_IN';
      if (session?.user) {
        fetchAndSetUser(session.user, isLoginEvent);
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

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
        return { success: false, message: error.message || 'فشل تسجيل الدخول' };
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
