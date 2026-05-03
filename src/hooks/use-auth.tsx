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
      const userId = sessionUser.id || sessionUser.user?.id || sessionUser.sub;
      const email = sessionUser.email || sessionUser.user?.email;
      let row: any | null = null;

      const { data: userRows, error } = await supabase.from('users').select('*').eq('id', userId).limit(1);
      if (error) throw new Error(`Database query failed: ${error.message}`);

      if (userRows && userRows.length > 0) {
        row = userRows[0];
      } else if (email) {
        const { data: emailRows, error: emailError } = await supabase.from('users').select('*').eq('email', email).limit(1);
        if (emailError) throw new Error(`Database query failed: ${emailError.message}`);
        if (emailRows && emailRows.length > 0) {
          row = emailRows[0];
          console.warn('Found legacy user record by email fallback for auth user', email);
        }
      }

      let appUser: User;
      if (!row) {
        const isImplicitAdmin = email === 'admin@markazi.com';
        const newUser = {
          id: userId,
          name: sessionUser.user?.user_metadata?.full_name || sessionUser.user?.user_metadata?.name || 'مستخدم جديد',
          email,
          role: isImplicitAdmin ? 'admin' : 'customer',
          store_id: null,
        };

        try {
          const { error: insertErr } = await supabase.from('users').insert([newUser]);
          if (insertErr) throw insertErr;
          row = newUser as any;
        } catch (insertError) {
          console.warn('Failed to create user record in users table:', insertError);
          row = newUser as any;
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

      if (!data?.user) {
        setLoading(false);
        return { success: false, message: 'فشل الحصول على بيانات المستخدم.' };
      }

      const userFetched = await fetchAndSetUser(data.user, true);
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
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
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
