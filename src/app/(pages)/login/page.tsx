
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/services/supabase";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Users, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
        {...props}
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, user, userRole, loading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const handleLoginFailure = (message: string) => {
      toast({
          variant: "destructive",
          title: "فشل تسجيل الدخول",
          description: message,
      });
  };

  const loginDisabled = !isSupabaseConfigured;

  const onSubmit = async (data: LoginForm) => {
    setAuthErrorMessage(null);
    if (loginDisabled) {
      const message = 'خطأ في إعداد النظام. الرجاء التواصل مع الدعم الفني.';
      setAuthErrorMessage(message);
      handleLoginFailure(message);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (!result.success) {
        const message = result.message || "حدث خطأ غير متوقع.";
        setAuthErrorMessage(message);
        handleLoginFailure(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      setAuthErrorMessage(message);
      handleLoginFailure(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      handleLoginFailure('خطأ في إعداد النظام. الرجاء التواصل مع الدعم الفني.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        handleLoginFailure(result.message || "حدث خطأ غير متوقع.");
      }
    } catch (error) {
      handleLoginFailure("حدث خطأ في تسجيل الدخول باستخدام Google.");
    } finally {
      setIsLoading(false);
    }
  };

  // This effect will redirect the user if they are already logged in and visit the login page.
  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'admin') router.push('/admin');
      else if (userRole === 'store') router.push('/dashboard/store');
      else if (userRole === 'representative') router.push('/dashboard/representative');
      else router.push('/');
    }
  }, [user, userRole, router, loading]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl shadow-primary/10">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold font-headline bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              مرحباً بك في مركزي
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              قم بتسجيل الدخول للوصول إلى حسابك
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {loginDisabled && (
              <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-semibold">تنبيه: إعدادات المصادقة غير مكتملة.</p>
                <p className="mt-1 text-destructive-foreground/90">الرجاء مراجعة متغيرات البيئة لـ Supabase قبل المحاولة.</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Google Login */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-12 flex items-center gap-3 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                  disabled={isLoading}
                >
                  <GoogleIcon className="transition-transform duration-200 group-hover:scale-110" />
                  <span className="font-medium">المتابعة باستخدام Google</span>
                </Button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    أو أكمل باستخدام البريد الإلكتروني
                  </span>
                </div>
              </motion.div>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  autoComplete="email"
                  className="h-12 border-2 focus:border-primary transition-colors"
                  disabled={isLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    {errors.email.message}
                  </p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    كلمة المرور
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    {...register("password")}
                    className="h-12 border-2 focus:border-primary pr-12 transition-colors"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    {errors.password.message}
                  </p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      جاري تسجيل الدخول...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>تسجيل الدخول</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>
              </motion.div>

              {authErrorMessage && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center justify-between">
                    <span>{authErrorMessage}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAuthErrorMessage(null);
                        setRetryCount(prev => prev + 1);
                        // Trigger form submission again
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }}
                      disabled={isLoading}
                      className="ml-2 h-8"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Register Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground">
                ليس لديك حساب؟{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:underline transition-colors"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </motion.div>

            {/* User Types Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="pt-4 border-t border-border/50"
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">عميل</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Store className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">متجر</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">مندوب</span>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
