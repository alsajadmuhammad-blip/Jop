"use client";

import React, { useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/services/supabase";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginDisabled = !isSupabaseConfigured;

  const onSubmit = async (data: LoginForm) => {
    setAuthErrorMessage(null);
    if (loginDisabled) {
      const message = "خطأ في إعداد النظام. الرجاء التواصل مع الدعم الفني.";
      setAuthErrorMessage(message);
      toast({ variant: "destructive", title: "فشل تسجيل الدخول", description: message });
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (!result.success) {
        const message = result.message || "حدث خطأ غير متوقع.";
        setAuthErrorMessage(message);
        toast({ variant: "destructive", title: "فشل تسجيل الدخول", description: message });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      setAuthErrorMessage(message);
      toast({ variant: "destructive", title: "فشل تسجيل الدخول", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* خلفية زخرفية */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/8 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/4 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <Card className="bg-white/85 dark:bg-card/85 backdrop-blur-xl border-0 shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            {/* أيقونة */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
              className="mx-auto mb-5 w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>

            <CardTitle className="text-2xl font-bold font-headline bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
              مرحباً بك في مركزي
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              أدخل بياناتك للوصول إلى حسابك
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pb-8 pt-4">
            {/* تنبيه الإعداد */}
            {loginDisabled && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-semibold">تنبيه: إعدادات المصادقة غير مكتملة.</p>
                <p className="mt-1 text-destructive-foreground/80">
                  الرجاء مراجعة متغيرات البيئة لـ Supabase قبل المحاولة.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* البريد الإلكتروني */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-1.5"
              >
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  dir="ltr"
                  className="h-12 border-2 focus:border-primary rounded-xl transition-colors text-left"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </motion.div>

              {/* كلمة المرور */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-1.5"
              >
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                    className="h-12 border-2 focus:border-primary rounded-xl pr-4 pl-11 transition-colors"
                    disabled={isLoading}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </motion.div>

              {/* رسالة الخطأ */}
              {authErrorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-2"
                >
                  <span>{authErrorMessage}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthErrorMessage(null);
                      const form = document.querySelector("form");
                      if (form) form.requestSubmit();
                    }}
                    disabled={isLoading}
                    className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    إعادة المحاولة
                  </button>
                </motion.div>
              )}

              {/* زر تسجيل الدخول */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      جاري تسجيل الدخول...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>تسجيل الدخول</span>
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
